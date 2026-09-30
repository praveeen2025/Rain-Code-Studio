/**
 * SnapDev AI - Parser Test Suite
 * Validates AST parsing, symbol extraction, imports, exports, and error tolerance across languages.
 */

import { describe, it, expect } from 'vitest';
import { TypeScriptParser } from '../../src/main/parser/typescript-parser';
import { PythonParser } from '../../src/main/parser/python-parser';
import { JavaParser } from '../../src/main/parser/java-parser';
import { CppParser } from '../../src/main/parser/c-cpp-parser';
import { GoParser } from '../../src/main/parser/go-parser';
import { RustParser } from '../../src/main/parser/rust-parser';
import { parserRegistry } from '../../src/main/parser';

describe('TypeScript & JavaScript Parser', () => {
  const tsParser = new TypeScriptParser();

  it('should extract functions, arrow functions, and line ranges', async () => {
    const code = `
export function add(a: number, b: number): number {
  return a + b;
}

export const multiply = (x: number, y: number) => {
  return x * y;
};
    `.trim();

    const result = await tsParser.safeParse('/src/math.ts', 'src/math.ts', code);
    expect(result.parseStatus).toBe('indexed');
    expect(result.symbols.length).toBe(2);

    const addFunc = result.symbols.find((s) => s.name === 'add');
    expect(addFunc).toBeDefined();
    expect(addFunc?.kind).toBe('function');
    expect(addFunc?.startLine).toBe(1);
    expect(addFunc?.signature).toContain('function add(a: number, b: number)');

    const mulFunc = result.symbols.find((s) => s.name === 'multiply');
    expect(mulFunc).toBeDefined();
    expect(mulFunc?.kind).toBe('function');
  });

  it('should extract classes, constructors, methods, and properties', async () => {
    const code = `
export class UserService extends BaseService implements IUserService {
  private apiKey: string;

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  public async fetchUser(id: string): Promise<User> {
    return { id, name: 'Alice' };
  }
}
    `.trim();

    const result = await tsParser.safeParse('/src/user.ts', 'src/user.ts', code);
    expect(result.parseStatus).toBe('indexed');

    const classSym = result.symbols.find((s) => s.name === 'UserService');
    expect(classSym).toBeDefined();
    expect(classSym?.kind).toBe('class');
    expect(classSym?.signature).toContain('class UserService extends BaseService implements IUserService');

    const methodSym = result.symbols.find((s) => s.name === 'fetchUser');
    expect(methodSym).toBeDefined();
    expect(methodSym?.kind).toBe('method');
    expect(methodSym?.parentSymbol).toBe('UserService');

    const ctorSym = result.symbols.find((s) => s.name === 'constructor');
    expect(ctorSym).toBeDefined();
    expect(ctorSym?.kind).toBe('constructor');
  });

  it('should extract interfaces and type aliases', async () => {
    const code = `
export interface UserProfile {
  id: string;
  displayName: string;
}

export type AuthToken = string;
export enum Role { ADMIN, DEV, GUEST }
    `.trim();

    const result = await tsParser.safeParse('/src/types.ts', 'src/types.ts', code);
    expect(result.parseStatus).toBe('indexed');

    const iface = result.symbols.find((s) => s.name === 'UserProfile');
    expect(iface?.kind).toBe('interface');

    const typeSym = result.symbols.find((s) => s.name === 'AuthToken');
    expect(typeSym?.kind).toBe('type');

    const enumSym = result.symbols.find((s) => s.name === 'Role');
    expect(enumSym?.kind).toBe('enum');
  });

  it('should extract imports and dependencies', async () => {
    const code = `
import React, { useState, useEffect } from 'react';
import * as path from 'path';
import { User } from './models/user';
    `.trim();

    const result = await tsParser.safeParse('/src/app.tsx', 'src/app.tsx', code);
    expect(result.imports.length).toBe(3);

    const reactImport = result.imports.find((i) => i.source === 'react');
    expect(reactImport).toBeDefined();
    expect(reactImport?.specifiers).toContain('React');
    expect(reactImport?.specifiers).toContain('useState');

    const pathImport = result.imports.find((i) => i.source === 'path');
    expect(pathImport?.isNamespace).toBe(true);
    expect(result.dependencies).toContain('./models/user');
  });

  it('should handle syntax errors safely without crashing', async () => {
    const brokenCode = `function broken( { return missing_close_paren;`;
    const result = await tsParser.safeParse('/src/broken.ts', 'src/broken.ts', brokenCode);
    expect(result.parseStatus).toBe('partial');
    expect(result.parseErrors.length).toBeGreaterThan(0);
  });

  it('should handle empty files cleanly', async () => {
    const result = await tsParser.safeParse('/src/empty.ts', 'src/empty.ts', '');
    expect(result.parseStatus).toBe('indexed');
    expect(result.symbols).toHaveLength(0);
  });
});

