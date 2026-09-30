/**
 * SnapDev AI - Index Repository Layer
 * Manages CRUD operations and searches across SQLite for indexed codebases.
 */

import crypto from 'crypto';
import path from 'path';
import { sqliteManager } from './sqlite-manager';
import {
  Project,
  ParsedFile,
  CodeSymbol,
  ProjectIndexStatus,
  ProjectStatistics,
  SymbolSearchQuery,
  SymbolKind,
  CodeChunk
} from '../../shared/types';

export class IndexRepository {
  /**
   * Save or update project record in SQLite.
   */
  public upsertProject(project: Project): void {
    const existing = sqliteManager.query<{ id: string }>(
      'SELECT id FROM projects WHERE id = ?',
      [project.id]
    );

    if (existing.length === 0) {
      sqliteManager.run(
        `INSERT INTO projects (id, name, path, is_demo, created_at, last_opened, index_status, last_indexed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          project.id,
          project.name,
          project.path,
          project.isDemo ? 1 : 0,
          project.createdAt,
          project.lastOpened,
          'not_indexed',
          null
        ]
      );
    } else {
      sqliteManager.run(
        `UPDATE projects SET name = ?, path = ?, last_opened = ? WHERE id = ?`,
        [project.name, project.path, project.lastOpened, project.id]
      );
    }
  }

  public setProjectIndexStatus(projectId: string, status: ProjectIndexStatus): void {
    const now = status === 'indexed' ? new Date().toISOString() : null;
    sqliteManager.run(
      `UPDATE projects SET index_status = ?, last_indexed_at = COALESCE(?, last_indexed_at) WHERE id = ?`,
      [status, now, projectId]
    );
  }

  public getProjectIndexStatus(projectId: string): ProjectIndexStatus {
    const rows = sqliteManager.query<{ index_status: ProjectIndexStatus }>(
      'SELECT index_status FROM projects WHERE id = ?',
      [projectId]
    );
    return rows.length > 0 ? rows[0].index_status : 'not_indexed';
  }

  /**
   * Replace or insert a single parsed file and all its associated symbols, imports, and exports.
   */
  public saveParsedFile(
    projectId: string,
    parsedFile: ParsedFile,
    lastModified = Date.now()
  ): void {
    const fileId = crypto.createHash('md5').update(path.resolve(parsedFile.filePath).toLowerCase()).digest('hex');

    // Delete existing records for this file (cascades or explicit deletes)
    sqliteManager.run('DELETE FROM symbols WHERE file_id = ?', [fileId]);
    sqliteManager.run('DELETE FROM imports WHERE file_id = ?', [fileId]);
    sqliteManager.run('DELETE FROM exports WHERE file_id = ?', [fileId]);
    sqliteManager.run('DELETE FROM parse_errors WHERE file_id = ?', [fileId]);
    sqliteManager.run('DELETE FROM files WHERE id = ?', [fileId]);

    // Insert file row
    sqliteManager.run(
      `INSERT OR REPLACE INTO files (id, project_id, path, relative_path, language, size, line_count, parse_status, last_modified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fileId,
        projectId,
        parsedFile.filePath,
        parsedFile.relativePath,
        parsedFile.language,
        0,
        parsedFile.lineCount,
        parsedFile.parseStatus,
        lastModified
      ]
    );

    // Insert symbols
    for (const sym of parsedFile.symbols) {
      sqliteManager.run(
        `INSERT OR REPLACE INTO symbols (id, file_id, project_id, name, kind, language, start_line, end_line, start_column, end_column, parent_symbol, signature, documentation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sym.id,
          fileId,
          projectId,
          sym.name,
          sym.kind,
          sym.language,
          sym.startLine,
          sym.endLine,
          sym.startColumn,
          sym.endColumn,
          sym.parentSymbol || null,
          sym.signature || null,
          sym.documentation || null
        ]
      );
    }

    // Insert imports
    for (const imp of parsedFile.imports) {
      sqliteManager.run(
        `INSERT OR REPLACE INTO imports (id, file_id, project_id, source, specifiers, is_default, is_namespace, line)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          imp.id,
          fileId,
          projectId,
          imp.source,
          JSON.stringify(imp.specifiers),
          imp.isDefault ? 1 : 0,
          imp.isNamespace ? 1 : 0,
          imp.line
        ]
      );
    }

    // Insert exports
    for (const exp of parsedFile.exports) {
      sqliteManager.run(
        `INSERT OR REPLACE INTO exports (id, file_id, project_id, name, kind, line, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          exp.id,
          fileId,
          projectId,
          exp.name,
          exp.kind,
          exp.line,
          exp.isDefault ? 1 : 0
        ]
      );
    }

    // Insert parse errors
    for (const err of parsedFile.parseErrors) {
      sqliteManager.run(
        `INSERT INTO parse_errors (id, file_id, project_id, message, line, column, severity)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          `${fileId}:${err.line || 0}:${err.column || 0}:${Math.random().toString(36).substring(2, 6)}`,
          fileId,
          projectId,
          err.message,
          err.line || null,
          err.column || null,
          err.severity
        ]
      );
    }
  }

  /**
   * Delete a file and its index from SQLite.
   */
  public deleteFile(projectId: string, filePath: string): void {
    const fileId = crypto.createHash('md5').update(path.resolve(filePath).toLowerCase()).digest('hex');
    sqliteManager.run('DELETE FROM symbols WHERE file_id = ? AND project_id = ?', [fileId, projectId]);
    sqliteManager.run('DELETE FROM imports WHERE file_id = ? AND project_id = ?', [fileId, projectId]);
    sqliteManager.run('DELETE FROM exports WHERE file_id = ? AND project_id = ?', [fileId, projectId]);
    sqliteManager.run('DELETE FROM parse_errors WHERE file_id = ? AND project_id = ?', [fileId, projectId]);
    sqliteManager.run('DELETE FROM files WHERE id = ? AND project_id = ?', [fileId, projectId]);
  }

  /**
   * Get all symbols, imports, and exports for a specific file.
   */
  public getFileSymbols(projectId: string, filePath: string): ParsedFile | null {
    const fileRows = sqliteManager.query<{
      id: string;
      path: string;
      relative_path: string;
      language: string;
      line_count: number;
      parse_status: string;
    }>(
      'SELECT id, path, relative_path, language, line_count, parse_status FROM files WHERE project_id = ? AND path = ?',
      [projectId, filePath]
    );

    if (fileRows.length === 0) return null;
    const file = fileRows[0];

    const symbols = sqliteManager.query<{
      id: string;
      name: string;
      kind: SymbolKind;
      language: string;
      start_line: number;
      end_line: number;
      start_column: number;
      end_column: number;
      parent_symbol: string | null;
      signature: string | null;
      documentation: string | null;
    }>(
      'SELECT id, name, kind, language, start_line, end_line, start_column, end_column, parent_symbol, signature, documentation FROM symbols WHERE file_id = ? ORDER BY start_line ASC',
      [file.id]
    ).map((s) => ({
      id: s.id,
      name: s.name,
      kind: s.kind,
      language: s.language,
      filePath: file.path,
      relativePath: file.relative_path,
      startLine: s.start_line,
      endLine: s.end_line,
      startColumn: s.start_column,
      endColumn: s.end_column,
      parentSymbol: s.parent_symbol,
      signature: s.signature || undefined,
      documentation: s.documentation || undefined
    }));

    const imports = sqliteManager.query<{
      id: string;
      source: string;
      specifiers: string;
      is_default: number;
      is_namespace: number;
      line: number;
    }>(
      'SELECT id, source, specifiers, is_default, is_namespace, line FROM imports WHERE file_id = ? ORDER BY line ASC',
      [file.id]
    ).map((i) => ({
      id: i.id,
      source: i.source,
      specifiers: JSON.parse(i.specifiers || '[]'),
      isDefault: Boolean(i.is_default),
      isNamespace: Boolean(i.is_namespace),
      line: i.line
    }));

    const exportsList = sqliteManager.query<{
      id: string;
      name: string;
      kind: string;
      line: number;
      is_default: number;
    }>(
      'SELECT id, name, kind, line, is_default FROM exports WHERE file_id = ? ORDER BY line ASC',
      [file.id]
    ).map((e) => ({
      id: e.id,
      name: e.name,
      kind: e.kind,
      line: e.line,
      isDefault: Boolean(e.is_default)
    }));

    const parseErrors = sqliteManager.query<{
      message: string;
      line: number | null;
      column: number | null;
      severity: 'warning' | 'error';
    }>(
      'SELECT message, line, column, severity FROM parse_errors WHERE file_id = ?',
      [file.id]
    ).map((err) => ({
      message: err.message,
      line: err.line || undefined,
      column: err.column || undefined,
      severity: err.severity
    }));

    return {
      filePath: file.path,
      relativePath: file.relative_path,
      language: file.language,
      lineCount: file.line_count,
      parseStatus: file.parse_status as ParsedFile['parseStatus'],
      parseErrors,
      symbols,
      imports,
      exports: exportsList,
      dependencies: imports.map((i) => i.source)
    };
  }

  /**
   * Search symbols across the project by query, kind, and language.
   */
  public searchSymbols(
    projectId: string,
    query: SymbolSearchQuery
  ): CodeSymbol[] {
    let sql = `
      SELECT s.id, s.name, s.kind, s.language, s.start_line, s.end_line,
             s.start_column, s.end_column, s.parent_symbol, s.signature, s.documentation,
             f.path as file_path, f.relative_path
      FROM symbols s
      JOIN files f ON s.file_id = f.id
      WHERE s.project_id = ?
    `;
    const params: (string | number)[] = [projectId];

    if (query.query && query.query.trim()) {
      sql += ' AND s.name LIKE ?';
      params.push(`%${query.query.trim()}%`);
    }

    if (query.kind && query.kind !== 'all') {
      sql += ' AND s.kind = ?';
      params.push(query.kind);
    }

    if (query.language) {
      sql += ' AND s.language = ?';
      params.push(query.language);
    }

    sql += ' ORDER BY s.name ASC LIMIT ?';
    params.push(query.limit || 50);

    const rows = sqliteManager.query<{
      id: string;
      name: string;
      kind: SymbolKind;
      language: string;
      start_line: number;
      end_line: number;
      start_column: number;
      end_column: number;
      parent_symbol: string | null;
      signature: string | null;
      documentation: string | null;
      file_path: string;
      relative_path: string;
    }>(sql, params);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      kind: r.kind,
      language: r.language,
      filePath: r.file_path,
      relativePath: r.relative_path,
      startLine: r.start_line,
      endLine: r.end_line,
      startColumn: r.start_column,
      endColumn: r.end_column,
      parentSymbol: r.parent_symbol,
      signature: r.signature || undefined,
      documentation: r.documentation || undefined
    }));
  }

  /**
   * Get single symbol by ID.
   */
  public getSymbolById(symbolId: string): CodeSymbol | null {
    const rows = sqliteManager.query<{
      id: string;
      name: string;
      kind: SymbolKind;
      language: string;
      start_line: number;
      end_line: number;
      start_column: number;
      end_column: number;
      parent_symbol: string | null;
      signature: string | null;
      documentation: string | null;
      file_path: string;
      relative_path: string;
    }>(
      `SELECT s.id, s.name, s.kind, s.language, s.start_line, s.end_line,
              s.start_column, s.end_column, s.parent_symbol, s.signature, s.documentation,
              f.path as file_path, f.relative_path
       FROM symbols s
       JOIN files f ON s.file_id = f.id
       WHERE s.id = ?`,
      [symbolId]
    );

    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      kind: r.kind,
      language: r.language,
      filePath: r.file_path,
      relativePath: r.relative_path,
      startLine: r.start_line,
      endLine: r.end_line,
      startColumn: r.start_column,
      endColumn: r.end_column,
      parentSymbol: r.parent_symbol,
      signature: r.signature || undefined,
      documentation: r.documentation || undefined
    };
  }

  /**
   * Aggregate statistics for Code Intelligence dashboard.
   */
  public getProjectStatistics(projectId: string): ProjectStatistics {
    const fileCount = sqliteManager.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM files WHERE project_id = ?',
      [projectId]
    )[0]?.count || 0;

    const symbolCount = sqliteManager.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM symbols WHERE project_id = ?',
      [projectId]
    )[0]?.count || 0;

    const functions = sqliteManager.query<{ count: number }>(
      "SELECT COUNT(*) as count FROM symbols WHERE project_id = ? AND (kind = 'function' OR kind = 'method')",
      [projectId]
    )[0]?.count || 0;

    const classes = sqliteManager.query<{ count: number }>(
      "SELECT COUNT(*) as count FROM symbols WHERE project_id = ? AND (kind = 'class' OR kind = 'struct')",
      [projectId]
    )[0]?.count || 0;

    const interfaces = sqliteManager.query<{ count: number }>(
      "SELECT COUNT(*) as count FROM symbols WHERE project_id = ? AND kind = 'interface'",
      [projectId]
    )[0]?.count || 0;

    const types = sqliteManager.query<{ count: number }>(
      "SELECT COUNT(*) as count FROM symbols WHERE project_id = ? AND (kind = 'type' OR kind = 'enum')",
      [projectId]
    )[0]?.count || 0;

    const variables = sqliteManager.query<{ count: number }>(
      "SELECT COUNT(*) as count FROM symbols WHERE project_id = ? AND (kind = 'variable' OR kind = 'constant' OR kind = 'property')",
      [projectId]
    )[0]?.count || 0;

    const imports = sqliteManager.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM imports WHERE project_id = ?',
      [projectId]
    )[0]?.count || 0;

    const exportsCount = sqliteManager.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM exports WHERE project_id = ?',
      [projectId]
    )[0]?.count || 0;

    const parseErrors = sqliteManager.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM parse_errors WHERE project_id = ?',
      [projectId]
    )[0]?.count || 0;

    return {
      totalFiles: fileCount,
      sourceFiles: fileCount,
      totalSymbols: symbolCount,
      functions,
      classes,
      interfaces,
      types,
      variables,
      imports,
      exports: exportsCount,
      parseErrors
    };
  }

  /**
   * Prepare CodeChunk list for Phase 4 RAG pipeline without embeddings.
   */
  public getAllCodeChunks(projectId: string): CodeChunk[] {
    const symbols = sqliteManager.query<{
      id: string;
      name: string;
      kind: SymbolKind;
      language: string;
      start_line: number;
      end_line: number;
      signature: string | null;
      file_id: string;
      file_path: string;
    }>(
      `SELECT s.id, s.name, s.kind, s.language, s.start_line, s.end_line, s.signature,
              s.file_id, f.path as file_path
       FROM symbols s
       JOIN files f ON s.file_id = f.id
       WHERE s.project_id = ?`,
      [projectId]
    );

    return symbols.map((s) => ({
      id: `chunk:${s.id}`,
      projectId,
      fileId: s.file_id,
      symbolId: s.id,
      content: s.signature || s.name,
      language: s.language,
      filePath: s.file_path,
      startLine: s.start_line,
      endLine: s.end_line,
      symbolName: s.name,
      symbolKind: s.kind
    }));
  }
}

export const indexRepository = new IndexRepository();
