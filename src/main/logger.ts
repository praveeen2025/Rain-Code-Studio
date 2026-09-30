/**
 * SnapDev AI - Structured Local Application Logger (Main Process)
 * Implements privacy-preserving, structured logging with secret redaction.
 * Levels: DEBUG, INFO, WARN, ERROR
 * Categories: startup, backend, project, ai, rag, git, patch, security, system
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
export type LogCategory =
  | 'startup'
  | 'backend'
  | 'project'
  | 'ai'
  | 'rag'
  | 'git'
  | 'patch'
  | 'security'
  | 'system';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: string;
}

// Patterns for sensitive values that must be redacted
const SENSITIVE_PATTERNS = [
  /(?:bearer\s+)([a-zA-Z0-9_\-\.]{10,})/gi,
  /(?:api[_-]?key|secret|token|password|passwd|auth)=([^\s&;]+)/gi,
  /(?:-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]+?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----)/g
];

export function redactSecrets(text: string): string {
  if (!text) return text;
  let redacted = text;
  for (const pattern of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, '[REDACTED_SECRET]');
  }
  return redacted;
}

export class AppLogger {
  private buffer: LogEntry[] = [];
  private maxBufferSize = 1000;

  public log(level: LogLevel, category: LogCategory, message: string, details?: unknown): void {
    const cleanMessage = redactSecrets(message);
    let cleanDetails: string | undefined;
    if (details) {
      const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);
      cleanDetails = redactSecrets(detailsStr);
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message: cleanMessage,
      details: cleanDetails
    };

    this.buffer.push(entry);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    // Mirror to console
    const prefix = `[${entry.timestamp}] [${entry.level}] [${entry.category}]`;
    if (level === 'ERROR') {
      console.error(`${prefix} ${cleanMessage}`, cleanDetails || '');
    } else if (level === 'WARN') {
      console.warn(`${prefix} ${cleanMessage}`, cleanDetails || '');
    } else if (level === 'INFO') {
      console.log(`${prefix} ${cleanMessage}`, cleanDetails || '');
    } else {
      console.debug(`${prefix} ${cleanMessage}`, cleanDetails || '');
    }
  }

  public debug(category: LogCategory, message: string, details?: unknown): void {
    this.log('DEBUG', category, message, details);
  }

  public info(category: LogCategory, message: string, details?: unknown): void {
    this.log('INFO', category, message, details);
  }

  public warn(category: LogCategory, message: string, details?: unknown): void {
    this.log('WARN', category, message, details);
  }

  public error(category: LogCategory, message: string, details?: unknown): void {
    this.log('ERROR', category, message, details);
  }

  public getRecentLogs(limit = 100): LogEntry[] {
    return this.buffer.slice(-limit);
  }

  public clear(): void {
    this.buffer = [];
  }
}

export const logger = new AppLogger();
