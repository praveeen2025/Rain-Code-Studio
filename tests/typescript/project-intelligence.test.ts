/**
 * Rain Code Studio - Project Intelligence Service Unit Tests
 * Phase 12.1: Developer Intelligence Features
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { sqliteManager } from '../../src/main/database/sqlite-manager';
import { projectIntelligenceService } from '../../src/main/intelligence/project-intelligence-service';
import { indexRepository } from '../../src/main/database/index-repository';

describe('Phase 12.1: Project Intelligence Service', () => {
  const testProjectId = 'test-intelligence-project';
  const testProjectPath = path.resolve(__dirname, '../../test-workspace-intel');

  beforeAll(async () => {
    // Ensure sqlite is initialized
    await sqliteManager.initialize();

    // Create test workspace directory if needed
    if (!fs.existsSync(testProjectPath)) {
      fs.mkdirSync(testProjectPath, { recursive: true });
    }

    // Seed mock project
    sqliteManager.run(
      `INSERT OR REPLACE INTO projects (id, name, path, is_demo, created_at, last_opened, index_status, last_indexed_at)
       VALUES (?, ?, ?, 0, ?, ?, 'indexed', ?)`,
      [testProjectId, 'Intel Test Project', testProjectPath, new Date().toISOString(), new Date().toISOString(), new Date().toISOString()]
    );

    // Seed mock parsed files and symbols
    indexRepository.saveParsedFile(testProjectId, {
      filePath: path.join(testProjectPath, 'src/auth/service.ts'),
      relativePath: 'src/auth/service.ts',
      language: 'typescript',
      lineCount: 85,
      parseStatus: 'indexed',
      symbols: [
        {
          id: 'sym-auth-service',
          name: 'AuthService',
          kind: 'class',
          language: 'typescript',
          filePath: path.join(testProjectPath, 'src/auth/service.ts'),
          relativePath: 'src/auth/service.ts',
          startLine: 10,
          endLine: 80,
          startColumn: 1,
          endColumn: 2,
          documentation: 'Authentication and token verification service'
        },
        {
          id: 'sym-verify-token',
          name: 'verifyToken',
          kind: 'method',
          language: 'typescript',
          filePath: path.join(testProjectPath, 'src/auth/service.ts'),
          relativePath: 'src/auth/service.ts',
          startLine: 25,
          endLine: 45,
          startColumn: 3,
          endColumn: 4,
          signature: 'verifyToken(token: string): boolean'
        }
      ],
      imports: [
        {
          id: 'imp-jwt',
          source: 'crypto',
          specifiers: ['createHmac'],
          isDefault: false,
          isNamespace: false,
          line: 2
        }
      ],
      exports: [
        {
          id: 'exp-auth',
          name: 'AuthService',
          kind: 'class',
          line: 10,
          isDefault: false
        }
      ],
      parseErrors: [],
      dependencies: ['crypto']
    });

    indexRepository.saveParsedFile(testProjectId, {
      filePath: path.join(testProjectPath, 'src/auth/service.test.ts'),
      relativePath: 'src/auth/service.test.ts',
      language: 'typescript',
      lineCount: 40,
      parseStatus: 'indexed',
      symbols: [
        {
          id: 'sym-test-auth',
          name: 'testAuthService',
          kind: 'function',
          language: 'typescript',
          filePath: path.join(testProjectPath, 'src/auth/service.test.ts'),
          relativePath: 'src/auth/service.test.ts',
          startLine: 5,
          endLine: 35,
          startColumn: 1,
          endColumn: 2
        }
      ],
      imports: [
        {
          id: 'imp-auth-svc',
          source: './service',
          specifiers: ['AuthService'],
          isDefault: false,
          isNamespace: false,
          line: 1
        }
      ],
      exports: [],
      parseErrors: [],
      dependencies: ['./service']
    });
  });

  afterAll(() => {
    // Clean up test data
    sqliteManager.run('DELETE FROM project_knowledge WHERE project_id = ?', [testProjectId]);
    sqliteManager.run('DELETE FROM symbols WHERE project_id = ?', [testProjectId]);
    sqliteManager.run('DELETE FROM imports WHERE project_id = ?', [testProjectId]);
    sqliteManager.run('DELETE FROM exports WHERE project_id = ?', [testProjectId]);
    sqliteManager.run('DELETE FROM files WHERE project_id = ?', [testProjectId]);
    sqliteManager.run('DELETE FROM projects WHERE id = ?', [testProjectId]);

    if (fs.existsSync(testProjectPath)) {
      try {
        fs.rmSync(testProjectPath, { recursive: true, force: true });
      } catch {
        // Ignore
      }
    }
  });

  // Feature 1: Health Dashboard
  it('Feature 1: AI Project Health Dashboard should measure actual data and never invent coverage', async () => {
    const health = await projectIntelligenceService.getHealthReport(testProjectId, testProjectPath);

    expect(health.projectId).toBe(testProjectId);
    expect(health.codeQuality.totalFiles).toBe(2);
    expect(health.codeQuality.totalSymbols).toBe(3);
    expect(health.codeQuality.parseStatus).toBe('healthy');

    // Strict Rule: Dynamic coverage is Not measured
    expect(health.testCoverage.status).toBe('Not measured');
    expect(health.testCoverage.explanation).toContain('Not measured');
    expect(health.testCoverage.detectedTestSourceFiles).toBe(1);

    expect(health.indexingHealth.filesIndexed).toBe(2);
    expect(health.indexingHealth.isFresh).toBe(true);
  });

  // Feature 2: Codebase Architecture Map
  it('Feature 2: Codebase Architecture Map should build hierarchical nodes and links', async () => {
    const map = await projectIntelligenceService.getArchitectureMap(testProjectId);

    expect(map.nodes.length).toBeGreaterThan(0);
    expect(map.links.length).toBeGreaterThan(0);

    const rootNode = map.nodes.find((n) => n.type === 'project');
    expect(rootNode).toBeDefined();

    const fileNode = map.nodes.find((n) => n.type === 'file' && n.label === 'service.ts');
    expect(fileNode).toBeDefined();

    const symNode = map.nodes.find((n) => n.label === 'AuthService');
    expect(symNode).toBeDefined();
    expect(symNode?.type).toBe('class');

    expect(map.summary.filesCount).toBe(2);
    expect(map.summary.symbolsCount).toBe(3);
  });

  // Feature 3: Smart Project Search
  it('Feature 3: Smart Project Search should combine symbol matching and file matching with reasoning', async () => {
    const search = await projectIntelligenceService.smartSearch('AuthService', testProjectId, testProjectPath);

    expect(search.query).toBe('AuthService');
    expect(search.totalMatches).toBeGreaterThan(0);
    const topResult = search.items[0];
    expect(topResult.symbolName).toBe('AuthService');
    expect(topResult.selectionReason).toBeDefined();
    expect(topResult.relevanceScore).toBeGreaterThan(0.7);
  });

  // Feature 4: AI Project Onboarding Mode
  it('Feature 4: AI Project Onboarding should distinguish verified facts from inference', async () => {
    const onboarding = await projectIntelligenceService.getOnboardingData(testProjectId, testProjectPath);

    expect(onboarding.projectId).toBe(testProjectId);
    expect(onboarding.coreModules.length).toBeGreaterThan(0);
    expect(onboarding.inferenceDisclaimer).toBeDefined();
    expect(onboarding.inferenceDisclaimer).toContain('Verified project information');
    expect(onboarding.testsStatus.hasTests).toBe(true);
    expect(onboarding.testsStatus.testFilesCount).toBe(1);
  });

  // Feature 5: Code Impact Analyzer
  it('Feature 5: Code Impact Analyzer should trace dependent files with appropriate disclaimers', async () => {
    const impact = await projectIntelligenceService.analyzeImpact('src/auth/service.ts', 'AuthService', testProjectId);

    expect(impact.targetPath).toBe('src/auth/service.ts');
    expect(impact.targetSymbol).toBe('AuthService');
    expect(impact.directlyAffectedFiles).toContain('src/auth/service.ts');

    // service.test.ts imports service.ts
    const hasDependent = impact.detectedDependencies.some((d) => d.file.includes('service.test.ts'));
    expect(hasDependent).toBe(true);

    expect(impact.disclaimer).toBeDefined();
    expect(impact.disclaimer).toContain('cannot be guaranteed');
  });

  // Feature 6: AI Test Coverage Assistant
  it('Feature 6: AI Test Coverage Assistant should identify gaps and provide preview suggestions', async () => {
    const coverage = await projectIntelligenceService.analyzeTestCoverage(testProjectId, testProjectPath);

    expect(coverage.overallCoverageStatus).toBe('Not measured');
    expect(coverage.coverageStatusExplanation).toContain('Not measured');
    expect(coverage.totalSymbolsChecked).toBeGreaterThan(0);
  });

  // Feature 7: Documentation Health
  it('Feature 7: Documentation Health should classify documented vs undocumented symbols', async () => {
    const docs = await projectIntelligenceService.analyzeDocsHealth(testProjectId, testProjectPath);

    expect(docs.totalPublicSymbols).toBeGreaterThan(0);
    expect(docs.items.length).toBeGreaterThan(0);

    const authServiceDoc = docs.items.find((i) => i.symbolName === 'AuthService');
    expect(authServiceDoc).toBeDefined();
    expect(authServiceDoc?.status).toBe('Documented');
  });

  // Feature 8: AI Refactoring Planner
  it('Feature 8: AI Refactoring Planner should produce planning-only steps with risk notices', async () => {
    const plan = await projectIntelligenceService.planRefactor({
      targetFile: 'src/auth/service.ts',
      goal: 'Extract token verification into dedicated strategy',
      symbol: 'verifyToken',
      projectId: testProjectId
    });

    expect(plan.target).toBe('src/auth/service.ts');
    expect(plan.proposedSteps.length).toBeGreaterThan(0);
    expect(plan.potentialRisks.length).toBeGreaterThan(0);
    expect(plan.planningOnlyNotice).toContain('guidance only');
  });

  // Feature 9: Code Similarity Detector
  it('Feature 9: Code Similarity Detector should compare functions and disclaim semantic certainty', async () => {
    const similarity = await projectIntelligenceService.detectSimilarity(testProjectId, 0.5);

    expect(similarity.projectPath).toBeDefined();
    expect(similarity.notice).toContain('Semantic identity is not guaranteed');
  });

  // Feature 10: Local Project Knowledge Base
  it('Feature 10: Local Project Knowledge Base should support CRUD operations in SQLite', async () => {
    // 1. Create
    const created = await projectIntelligenceService.createKnowledgeNote({
      projectId: testProjectId,
      title: 'OAuth2 Integration Architecture',
      category: 'architecture',
      content: 'Store refresh tokens securely and use short-lived JWTs.',
      tags: ['oauth2', 'auth', 'security'],
      includeInRag: true
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe('OAuth2 Integration Architecture');

    // 2. Read
    const notes = await projectIntelligenceService.getKnowledgeNotes(testProjectId);
    expect(notes.some((n) => n.id === created.id)).toBe(true);

    // 3. Update
    const updated = await projectIntelligenceService.updateKnowledgeNote(created.id, {
      title: 'OAuth2 & OIDC Architecture Notes'
    });
    expect(updated.title).toBe('OAuth2 & OIDC Architecture Notes');

    // 4. Delete
    const deleted = await projectIntelligenceService.deleteKnowledgeNote(created.id);
    expect(deleted).toBe(true);

    const notesAfter = await projectIntelligenceService.getKnowledgeNotes(testProjectId);
    expect(notesAfter.some((n) => n.id === created.id)).toBe(false);
  });
});
