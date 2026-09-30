/**
 * SnapDev AI - Parser Registry & Dispatcher
 * Central registry mapping source files to specialized language AST parsers.
 */

import path from 'path';
import { CodeParser } from './base-parser';
import { TypeScriptParser } from './typescript-parser';
import { PythonParser } from './python-parser';
import { JavaParser } from './java-parser';
import { CppParser } from './c-cpp-parser';
import { CSharpParser } from './csharp-parser';
import { GoParser } from './go-parser';
import { RustParser } from './rust-parser';
import { ParsedFile } from '../../shared/types';

export class ParserRegistry {
  private parsers: CodeParser[] = [];
  private extensionMap: Map<string, CodeParser> = new Map();

  constructor() {
    this.registerParser(new TypeScriptParser());
    this.registerParser(new PythonParser());
    this.registerParser(new JavaParser());
    this.registerParser(new CppParser());
    this.registerParser(new CSharpParser());
    this.registerParser(new GoParser());
    this.registerParser(new RustParser());
  }

  public registerParser(parser: CodeParser): void {
    this.parsers.push(parser);
    for (const ext of parser.extensions) {
      this.extensionMap.set(ext.toLowerCase(), parser);
    }
  }

  public getParserForFile(filePath: string): CodeParser | null {
    const ext = path.extname(filePath).toLowerCase();
    return this.extensionMap.get(ext) || null;
  }

  public isSupportedSourceFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.extensionMap.has(ext);
  }

  public getSupportedExtensions(): string[] {
    return Array.from(this.extensionMap.keys());
  }

  public async parseFile(
    filePath: string,
    relativePath: string,
    content: string
  ): Promise<ParsedFile> {
    const parser = this.getParserForFile(filePath);

    if (!parser) {
      const lineCount = content.split('\n').length;
      return {
        filePath,
        relativePath,
        language: 'Unsupported',
        lineCount,
        parseStatus: 'unsupported',
        parseErrors: [],
        symbols: [],
        imports: [],
        exports: [],
        dependencies: []
      };
    }

    return parser.safeParse(filePath, relativePath, content);
  }
}

// Global registry instance
export const parserRegistry = new ParserRegistry();
export { CodeParser } from './base-parser';
export { TypeScriptParser } from './typescript-parser';
export { PythonParser } from './python-parser';
