/**
 * SnapDev AI - Go Code Parser
 * Extracts package, imports, functions, methods with receivers, structs, and interfaces.
 */

import { CodeParser } from './base-parser';
import { ParsedFile, CodeSymbol, CodeImport, CodeExport, ParseError } from '../../shared/types';

export class GoParser extends CodeParser {
  readonly language = 'Go';
  readonly extensions = ['.go'] as const;

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

    let inImportBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i].trim();

      if (!line || line.startsWith('//') || line.startsWith('/*')) {
        continue;
      }

      // 1. Import block (import ( ... ))
      if (line === 'import (') {
        inImportBlock = true;
        continue;
      }
      if (inImportBlock) {
        if (line === ')') {
          inImportBlock = false;
          continue;
        }
        const pkgMatch = line.match(/^([a-zA-Z0-9_]+\s+)?"([^"]+)"/);
        if (pkgMatch) {
          const pkg = pkgMatch[2];
          dependenciesSet.add(pkg);
          imports.push(
            this.createImport({
              source: pkg,
              specifiers: [pkg.split('/').pop() || pkg],
              line: lineNum
            })
          );
        }
        continue;
      }

      // Single line import
      const singleImport = line.match(/^import\s+(?:[a-zA-Z0-9_]+\s+)?"([^"]+)"/);
      if (singleImport) {
        const pkg = singleImport[1];
        dependenciesSet.add(pkg);
        imports.push(
          this.createImport({
            source: pkg,
            specifiers: [pkg.split('/').pop() || pkg],
            line: lineNum
          })
        );
        continue;
      }

      // 2. Struct or Interface declarations: type Name struct/interface
      const typeMatch = line.match(/^type\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+(struct|interface)/);
      if (typeMatch) {
        const typeName = typeMatch[1];
        const kind = typeMatch[2] === 'interface' ? 'interface' : 'struct';
        const isExported = typeName[0] === typeName[0].toUpperCase();

        symbols.push(
          this.createSymbol({
            name: typeName,
            kind,
            language: this.language,
            filePath,
            relativePath,
            startLine: lineNum,
            endLine: lines.length,
            signature: `type ${typeName} ${typeMatch[2]}`
          })
        );

        if (isExported) {
          exportsList.push(
            this.createExport({
              name: typeName,
              kind,
              line: lineNum
            })
          );
        }
        continue;
      }

      // 3. Methods with receiver: func (r *Receiver) MethodName(args) Ret {
      const methodMatch = line.match(/^func\s+\(([^)]+)\)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/);
      if (methodMatch) {
        const receiver = methodMatch[1].trim();
        const methodName = methodMatch[2];
        const receiverType = receiver.replace(/[*&]/g, '').trim().split(/\s+/).pop() || null;
        const isExported = methodName[0] === methodName[0].toUpperCase();

        symbols.push(
          this.createSymbol({
            name: methodName,
            kind: 'method',
            language: this.language,
            filePath,
            relativePath,
            startLine: lineNum,
            endLine: lineNum,
            parentSymbol: receiverType,
            signature: line.split('{')[0].trim()
          })
        );

        if (isExported) {
          exportsList.push(
            this.createExport({
              name: methodName,
              kind: 'method',
              line: lineNum
            })
          );
        }
        continue;
      }

      // 4. Regular functions: func FunctionName(args) Ret {
      const funcMatch = line.match(/^func\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/);
      if (funcMatch) {
        const funcName = funcMatch[1];
        const isExported = funcName[0] === funcName[0].toUpperCase();

        symbols.push(
          this.createSymbol({
            name: funcName,
            kind: 'function',
            language: this.language,
            filePath,
            relativePath,
            startLine: lineNum,
            endLine: lineNum,
            signature: line.split('{')[0].trim()
          })
        );

        if (isExported) {
          exportsList.push(
            this.createExport({
              name: funcName,
              kind: 'function',
              line: lineNum
            })
          );
        }
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
