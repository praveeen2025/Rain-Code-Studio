/**
 * SnapDev AI - TypeScript & JavaScript AST Parser
 * High-precision AST extraction using the TypeScript Compiler API.
 * Handles .ts, .tsx, .js, .jsx, .mjs, .cjs.
 */

import ts from 'typescript';
import path from 'path';
import { CodeParser } from './base-parser';
import {
  ParsedFile,
  CodeSymbol,
  CodeImport,
  CodeExport,
  ParseError
} from '../../shared/types';

export class TypeScriptParser extends CodeParser {
  readonly language = 'TypeScript / JavaScript';
  readonly extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'] as const;

  protected parseInternal(
    filePath: string,
    relativePath: string,
    content: string
  ): ParsedFile {
    const ext = path.extname(filePath).toLowerCase();
    const isJsx = ext === '.tsx' || ext === '.jsx';
    const isTs = ext === '.ts' || ext === '.tsx';

    const scriptKind = isTs
      ? isJsx
        ? ts.ScriptKind.TSX
        : ts.ScriptKind.TS
      : isJsx
      ? ts.ScriptKind.JSX
      : ts.ScriptKind.JS;

    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      scriptKind
    );

    const symbols: CodeSymbol[] = [];
    const imports: CodeImport[] = [];
    const exportsList: CodeExport[] = [];
    const parseErrors: ParseError[] = [];
    const dependenciesSet = new Set<string>();

    const getLineAndCol = (pos: number) => {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(pos);
      return { line: line + 1, column: character + 1 };
    };

    // Collect syntactic parse diagnostics
    const diagnostics = (sourceFile as unknown as { parseDiagnostics?: ts.Diagnostic[] })
      .parseDiagnostics;
    if (diagnostics && diagnostics.length > 0) {
      for (const diag of diagnostics) {
        let line: number | undefined;
        let column: number | undefined;
        if (diag.start !== undefined) {
          const loc = getLineAndCol(diag.start);
          line = loc.line;
          column = loc.column;
        }
        const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
        parseErrors.push(this.createParseError(message, line, column, 'error'));
      }
    }

    const hasModifier = (node: ts.Node, kind: ts.SyntaxKind): boolean => {
      return (
        ts.canHaveModifiers(node) &&
        (ts.getModifiers(node)?.some((m) => m.kind === kind) ?? false)
      );
    };

    const isExported = (node: ts.Node): boolean => {
      return hasModifier(node, ts.SyntaxKind.ExportKeyword);
    };

    const isDefaultExport = (node: ts.Node): boolean => {
      return (
        hasModifier(node, ts.SyntaxKind.ExportKeyword) &&
        hasModifier(node, ts.SyntaxKind.DefaultKeyword)
      );
    };

