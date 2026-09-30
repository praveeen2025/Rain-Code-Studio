/**
 * SnapDev AI - Java Code Parser
 * Extracts packages, imports, classes, interfaces, enums, records, constructors, methods, and fields.
 */

import { CodeParser } from './base-parser';
import { ParsedFile, CodeSymbol, CodeImport, CodeExport, ParseError } from '../../shared/types';

export class JavaParser extends CodeParser {
  readonly language = 'Java';
  readonly extensions = ['.java'] as const;

  protected parseInternal(
    filePath: string,
    relativePath: string,
    content: string
  ): ParsedFile {
    const lines = content.split('\n');
    const symbols: CodeSymbol[] = [];
    const imports: CodeImport[] = [];
    const exportsList: CodeExport[] = [];
    const parseErrors: ParseError[] = [];
    const dependenciesSet = new Set<string>();

    let currentClassName: string | null = null;
    let braceDepth = 0;
    let classBraceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i].trim();

      if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
        continue;
      }

      // 1. Imports
      const importMatch = line.match(/^import\s+(?:static\s+)?([a-zA-Z0-9_.*]+);/);
      if (importMatch) {
        const source = importMatch[1];
        dependenciesSet.add(source);
        imports.push(
          this.createImport({
            source,
            specifiers: [source.split('.').pop() || source],
            isDefault: false,
            isNamespace: source.endsWith('.*'),
            line: lineNum
          })
        );
        continue;
      }

      // Track braces
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;

      // 2. Class, Interface, Enum, Record declarations
      const classMatch = line.match(
        /(?:public\s+|protected\s+|private\s+)?(?:abstract\s+|final\s+|static\s+)*(class|interface|enum|record)\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:<[^>]+>)?(?:\s+extends\s+[a-zA-Z0-9_<>,\s]+)?(?:\s+implements\s+[a-zA-Z0-9_<>,\s]+)?/
      );
      if (classMatch && !line.includes(';') && !line.includes('(')) {
        const typeKind = classMatch[1] as 'class' | 'interface' | 'enum';
        const name = classMatch[2];
        currentClassName = name;
        classBraceDepth = braceDepth;

        const sym = this.createSymbol({
          name,
          kind: typeKind === 'interface' ? 'interface' : typeKind === 'enum' ? 'enum' : 'class',
          language: this.language,
          filePath,
          relativePath,
          startLine: lineNum,
          endLine: lines.length,
          signature: line.split('{')[0].trim()
        });

        symbols.push(sym);
        exportsList.push(
          this.createExport({
            name,
            kind: typeKind,
            line: lineNum,
            isDefault: line.includes('public')
          })
        );

        braceDepth += openBraces - closeBraces;
        continue;
      }

      // 3. Methods & Constructors
      const methodMatch = line.match(
        /(?:public\s+|protected\s+|private\s+)?(?:static\s+|final\s+|abstract\s+|synchronized\s+)*(?:[a-zA-Z0-9_<>[\]]+\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)(?:\s*throws\s+[a-zA-Z0-9_,\s]+)?\s*[{;]?/
      );
      if (
        methodMatch &&
        currentClassName &&
        !line.startsWith('if') &&
        !line.startsWith('for') &&
        !line.startsWith('while') &&
        !line.startsWith('switch') &&
        !line.startsWith('catch') &&
        !line.startsWith('return')
      ) {
        const methodName = methodMatch[1];
        if (methodName !== 'new' && methodName !== 'super' && methodName !== 'this') {
          const isCtor = methodName === currentClassName;
          const sig = line.split('{')[0].trim();

          const methodSym = this.createSymbol({
            name: methodName,
            kind: isCtor ? 'constructor' : 'method',
            language: this.language,
            filePath,
            relativePath,
            startLine: lineNum,
            endLine: lineNum,
            parentSymbol: currentClassName,
            signature: sig
          });

          symbols.push(methodSym);
        }
      }

      braceDepth += openBraces - closeBraces;
      if (braceDepth <= classBraceDepth) {
        currentClassName = null;
      }
    }

    return {
      filePath,
      relativePath,
      language: this.language,
      lineCount: lines.length,
      parseStatus: 'indexed',
      parseErrors,
      symbols,
      imports,
      exports: exportsList,
      dependencies: Array.from(dependenciesSet)
    };
  }
}