describe('Python Parser', () => {
  const pyParser = new PythonParser();

  it('should extract classes, constructors, methods, and functions', async () => {
    const code = `
class AuthHandler(BaseHandler):
    """Handles authentication."""

    def __init__(self, secret_key: str):
        self.secret_key = secret_key

    def verify_token(self, token: str) -> bool:
        return True

def create_handler():
    return AuthHandler("key")
    `.trim();

    const result = await pyParser.safeParse('/app/auth.py', 'app/auth.py', code);
    expect(result.parseStatus).toBe('indexed');

    const cls = result.symbols.find((s) => s.name === 'AuthHandler');
    expect(cls).toBeDefined();
    expect(cls?.kind).toBe('class');
    expect(cls?.documentation).toBe('Handles authentication.');

    const ctor = result.symbols.find((s) => s.name === '__init__');
    expect(ctor?.kind).toBe('constructor');
    expect(ctor?.parentSymbol).toBe('AuthHandler');

    const method = result.symbols.find((s) => s.name === 'verify_token');
    expect(method?.kind).toBe('method');
    expect(method?.parentSymbol).toBe('AuthHandler');

    const func = result.symbols.find((s) => s.name === 'create_handler');
    expect(func?.kind).toBe('function');
    expect(func?.parentSymbol).toBeNull();
  });

  it('should extract imports and from-imports', async () => {
    const code = `
import os, sys
from typing import List, Dict, Optional
from .models import User
    `.trim();

    const result = await pyParser.safeParse('/app/main.py', 'app/main.py', code);
    expect(result.imports.length).toBeGreaterThanOrEqual(3);
    expect(result.dependencies).toContain('os');
    expect(result.dependencies).toContain('typing');
    expect(result.dependencies).toContain('.models');
  });

  it('should extract module constants', async () => {
    const code = `
MAX_BUFFER_SIZE = 1024
DEFAULT_PORT = 8080
    `.trim();

    const result = await pyParser.safeParse('/app/config.py', 'app/config.py', code);
    const constSym = result.symbols.find((s) => s.name === 'MAX_BUFFER_SIZE');
    expect(constSym).toBeDefined();
    expect(constSym?.kind).toBe('constant');
  });
});

describe('Multi-Language Parser Adapters', () => {
  it('should parse Java classes and methods', async () => {
    const javaParser = new JavaParser();
    const code = `
package com.snapdev;
import java.util.List;

public class MathUtils {
    public static int add(int a, int b) {
        return a + b;
    }
}
    `.trim();

    const result = await javaParser.safeParse('/MathUtils.java', 'MathUtils.java', code);
    expect(result.symbols.find((s) => s.name === 'MathUtils')?.kind).toBe('class');
    expect(result.symbols.find((s) => s.name === 'add')?.kind).toBe('method');
    expect(result.dependencies).toContain('java.util.List');
  });

  it('should parse C / C++ includes, classes, and functions', async () => {
    const cppParser = new CppParser();
    const code = `
#include <iostream>
#include "calculator.h"

class Calculator {
public:
    int calculate(int x) { return x * 2; }
};
    `.trim();

    const result = await cppParser.safeParse('/calc.cpp', 'calc.cpp', code);
    expect(result.dependencies).toContain('iostream');
    expect(result.symbols.find((s) => s.name === 'Calculator')?.kind).toBe('class');
    expect(result.symbols.find((s) => s.name === 'calculate')?.kind).toBe('method');
  });

  it('should parse Go functions, structs, and methods', async () => {
    const goParser = new GoParser();
    const code = `
package main

import "fmt"

type Server struct {
    port int
}

func (s *Server) Start() error {
    return nil
}

func main() {}
    `.trim();

    const result = await goParser.safeParse('/main.go', 'main.go', code);
    expect(result.symbols.find((s) => s.name === 'Server')?.kind).toBe('struct');
    expect(result.symbols.find((s) => s.name === 'Start')?.kind).toBe('method');
    expect(result.symbols.find((s) => s.name === 'main')?.kind).toBe('function');
  });

  it('should parse Rust structs and functions', async () => {
    const rustParser = new RustParser();
    const code = `
pub struct Config {
    pub port: u16,
}

pub fn run(config: Config) {
}
    `.trim();

    const result = await rustParser.safeParse('/lib.rs', 'lib.rs', code);
    expect(result.symbols.find((s) => s.name === 'Config')?.kind).toBe('struct');
    expect(result.symbols.find((s) => s.name === 'run')?.kind).toBe('function');
  });
});

describe('ParserRegistry', () => {
  it('should correctly identify supported files and dispatch parsers', () => {
    expect(parserRegistry.isSupportedSourceFile('test.ts')).toBe(true);
    expect(parserRegistry.isSupportedSourceFile('script.py')).toBe(true);
    expect(parserRegistry.isSupportedSourceFile('main.go')).toBe(true);
    expect(parserRegistry.isSupportedSourceFile('readme.md')).toBe(false);
  });

  it('should return unsupported status for non-code files', async () => {
    const result = await parserRegistry.parseFile('readme.txt', 'readme.txt', 'hello');
    expect(result.parseStatus).toBe('unsupported');
  });
});
