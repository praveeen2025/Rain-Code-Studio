/**
 * SnapDev AI - C# Code Parser
 * Extracts using directives, namespaces, classes, interfaces, records, methods, and properties.
 */

import { CodeParser } from './base-parser';
import { ParsedFile, CodeSymbol, CodeImport, CodeExport, ParseError } from '../../shared/types';

export class CSharpParser extends CodeParser {
  readonly language = 'C#';
  readonly extensions = ['.cs'] as const;

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

    let currentNamespace: string | null = null;
    let currentClass: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i].trim();

      if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
        continue;
      }

      // 1. Using directives
      const usingMatch = line.match(/^using\s+(?:static\s+)?([a-zA-Z0-9_.]+);/);
      if (usingMatch) {
        const mod = usingMatch[1];
        dependenciesSet.add(mod);
        imports.push(
          this.createImport({
            source: mod,
            specifiers: [mod.split('.').pop() || mod],
            line: lineNum
          })
        );
        continue;
      }

      // 2. Namespaces
      const nsMatch = line.match(/^namespace\s+([a-zA-Z0-9_.]+)/);
      if (nsMatch) {
        currentNamespace = nsMatch[1];
        symbols.push(
          this.createSymbol({
            name: currentNamespace,
            kind: 'namespace',
            language: this.language,
            filePath,
            relativePath,
            startLine: lineNum,
            endLine: lines.length,
            signature: `namespace ${currentNamespace}`
          })
        );
        continue;
      }

      // 3. Classes, Interfaces, Structs, Records
      const classMatch = line.match(
        /(?:public\s+|internal\s+|private\s+|protected\s+)?(?:static\s+|abstract\s+|sealed\s+|partial\s+)*(class|interface|struct|record|enum)\s+([a-zA-Z_][a-zA-Z0-9_]*)/
      );
      if (classMatch && !line.includes('(') && !line.endsWith(';')) {
        const typeKind = classMatch[1] as 'class' | 'interface' | 'struct' | 'enum';
        const name = classMatch[2];
        currentClass = name;

        symbols.push(
          this.createSymbol({
            name,
            kind: typeKind === 'interface' ? 'interface' : typeKind === 'enum' ? 'enum' : 'class',
            language: this.language,
            filePath,
            relativePath,
            startLine: lineNum,
            endLine: lines.length,
            parentSymbol: currentNamespace,
            signature: line.split('{')[0].trim()
          })
        );
        continue;
      }

      // 4. Methods
      const methodMatch = line.match(
        /(?:public\s+|private\s+|protected\s+|internal\s+)?(?:static\s+|virtual\s+|override\s+|async\s+)*(?:[a-zA-Z0-9_<>[\]?]+\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*(?:where\s+.*)?\s*[{;]?/
      );
      if (
        methodMatch &&
        currentClass &&
        !line.startsWith('if') &&
        !line.startsWith('while') &&
        !line.startsWith('for') &&
        !line.startsWith('switch') &&
        !line.startsWith('return')
      ) {
        const methodName = methodMatch[1];
        const isCtor = methodName === currentClass;

        symbols.push(
          this.createSymbol({
            name: methodName,
            kind: isCtor ? 'constructor' : 'method',
            language: this.language,
            filePath,
            relativePath,
            startLine: lineNum,
            endLine: lineNum,
            parentSymbol: currentClass,
            signature: line.split('{')[0].trim()
          })
        );
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
