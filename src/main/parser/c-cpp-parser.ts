/**
 * SnapDev AI - C / C++ Code Parser
 * Extracts #include directives, namespaces, classes, structs, functions, and methods.
 */

import { CodeParser } from './base-parser';
import { ParsedFile, CodeSymbol, CodeImport, CodeExport, ParseError } from '../../shared/types';

export class CppParser extends CodeParser {
  readonly language = 'C / C++';
  readonly extensions = ['.c', '.h', '.cpp', '.hpp', '.cc', '.cxx', '.hxx'] as const;

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

      // 1. #include <header> or #include "header"
      const incMatch = line.match(/^#include\s+([<"][^>"]+[>"])/);
      if (incMatch) {
        const header = incMatch[1].replace(/[<">]/g, '');
        dependenciesSet.add(header);
        imports.push(
          this.createImport({
            source: header,
            specifiers: [header],
            isDefault: true,
            line: lineNum
          })
        );
        continue;
      }

      // 2. Namespaces
      const nsMatch = line.match(/^namespace\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
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

      // 3. Class & Struct declarations
      const classMatch = line.match(/^(?:class|struct)\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*:\s*[a-zA-Z0-9_,\s]+)?(?:\s*\{)?/);
      if (classMatch && !line.includes('(') && !line.endsWith(';')) {
        const className = classMatch[1];
        currentClass = className;
        symbols.push(
          this.createSymbol({
            name: className,
            kind: line.startsWith('struct') ? 'struct' : 'class',
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

      // 4. Function definitions (returnType name(args) {)
      const funcMatch = line.match(/^(?:[a-zA-Z_][a-zA-Z0-9_*&:<>]+\s+)+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*(?:const)?\s*\{/);
      if (
        funcMatch &&
        !line.startsWith('if') &&
        !line.startsWith('while') &&
        !line.startsWith('for') &&
        !line.startsWith('switch')
      ) {
        const funcName = funcMatch[1];
        const isMethod = currentClass !== null;
        const sig = line.split('{')[0].trim();

        symbols.push(
          this.createSymbol({
            name: funcName,
            kind: isMethod ? 'method' : 'function',
            language: this.language,
            filePath,
            relativePath,
            startLine: lineNum,
            endLine: lineNum,
            parentSymbol: currentClass || currentNamespace,
            signature: sig
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
