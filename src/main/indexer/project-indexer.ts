/**
 * SnapDev AI - Project Indexer
 * Orchestrates full project scans, multi-language AST parsing, controlled batching,
 * progress emission, and incremental re-indexing.
 */

import fs from 'fs/promises';
import path from 'path';
import { parserRegistry } from '../parser';
import { indexRepository } from '../database/index-repository';
import {
  Project,
  ProjectIndexStatus,
  IndexProgress,
  ProjectStatistics,
  ParsedFile,
  CodeSymbol,
  SymbolSearchQuery,
  SymbolContextResult,
  CodeChunk
} from '../../shared/types';
import { codeContextExtractor } from './code-chunker';
import { ragBackendClient } from '../rag/rag-backend-client';

type ProgressListener = (progress: IndexProgress) => void;
type StatusListener = (status: ProjectIndexStatus) => void;

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  '__pycache__',
  '.pytest_cache',
  'dist',
  'out',
  'build',
  '.venv',
  'venv',
  'database',
  '.idea',
  '.vscode',
  '.snapdev-backups',
  '.snapdev-logs'
]);

export const SENSITIVE_FILE_PATTERNS = [
  /^\.env(\..+)?$/i,
  /^id_(rsa|dsa|ecdsa|ed25519)$/i,
  /\.(pem|key|pfx|p12|kdbx)$/i,
  /credentials\.json$/i,
  /service[-_]account.*\.json$/i,
  /\.secret$/i
];

export function isSensitiveFile(fileName: string): boolean {
  return SENSITIVE_FILE_PATTERNS.some((pattern) => pattern.test(fileName));
}

export class ProjectIndexer {
  private currentProjectId: string | null = null;
  private currentProjectPath: string | null = null;
  private indexStatus: ProjectIndexStatus = 'not_indexed';
  private progress: IndexProgress = {
    totalFiles: 0,
    sourceFiles: 0,
    parsedFiles: 0,
    partialFiles: 0,
    errorFiles: 0
  };
  private isCancelled = false;
  private progressListeners: Set<ProgressListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();

  public getStatus(): ProjectIndexStatus {
    return this.indexStatus;
  }

  public getCurrentProjectPath(): string | null {
    return this.currentProjectPath;
  }

  public getProgress(): IndexProgress {
    return { ...this.progress };
  }

  public onProgress(listener: ProgressListener): () => void {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  }

  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(status: ProjectIndexStatus): void {
    this.indexStatus = status;
    if (this.currentProjectId) {
      indexRepository.setProjectIndexStatus(this.currentProjectId, status);
    }
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  private notifyProgress(): void {
    for (const listener of this.progressListeners) {
      listener({ ...this.progress });
    }
  }

  /**
   * Find all files recursively in the project directory.
   */
  private async discoverFiles(dir: string): Promise<string[]> {
    const results: string[] = [];

    const walk = async (current: string) => {
      let entries;
      try {
        entries = await fs.readdir(current, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        if (IGNORED_DIRS.has(entry.name)) {
          continue;
        }

        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          if (!isSensitiveFile(entry.name)) {
            results.push(fullPath);
          }
        }
      }
    };

    await walk(dir);
    return results;
  }

  /**
   * Index entire project asynchronously with controlled batching.
   */
  public async indexProject(project: Project): Promise<boolean> {
    this.currentProjectId = project.id;
    this.currentProjectPath = project.path;
    this.isCancelled = false;

    indexRepository.upsertProject(project);

    this.setStatus('indexing');
    console.log(`[Indexer] Starting full indexing for project: ${project.name}`);

    try {
      const allFiles = await this.discoverFiles(project.path);
      const sourceFiles = allFiles.filter((f) => parserRegistry.isSupportedSourceFile(f));

      this.progress = {
        totalFiles: allFiles.length,
        sourceFiles: sourceFiles.length,
        parsedFiles: 0,
        partialFiles: 0,
        errorFiles: 0
      };
      this.notifyProgress();

      if (sourceFiles.length === 0) {
        this.setStatus('indexed');
        return true;
      }

      const allChunks: CodeChunk[] = [];
      const BATCH_SIZE = 15;
      for (let i = 0; i < sourceFiles.length; i += BATCH_SIZE) {
        if (this.isCancelled) {
          console.log('[Indexer] Indexing cancelled.');
          this.setStatus('not_indexed');
          return false;
        }

        const batch = sourceFiles.slice(i, i + BATCH_SIZE);

        await Promise.all(
          batch.map(async (filePath) => {
            const relPath = path.relative(project.path, filePath).replace(/\\/g, '/');
            this.progress.currentFile = relPath;

            try {
              const content = await fs.readFile(filePath, 'utf-8');
              const parsed = await parserRegistry.parseFile(filePath, relPath, content);

              const stats = await fs.stat(filePath);
              indexRepository.saveParsedFile(project.id, parsed, stats.mtimeMs);

              const fileId = Buffer.from(filePath).toString('base64').substring(0, 32);
              const fileChunks = codeContextExtractor.createChunksFromFile(
                project.id,
                fileId,
                parsed,
                content
              );
              allChunks.push(...fileChunks);

              if (parsed.parseStatus === 'indexed') {
                this.progress.parsedFiles++;
              } else if (parsed.parseStatus === 'partial') {
                this.progress.partialFiles++;
              } else {
                this.progress.errorFiles++;
              }
            } catch (err) {
              console.warn(`[Indexer] Failed to process ${relPath}:`, err);
              this.progress.errorFiles++;
            }
          })
        );

        this.notifyProgress();
        // Give event loop breathing room
        await new Promise((resolve) => setTimeout(resolve, 15));
      }

      const finalStatus: ProjectIndexStatus =
        this.progress.errorFiles > 0 && this.progress.parsedFiles === 0
          ? 'error'
          : this.progress.partialFiles > 0 || this.progress.errorFiles > 0
          ? 'partial'
          : 'indexed';

      this.setStatus(finalStatus);
      console.log(
        `[Indexer] Indexing complete: ${this.progress.parsedFiles} indexed, ${this.progress.partialFiles} partial, ${this.progress.errorFiles} errors.`
      );

      // Phase 4: Submit code chunks to local vector store
      if (allChunks.length > 0) {
        console.log(`[Indexer] Submitting ${allChunks.length} chunks to local RAG vector store...`);
        ragBackendClient.indexProject(project.id, project.path, allChunks).catch((err) => {
          console.warn('[Indexer] Background RAG vector indexing deferred:', err);
        });
      }

      return true;
    } catch (err) {
      console.error('[Indexer] Fatal indexing error:', err);
      this.setStatus('error');
      return false;
    }
  }

  /**
   * Incremental single-file re-index when a source file is modified or created.
   */
  public async indexSingleFile(
    projectId: string,
    projectRoot: string,
    filePath: string
  ): Promise<ParsedFile | null> {
    if (!parserRegistry.isSupportedSourceFile(filePath)) {
      return null;
    }

    const relPath = path.relative(projectRoot, filePath).replace(/\\/g, '/');

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = await parserRegistry.parseFile(filePath, relPath, content);
      const stats = await fs.stat(filePath);

      indexRepository.saveParsedFile(projectId, parsed, stats.mtimeMs);
      console.log(`[Indexer] Incrementally updated index for: ${relPath}`);

      // Refresh status if we were indexed
      if (this.indexStatus !== 'indexing') {
        this.setStatus('indexed');
      }

      // Phase 4: Incremental vector update for modified file
      const fileId = Buffer.from(filePath).toString('base64').substring(0, 32);
      const chunks = codeContextExtractor.createChunksFromFile(
        projectId,
        fileId,
        parsed,
        content
      );
      ragBackendClient.updateFile(projectId, filePath, fileId, chunks).catch((err) => {
        console.warn(`[Indexer] Could not update RAG vectors for ${relPath}:`, err);
      });

      return parsed;
    } catch (err) {
      console.warn(`[Indexer] Could not re-index ${relPath}:`, err);
      return null;
    }
  }