    // Recursive AST visitor
    const visit = (node: ts.Node, parentSymbol: string | null = null) => {
      // 1. Function Declarations
      if (ts.isFunctionDeclaration(node)) {
        const name = node.name?.getText(sourceFile) || 'anonymousFunction';
        const start = getLineAndCol(node.getStart(sourceFile));
        const end = getLineAndCol(node.getEnd());
        const signature = node.getText(sourceFile).split('{')[0].trim();

        const sym = this.createSymbol({
          name,
          kind: 'function',
          language: this.language,
          filePath,
          relativePath,
          startLine: start.line,
          endLine: end.line,
          startColumn: start.column,
          endColumn: end.column,
          parentSymbol,
          signature
        });
        symbols.push(sym);

        if (isExported(node)) {
          exportsList.push(
            this.createExport({
              name,
              kind: 'function',
              line: start.line,
              isDefault: isDefaultExport(node)
            })
          );
        }
      }

      // 2. Variable Statements (constants, let, arrow functions)
      else if (ts.isVariableStatement(node)) {
        const isConst = (node.declarationList.flags & ts.NodeFlags.Const) !== 0;
        const exported = isExported(node);

        for (const decl of node.declarationList.declarations) {
          if (!ts.isIdentifier(decl.name)) continue;
          const name = decl.name.getText(sourceFile);
          const start = getLineAndCol(decl.getStart(sourceFile));
          const end = getLineAndCol(decl.getEnd());

          let kind: 'function' | 'constant' | 'variable' = isConst
            ? 'constant'
            : 'variable';
          let signature = `${isConst ? 'const' : 'let'} ${name}`;

          if (
            decl.initializer &&
            (ts.isArrowFunction(decl.initializer) ||
              ts.isFunctionExpression(decl.initializer))
          ) {
            kind = 'function';
            const sigHead = decl.initializer.getText(sourceFile).split('=>')[0].trim();
            signature = `${name} = ${sigHead} => ...`;
          }

          const sym = this.createSymbol({
            name,
            kind,
            language: this.language,
            filePath,
            relativePath,
            startLine: start.line,
            endLine: end.line,
            startColumn: start.column,
            endColumn: end.column,
            parentSymbol,
            signature
          });
          symbols.push(sym);

          if (exported) {
            exportsList.push(
              this.createExport({
                name,
                kind,
                line: start.line,
                isDefault: false
              })
            );
          }
        }
      }

      // 3. Class Declarations
      else if (ts.isClassDeclaration(node)) {
        const name = node.name?.getText(sourceFile) || 'AnonymousClass';
        const start = getLineAndCol(node.getStart(sourceFile));
        const end = getLineAndCol(node.getEnd());

        let heritage = '';
        if (node.heritageClauses) {
          heritage = node.heritageClauses
            .map((h) => h.getText(sourceFile))
            .join(' ');
        }
        const signature = `class ${name} ${heritage}`.trim();

        const classChildren: CodeSymbol[] = [];

        // Parse class members (methods, constructors, properties)
        for (const member of node.members) {
          if (ts.isMethodDeclaration(member) || ts.isConstructorDeclaration(member)) {
            const isCtor = ts.isConstructorDeclaration(member);
            const mName = isCtor
              ? 'constructor'
              : member.name?.getText(sourceFile) || 'method';
            const mStart = getLineAndCol(member.getStart(sourceFile));
            const mEnd = getLineAndCol(member.getEnd());
            const mSig = member.getText(sourceFile).split('{')[0].trim();

            const methodSym = this.createSymbol({
              name: mName,
              kind: isCtor ? 'constructor' : 'method',
              language: this.language,
              filePath,
              relativePath,
              startLine: mStart.line,
              endLine: mEnd.line,
              startColumn: mStart.column,
              endColumn: mEnd.column,
              parentSymbol: name,
              signature: mSig
            });

            classChildren.push(methodSym);
            symbols.push(methodSym);
          } else if (ts.isPropertyDeclaration(member)) {
            const pName = member.name?.getText(sourceFile) || 'property';
            const pStart = getLineAndCol(member.getStart(sourceFile));
            const pEnd = getLineAndCol(member.getEnd());

            const propSym = this.createSymbol({
              name: pName,
              kind: 'property',
              language: this.language,
              filePath,
              relativePath,
              startLine: pStart.line,
              endLine: pEnd.line,
              startColumn: pStart.column,
              endColumn: pEnd.column,
              parentSymbol: name,
              signature: member.getText(sourceFile).trim()
            });

            classChildren.push(propSym);
            symbols.push(propSym);
          }
        }

        const classSym = this.createSymbol({
          name,
          kind: 'class',
          language: this.language,
          filePath,
          relativePath,
          startLine: start.line,
          endLine: end.line,
          startColumn: start.column,
          endColumn: end.column,
          parentSymbol,
          signature,
          children: classChildren
        });
        symbols.push(classSym);

        if (isExported(node)) {
          exportsList.push(
            this.createExport({
              name,
              kind: 'class',
              line: start.line,
              isDefault: isDefaultExport(node)
            })
          );
        }
      }

      // 4. Interface Declarations
      else if (ts.isInterfaceDeclaration(node)) {
        const name = node.name.getText(sourceFile);
        const start = getLineAndCol(node.getStart(sourceFile));
        const end = getLineAndCol(node.getEnd());

        let heritage = '';
        if (node.heritageClauses) {
          heritage = node.heritageClauses
            .map((h) => h.getText(sourceFile))
            .join(' ');
        }
        const signature = `interface ${name} ${heritage}`.trim();

        const ifaceSym = this.createSymbol({
          name,
          kind: 'interface',
          language: this.language,
          filePath,
          relativePath,
          startLine: start.line,
          endLine: end.line,
          startColumn: start.column,
          endColumn: end.column,
          parentSymbol,
          signature
        });
        symbols.push(ifaceSym);

        if (isExported(node)) {
          exportsList.push(
            this.createExport({
              name,
              kind: 'interface',
              line: start.line,
              isDefault: isDefaultExport(node)
            })
          );
        }
      }

      // 5. Type Alias Declarations
      else if (ts.isTypeAliasDeclaration(node)) {
        const name = node.name.getText(sourceFile);
        const start = getLineAndCol(node.getStart(sourceFile));
        const end = getLineAndCol(node.getEnd());
        const signature = node.getText(sourceFile).trim();

        const typeSym = this.createSymbol({
          name,
          kind: 'type',
          language: this.language,
          filePath,
          relativePath,
          startLine: start.line,
          endLine: end.line,
          startColumn: start.column,
          endColumn: end.column,
          parentSymbol,
          signature
        });
        symbols.push(typeSym);

        if (isExported(node)) {
          exportsList.push(
            this.createExport({
              name,
              kind: 'type',
              line: start.line,
              isDefault: isDefaultExport(node)
            })
          );
        }
      }

      // 6. Enum Declarations
      else if (ts.isEnumDeclaration(node)) {
        const name = node.name.getText(sourceFile);
        const start = getLineAndCol(node.getStart(sourceFile));
        const end = getLineAndCol(node.getEnd());
        const signature = `enum ${name}`;

        const enumSym = this.createSymbol({
          name,
          kind: 'enum',
          language: this.language,
          filePath,
          relativePath,
          startLine: start.line,
          endLine: end.line,
          startColumn: start.column,
          endColumn: end.column,
          parentSymbol,
          signature
        });
        symbols.push(enumSym);

        if (isExported(node)) {
          exportsList.push(
            this.createExport({
              name,
              kind: 'enum',
              line: start.line,
              isDefault: isDefaultExport(node)
            })
          );
        }
      }

      // 7. Import Declarations
      else if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier
          .getText(sourceFile)
          .replace(/['"]/g, '');
        dependenciesSet.add(moduleSpecifier);

        const start = getLineAndCol(node.getStart(sourceFile));
        const specifiers: string[] = [];
        let isDefault = false;
        let isNamespace = false;

        if (node.importClause) {
          if (node.importClause.name) {
            isDefault = true;
            specifiers.push(node.importClause.name.getText(sourceFile));
          }
          if (node.importClause.namedBindings) {
            if (ts.isNamespaceImport(node.importClause.namedBindings)) {
              isNamespace = true;
              specifiers.push(
                node.importClause.namedBindings.name.getText(sourceFile)
              );
            } else if (ts.isNamedImports(node.importClause.namedBindings)) {
              for (const elem of node.importClause.namedBindings.elements) {
                specifiers.push(elem.name.getText(sourceFile));
              }
            }
          }
        }

        imports.push(
          this.createImport({
            source: moduleSpecifier,
            specifiers,
            isDefault,
            isNamespace,
            line: start.line
          })
        );
      }

      // 8. Export Declarations (export { a, b })
      else if (ts.isExportDeclaration(node)) {
        const start = getLineAndCol(node.getStart(sourceFile));
        if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          for (const elem of node.exportClause.elements) {
            exportsList.push(
              this.createExport({
                name: elem.name.getText(sourceFile),
                kind: 'named',
                line: start.line,
                isDefault: false
              })
            );
          }
        }
      }

      // 9. Export Default Assignment (export default Foo)
      else if (ts.isExportAssignment(node)) {
        const start = getLineAndCol(node.getStart(sourceFile));
        const name = node.expression.getText(sourceFile);
        exportsList.push(
          this.createExport({
            name,
            kind: 'default',
            line: start.line,
            isDefault: true
          })
        );
      }

      // Recurse into children
      ts.forEachChild(node, (child) => visit(child, parentSymbol));
    };

    visit(sourceFile);

    const lineCount = content.split('\n').length;
    const parseStatus =
      parseErrors.length > 0 ? 'partial' : 'indexed';

    return {
      filePath,
      relativePath,
      language: this.language,
      lineCount,
      parseStatus,
      parseErrors,
      symbols,
      imports,
      exports: exportsList,
      dependencies: Array.from(dependenciesSet)
    };
  }
}
