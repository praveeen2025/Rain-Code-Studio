/**
 * SnapDev AI - SQLite Manager
 * Portable WebAssembly SQLite engine backed by persistent disk storage.
 * Ensures zero native build issues while executing standard SQL transactions and queries.
 */

import initSqlJs, { Database, SqlValue } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { SCHEMA_SQL } from './schema';

export class SQLiteManager {
  private db: Database | null = null;
  private dbPath: string;
  private saveTimeout: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    // In production or tests, store in database/ directory
    const baseDir = app ? app.getAppPath() : process.cwd();
    this.dbPath = path.join(baseDir, 'database', 'snapdev.sqlite');
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }

    // Ensure database folder exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const SQL = await initSqlJs();

    let data: Buffer | null = null;
    if (fs.existsSync(this.dbPath)) {
      try {
        data = fs.readFileSync(this.dbPath);
      } catch (err) {
        console.warn('[SQLite] Failed to read existing db file, creating new:', err);
      }
    }

    this.db = data ? new SQL.Database(data) : new SQL.Database();
    this.db.run(SCHEMA_SQL);
    this.saveToDiskSync();
    this.isInitialized = true;
    console.log(`[SQLite] Database initialized at ${this.dbPath}`);
  }

  private getDb(): Database {
    if (!this.db) {
      throw new Error('[SQLite] Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Run a statement with optional parameters (INSERT, UPDATE, DELETE).
   */
  public run(sql: string, params: SqlValue[] = []): void {
    const db = this.getDb();
    db.run(sql, params);
    this.scheduleSave();
  }

  /**
   * Execute a query and return results as an array of objects.
   */
  public query<T = Record<string, unknown>>(sql: string, params: SqlValue[] = []): T[] {
    const db = this.getDb();
    const stmt = db.prepare(sql);
    try {
      stmt.bind(params);
      const rows: T[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as unknown as T);
      }
      return rows;
    } finally {
      stmt.free();
    }
  }

  /**
   * Execute raw SQL string.
   */
  public exec(sql: string): void {
    const db = this.getDb();
    db.exec(sql);
    this.scheduleSave();
  }

  /**
   * Save the in-memory SQLite database to disk with debouncing.
   */
  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveToDiskSync();
      this.saveTimeout = null;
    }, 500);
  }

  public saveToDiskSync(): void {
    if (!this.db) return;
    try {
      const binary = this.db.export();
      const buffer = Buffer.from(binary);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (err) {
      console.error('[SQLite] Failed to persist database to disk:', err);
    }
  }

  public close(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveToDiskSync();
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

export const sqliteManager = new SQLiteManager();