  /**
   * Remove a deleted file from the local index.
   */
  public removeFile(projectId: string, filePath: string): void {
    indexRepository.deleteFile(projectId, filePath);
    console.log(`[Indexer] Removed deleted file from index: ${filePath}`);
    ragBackendClient.deleteFile(projectId, filePath).catch((err) => {
      console.warn(`[Indexer] Could not delete RAG vectors for ${filePath}:`, err);
    });
  }

  /**
   * Re-index all chunks for a project into the RAG vector store.
   */
  public async indexProjectRag(
    projectId: string
  ): Promise<{ success: boolean; vectorsCount: number; indexingTimeMs: number }> {
    const project = this.currentProjectPath
      ? { id: projectId, path: this.currentProjectPath }
      : null;
    if (!project) {
      return { success: false, vectorsCount: 0, indexingTimeMs: 0 };
    }

    const allFiles = await this.discoverFiles(project.path);
    const sourceFiles = allFiles.filter((f) => parserRegistry.isSupportedSourceFile(f));
    const allChunks: CodeChunk[] = [];

    for (const filePath of sourceFiles) {
      const relPath = path.relative(project.path, filePath).replace(/\\/g, '/');
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = await parserRegistry.parseFile(filePath, relPath, content);
        const fileId = Buffer.from(filePath).toString('base64').substring(0, 32);
        const chunks = codeContextExtractor.createChunksFromFile(
          projectId,
          fileId,
          parsed,
          content
        );
        allChunks.push(...chunks);
      } catch (err) {
        console.warn(`[Indexer] Failed to extract chunks for ${relPath}:`, err);
      }
    }

    return ragBackendClient.indexProject(projectId, project.path, allChunks);
  }

  /**
   * Search symbols in active project.
   */
  public searchSymbols(projectId: string, query: SymbolSearchQuery): CodeSymbol[] {
    return indexRepository.searchSymbols(projectId, query);
  }

  /**
   * Retrieve file symbols and structure.
   */
  public getFileSymbols(projectId: string, filePath: string): ParsedFile | null {
    return indexRepository.getFileSymbols(projectId, filePath);
  }

  /**
   * Retrieve full statistics for active project.
   */
  public getStatistics(projectId: string): ProjectStatistics {
    return indexRepository.getProjectStatistics(projectId);
  }

  /**
   * Extract source code context for a symbol.
   */
  public async getSymbolContext(
    symbolId: string
  ): Promise<SymbolContextResult | null> {
    const symbol = indexRepository.getSymbolById(symbolId);
    if (!symbol) return null;
    return codeContextExtractor.extractSymbolContext(symbol);
  }

  public cancel(): void {
    this.isCancelled = true;
  }
}

export const projectIndexer = new ProjectIndexer();
