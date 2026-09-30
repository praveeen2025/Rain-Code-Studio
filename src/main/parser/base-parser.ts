/**
 * SnapDev AI - Base Code Parser
 * Abstract base class for all language-specific parsers.
 * Guarantees error-tolerant execution: parsers must NEVER crash the application.
 */

import {
  ParsedFile,
  CodeSymbol,
  CodeImport,
  CodeExport,
  ParseError,
  SymbolKind
} from '../../shared/types';

export abstract class CodeParser {
  abstract readonly language: string;
  abstract readonly extensions: readonly string[];

  /**
   * Internal parser implementation to be defined by subclasses.
   */
  protected abstract parseInternal(
    filePath: string,
    relativePath: string,
    content: string
  ): Promise<ParsedFile> | ParsedFile;

  /**
   * Safe parse entry point. Catches any uncaught exceptions and marks file as error/partial.
   */
  public async safeParse(
    filePath: string,
    relativePath: string,
    content: string
  ): Promise<ParsedFile> {
    const lineCount = content.split('\n').length;

    try {
      if (!content.trim()) {
        return {
          filePath,
          relativePath,
          language: this.language,
          lineCount,
          parseStatus: 'indexed',
          parseErrors: [],
          symbols: [],
          imports: [],
          exports: [],
          dependencies: []
        };
      }

      const result = await this.parseInternal(filePath, relativePath, content);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[Parser] Non-fatal error parsing ${relativePath}: ${message}`);

      return {
        filePath,
        relativePath,
        language: this.language,
        lineCount,
        parseStatus: 'error',
        parseErrors: [
          {
            message: `Parser error: ${message}`,
            severity: 'error'
          }
        ],
        symbols: [],
        imports: [],
        exports: [],
        dependencies: []
      };
    }
  }

  // Common helper factories
  protected createSymbol(params: {
    id?: string;
    name: string;
    kind: SymbolKind;
    language: string;
    filePath: string;
    relativePath: string;
    startLine: number;
    endLine: number;
    startColumn?: number;
    endColumn?: number;
    parentSymbol?: string | null;
    signature?: string;
    documentation?: string;
    children?: CodeSymbol[];
  }): CodeSymbol {
    const id =
      params.id ||
      `${params.filePath}:${params.kind}:${params.name}:${params.startLine}`;

    return {
      id,
      name: params.name,
      kind: params.kind,
      language: params.language,
      filePath: params.filePath,
      relativePath: params.relativePath,
      startLine: params.startLine,
      endLine: params.endLine,
      startColumn: params.startColumn ?? 1,
      endColumn: params.endColumn ?? 1,
      parentSymbol: params.parentSymbol ?? null,
      signature: params.signature,
      documentation: params.documentation,
      children: params.children || []
    };
  }

  protected createImport(params: {
    source: string;
    specifiers: string[];
    isDefault?: boolean;
    isNamespace?: boolean;
    line: number;
  }): CodeImport {
    return {
      id: `${params.source}:${params.line}`,
      source: params.source,
      specifiers: params.specifiers,
      isDefault: params.isDefault ?? false,
      isNamespace: params.isNamespace ?? false,
      line: params.line
    };
  }

  protected createExport(params: {
    name: string;
    kind?: string;
    line: number;
    isDefault?: boolean;
  }): CodeExport {
    return {
      id: `${params.name}:${params.line}`,
      name: params.name,
      kind: params.kind || 'export',
      line: params.line,
      isDefault: params.isDefault ?? false
    };
  }

  protected createParseError(
    message: string,
    line?: number,
    column?: number,
    severity: 'warning' | 'error' = 'error'
  ): ParseError {
    return { message, line, column, severity };
  }
}
