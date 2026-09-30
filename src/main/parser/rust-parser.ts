/**
 * SnapDev AI - Rust Code Parser
 * Extracts use declarations, structs, enums, traits, impl blocks, functions, and methods.
 */

import { CodeParser } from './base-parser';
import { ParsedFile, CodeSymbol, CodeImport, CodeExport, ParseError } from '../../shared/types';

export class RustParser extends CodeParser {
  readonly language = 'Rust';
  readonly extensions = ['.rs'] as const;

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

    let currentImplTarget: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i].trim();

      if (!line || line.startsWith('//') || line.startsWith('/*')) {
        continue;
      }

      // 1. Use directives: use crate::module::{a, b};
      const useMatch = line.match(/^pub\s+use\s+([^;]+);|^use\s+([^;]+);/);
      if (useMatch) {
        const usePath = (useMatch[1] || useMatch[2]).trim();
        dependenciesSet.add(usePath);
        imports.push(
          this.createImport({
            source: usePath,
            specifiers: [usePath.split('::').pop() || usePath],
            isNamespace: usePath.includes('*'),
            line: lineNum
          })
        );
        continue;
      }

      // 2. Struct, Enum, Trait: pub struct Name / pub enum Name / pub trait Name
      const typeMatch = line.match(/^(?:pub\s+(?:\([^)]+\)\s+)?)?(struct|enum|trait)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (typeMatch) {
        const kind = typeMatch[1] as 'struct' | 'enum' | 'trait';
        const name = typeMatch[2];
        const isPub = line.startsWith('pub');

        symbols.push(
          this.createSymbol({
            name,
            kind: kind === 'trait' ? 'interface' : kind === 'struct' ? 'struct' : 'enum',
            language: this.language,
            filePath,
            relativePath,
            startLine: lineNum,
            endLine: lines.length,
            signature: line.split('{')[0].replace(/;$/, '').trim()
          })
        );

        if (isPub) {
          exportsList.push(
            this.createExport({
              name,
              kind,
              line: lineNum
            })
          );
        }
        continue;
      }

      // 3. Impl blocks: impl Type or impl Trait for Type
      const implMatch = line.match(/^impl(?:<[^>]+>)?\s+(?:[a-zA-Z0-9_:]+\s+for\s+)?([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (implMatch) {
        currentImplTarget = implMatch[1];
        continue;
      }

      // 4. Functions: pub fn name(args) -> Ret
      const fnMatch = line.match(/^(?:pub\s+(?:\([^)]+\)\s+)?)?(?:async\s+)?(?:unsafe\s+)?fn\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:<[^>]+>)?\s*\(([^)]*)\)/);
      if (fnMatch) {
        const fnName = fnMatch[1];
        const isMethod = currentImplTarget !== null;
        const isPub = line.startsWith('pub');

        symbols.push(
          this.createSymbol({
            name: fnName,
            kind: isMethod ? 'method' : 'function',
            language: this.language,
            filePath,
            relativePath,
            startLine: lineNum,
            endLine: lineNum,
            parentSymbol: currentImplTarget,
            signature: line.split('{')[0].trim()
          })
        );

        if (isPub && !isMethod) {
          exportsList.push(
            this.createExport({
              name: fnName,
              kind: 'function',
              line: lineNum
            })
          );
        }
      }

      if (line === '}' && currentImplTarget) {
        currentImplTarget = null;
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
