/**
 * SnapDev AI - Code Context & Chunk Extractor
 * Prepares symbol-level code context and structural chunks for Phase 4 RAG.
 * Hierarchical chunking: Function -> Method -> Class -> Interface -> Type -> File Fallback.
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import {
  CodeSymbol,
  CodeChunk,
  SymbolContextResult,
  ParsedFile,
  SymbolKind
} from '../../shared/types';

export class CodeContextExtractor {
  /**
   * Extract the exact source lines corresponding to a symbol.
   */
  public async extractSymbolContext(
    symbol: CodeSymbol
  ): Promise<SymbolContextResult | null> {
    try {
      const fileContent = await fs.readFile(symbol.filePath, 'utf-8');
      const lines = fileContent.split('\n');

      const startIdx = Math.max(0, symbol.startLine - 1);
      const endIdx = Math.min(lines.length, symbol.endLine);

      const snippet = lines.slice(startIdx, endIdx).join('\n');

      return {
        symbol,
        content: snippet,
        startLine: symbol.startLine,
        endLine: symbol.endLine,
        filePath: symbol.filePath,
        relativePath: symbol.relativePath
      };
    } catch (err) {
      console.warn(`[CodeChunker] Could not read source for symbol ${symbol.name}:`, err);
      return null;
    }
  }

  /**
   * Create structured code chunks from parsed file symbols and hierarchy.
   */
  public createChunksFromFile(
    projectId: string,
    fileId: string,
    parsedFile: ParsedFile,
    fileContent: string
  ): CodeChunk[] {
    const lines = fileContent.split('\n');
    const chunks: CodeChunk[] = [];
    const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex');

    // Extract import specifier strings for contextual chunk enrichment
    const importSummaries = (parsedFile.imports || []).map((imp) => {
      const specifiers = imp.specifiers && imp.specifiers.length > 0 ? imp.specifiers.join(', ') : '*';
      return `from "${imp.source}" import ${specifiers}`;
    });

    const coveredLines = new Set<number>();

    // 1-5: Structural symbols according to hierarchy
    const structuralKinds: SymbolKind[] = [
      'function',
      'method',
      'class',
      'interface',
      'type',
      'enum',
      'struct',
      'trait'
    ];

    for (const sym of parsedFile.symbols) {
      if (structuralKinds.includes(sym.kind)) {
        const startIdx = Math.max(0, sym.startLine - 1);
        const endIdx = Math.min(lines.length, sym.endLine);
        const chunkContent = lines.slice(startIdx, endIdx).join('\n');

        // Mark lines as covered
        for (let l = sym.startLine; l <= sym.endLine; l++) {
          coveredLines.add(l);
        }

        chunks.push({
          id: `chunk:${sym.id}`,
          projectId,
          fileId,
          symbolId: sym.id,
          content: chunkContent,
          language: parsedFile.language,
          filePath: parsedFile.filePath,
          relativePath: parsedFile.relativePath,
          startLine: sym.startLine,
          endLine: sym.endLine,
          symbolName: sym.name,
          symbolKind: sym.kind,
          parentSymbol: sym.parentSymbol || undefined,
          imports: importSummaries,
          fileHash,
          metadata: {
            signature: sym.signature,
            documentation: sym.documentation
          }
        });
      }
    }

    // 6-7: Fallback chunks if no symbols or if file has unindexed code blocks > 20 lines
    if (chunks.length === 0 && lines.length > 0) {
      // Chunk entire small file or windowed 60-line chunks
      const CHUNK_WINDOW = 60;
      const CHUNK_OVERLAP = 15;

      for (let i = 0; i < lines.length; i += (CHUNK_WINDOW - CHUNK_OVERLAP)) {
        const startLine = i + 1;
        const endLine = Math.min(lines.length, i + CHUNK_WINDOW);
        const chunkLines = lines.slice(i, endLine);
        const chunkContent = chunkLines.join('\n').trim();

        if (chunkContent.length > 0) {
          chunks.push({
            id: `chunk:${fileId}:fallback:${startLine}-${endLine}`,
            projectId,
            fileId,
            content: chunkContent,
            language: parsedFile.language,
            filePath: parsedFile.filePath,
            relativePath: parsedFile.relativePath,
            startLine,
            endLine,
            symbolName: `file_section_${startLine}`,
            symbolKind: 'module',
            imports: importSummaries,
            fileHash
          });
        }

        if (endLine >= lines.length) {
          break;
        }
      }
    }

    return chunks;
  }
}

export const codeContextExtractor = new CodeContextExtractor();
