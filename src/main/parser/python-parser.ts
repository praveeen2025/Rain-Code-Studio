/**
 * SnapDev AI - Python AST & Structural Parser
 * High-reliability parser extracting classes, methods, functions, async functions,
 * decorators, imports, exports, module constants, and docstrings from Python source files.
 */

import { CodeParser } from './base-parser';
import {
  ParsedFile,
  CodeSymbol,
  CodeImport,
  CodeExport,
  ParseError
} from '../../shared/types';

interface ScopeBlock {
  type: 'class' | 'function' | 'module';
  name: string;
  indent: number;
  startLine: number;
  symbolRef?: CodeSymbol;
}

export class PythonParser extends CodeParser {
  readonly language = 'Python';
  readonly extensions = ['.py'] as const;

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

    const scopeStack: ScopeBlock[] = [
      { type: 'module', name: '__main__', indent: -1, startLine: 1 }
    ];

    let pendingDocstringFor: CodeSymbol | null = null;
    let pendingDecorators: string[] = [];

    // Helper to calculate leading space indentation
    const getIndent = (line: string): number => {
      let count = 0;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === ' ') count++;
        else if (line[i] === '\t') count += 4;
        else break;
      }
      return count;
    };

    // Close scopes that have higher indentation than the current line
    const popScopes = (currentIndent: number, currentLineNum: number) => {
      while (
        scopeStack.length > 1 &&
        scopeStack[scopeStack.length - 1].indent >= currentIndent
      ) {
        const closed = scopeStack.pop();
        if (closed && closed.symbolRef) {
          closed.symbolRef.endLine = Math.max(
            closed.symbolRef.startLine,
            currentLineNum - 1
          );
        }
      }
    };

    for (let idx = 0; idx < lines.length; idx++) {
      const lineNum = idx + 1;
      const rawLine = lines[idx];
      const trimmed = rawLine.trim();

      // Skip empty lines and full line comments for scope tracking
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const indent = getIndent(rawLine);
      popScopes(indent, lineNum);

      const currentScope = scopeStack[scopeStack.length - 1];
      const parentSymbolName =
        currentScope.type === 'class' ? currentScope.name : null;

      // 1. Decorators (@decorator)
      if (trimmed.startsWith('@')) {
        pendingDecorators.push(trimmed);
        continue;
      }

      // 2. Class Definitions (class Name(Base):)
      const classMatch = trimmed.match(/^class\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*\((.*?)\))?\s*:/);
      if (classMatch) {
        const className = classMatch[1];
        const baseClasses = classMatch[2] ? `(${classMatch[2]})` : '';
        const signature = `class ${className}${baseClasses}`;

        const classSym = this.createSymbol({
          name: className,
          kind: 'class',
          language: this.language,
          filePath,
          relativePath,
          startLine: lineNum,
          endLine: lines.length, // Will be updated on scope pop
          startColumn: indent + 1,
          parentSymbol: parentSymbolName,
          signature,
          documentation: pendingDecorators.length > 0 ? pendingDecorators.join('\n') : undefined,
          children: []
        });

        symbols.push(classSym);
        exportsList.push(
          this.createExport({
            name: className,
            kind: 'class',
            line: lineNum,
            isDefault: false
          })
        );

        scopeStack.push({
          type: 'class',
          name: className,
          indent,
          startLine: lineNum,
          symbolRef: classSym
        });

        pendingDocstringFor = classSym;
        pendingDecorators = [];
        continue;
      }

      // 3. Function and Method Definitions (def name(args) -> Ret: or async def)
      const defMatch = trimmed.match(/^(?:async\s+)?def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([\s\S]*)/);
      if (defMatch) {
        const funcName = defMatch[1];
        const isAsync = trimmed.startsWith('async ');
        const isMethod = currentScope.type === 'class';
        const isConstructor = isMethod && funcName === '__init__';

        // Extract full signature up to the ending colon
        let sigFull = trimmed.replace(/:$/, '').trim();
        // If multiline signature, grab next lines until ':'
        let lookAhead = idx;
        while (!sigFull.endsWith(':') && !sigFull.includes('):') && lookAhead + 1 < lines.length) {
          lookAhead++;
          const nextTrim = lines[lookAhead].trim();
          sigFull += ' ' + nextTrim;
          if (nextTrim.includes('):') || nextTrim.endsWith(':')) {
            break;
          }
        }
        sigFull = sigFull.replace(/:$/, '').trim();

        const kind = isConstructor ? 'constructor' : isMethod ? 'method' : 'function';

        const funcSym = this.createSymbol({
          name: funcName,
          kind,
          language: this.language,
          filePath,
          relativePath,
          startLine: lineNum,
          endLine: lines.length, // Will be updated on scope pop
          startColumn: indent + 1,
          parentSymbol: parentSymbolName,
          signature: `${isAsync ? 'async ' : ''}${sigFull}`,
          documentation: pendingDecorators.length > 0 ? pendingDecorators.join('\n') : undefined
        });

        if (isMethod && currentScope.symbolRef && currentScope.symbolRef.children) {
          currentScope.symbolRef.children.push(funcSym);
        }

        symbols.push(funcSym);

        if (!isMethod) {
          exportsList.push(
            this.createExport({
              name: funcName,
              kind: 'function',
              line: lineNum,
              isDefault: false
            })
          );
        }

        scopeStack.push({
          type: 'function',
          name: funcName,
          indent,
          startLine: lineNum,
          symbolRef: funcSym
        });

        pendingDocstringFor = funcSym;
        pendingDecorators = [];
        continue;
      }

      // 4. Imports: from x import y
      const fromImportMatch = trimmed.match(/^from\s+([a-zA-Z0-9_.]+)\s+import\s+(.+)$/);
      if (fromImportMatch) {
        const source = fromImportMatch[1];
        dependenciesSet.add(source);

        const specifiers = fromImportMatch[2]
          .replace(/[()]/g, '')
          .split(',')
          .map((s) => s.trim().split(/\s+as\s+/)[0])
          .filter(Boolean);

        imports.push(
          this.createImport({
            source,
            specifiers,
            isDefault: false,
            isNamespace: specifiers.includes('*'),
            line: lineNum
          })
        );
        pendingDecorators = [];
        continue;
      }

      // 5. Imports: import x, y as z
      const importMatch = trimmed.match(/^import\s+(.+)$/);
      if (importMatch) {
        const rawImports = importMatch[1].split(',');
        for (const raw of rawImports) {
          const mod = raw.trim().split(/\s+as\s+/)[0].trim();
          if (mod) {
            dependenciesSet.add(mod);
            imports.push(
              this.createImport({
                source: mod,
                specifiers: [mod],
                isDefault: false,
                isNamespace: false,
                line: lineNum
              })
            );
          }
        }
        pendingDecorators = [];
        continue;
      }

      // 6. Top-level or Class Constants/Variables (NAME = VALUE)
      const assignMatch = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*[:=]/);
      if (assignMatch) {
        const constName = assignMatch[1];
        const constSym = this.createSymbol({
          name: constName,
          kind: 'constant',
          language: this.language,
          filePath,
          relativePath,
          startLine: lineNum,
          endLine: lineNum,
          startColumn: indent + 1,
          parentSymbol: parentSymbolName,
          signature: trimmed.split('\n')[0]
        });

        symbols.push(constSym);
        if (currentScope.type === 'module') {
          exportsList.push(
            this.createExport({
              name: constName,
              kind: 'constant',
              line: lineNum,
              isDefault: false
            })
          );
        }
        pendingDecorators = [];
        continue;
      }

      // 7. Check for docstrings attached to pending symbol
      if (pendingDocstringFor && (trimmed.startsWith('"""') || trimmed.startsWith("'''"))) {
        let docContent = trimmed;
        if (!trimmed.endsWith('"""') && !trimmed.endsWith("'''")) {
          // Multiline docstring
          let docIdx = idx;
          while (docIdx + 1 < lines.length) {
            docIdx++;
            docContent += '\n' + lines[docIdx];
            if (lines[docIdx].includes('"""') || lines[docIdx].includes("'''")) {
              break;
            }
          }
        }
        pendingDocstringFor.documentation = docContent.replace(/^['"]{3}|['"]{3}$/g, '').trim();
        pendingDocstringFor = null;
        continue;
      }

      // Reset pending tags
      pendingDocstringFor = null;
      pendingDecorators = [];
    }

    // Close remaining open scopes at file end
    popScopes(-1, lines.length + 1);

    const parseStatus = parseErrors.length > 0 ? 'partial' : 'indexed';

    return {
      filePath,
      relativePath,
      language: this.language,
      lineCount: lines.length,
      parseStatus,
      parseErrors,
      symbols,
      imports,
      exports: exportsList,
      dependencies: Array.from(dependenciesSet)
    };
  }
}
