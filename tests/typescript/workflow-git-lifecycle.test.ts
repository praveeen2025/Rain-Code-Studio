/**
 * SnapDev AI - Integration Test: Workflow 4
 * Git Lifecycle: Init -> Modify -> Status -> Stage -> Commit -> Log
 *
 * Verifies that Git operations work reliably in project workspace without security bypasses.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { GitManager } from '../../src/main/git/git-manager';
import { projectManager } from '../../src/main/project-manager';

describe('Workflow 4: Git Lifecycle (Init -> Modify -> Status -> Stage -> Commit -> Log)', () => {
  const scratchRepoDir = path.resolve('tests/scratch-git-workflow');
  const sampleFile = path.join(scratchRepoDir, 'hello.txt');
  let gitManager: GitManager;

  beforeAll(async () => {
    await fs.mkdir(scratchRepoDir, { recursive: true });
    gitManager = new GitManager();
    await projectManager.loadProject(scratchRepoDir);
  });

  afterAll(async () => {
    try {
      await fs.rm(scratchRepoDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  });

  it('Step 1: Initializes a fresh Git repository', async () => {
    const initRes = await gitManager.initRepository(scratchRepoDir);
    expect(initRes.success).toBe(true);

    const info = await gitManager.getRepositoryInfo(scratchRepoDir);
    expect(info.isRepo).toBe(true);
  });

  it('Step 2: Detects new untracked file in Git status', async () => {
    await fs.writeFile(sampleFile, 'Initial line 1\n', 'utf-8');

    const status = await gitManager.getStatus(scratchRepoDir);
    expect(status.isRepo).toBe(true);
    expect(status.untracked.length).toBeGreaterThan(0);

    const untracked = status.untracked.find((f) => f.relativePath === 'hello.txt');
    expect(untracked).toBeDefined();
    expect(untracked?.staged).toBe(false);
  });

  it('Step 3: Stages the untracked file', async () => {
    const stageRes = await gitManager.stageFile(sampleFile, scratchRepoDir);
    expect(stageRes.success).toBe(true);

    const status = await gitManager.getStatus(scratchRepoDir);
    expect(status.staged.length).toBeGreaterThan(0);

    const staged = status.staged.find((f) => f.relativePath === 'hello.txt');
    expect(staged).toBeDefined();
    expect(staged?.staged).toBe(true);
  });

  it('Step 4: Commits staged changes with a validated commit message', async () => {
    // Configure local git user for commit if needed in scratch repo
    try {
      await gitManager.runGit(['config', 'user.name', 'Rain Code Studio Test'], scratchRepoDir);
      await gitManager.runGit(['config', 'user.email', 'test@snapdev.local'], scratchRepoDir);
    } catch {
      // Ignore if global config exists
    }

    const commitRes = await gitManager.commit('feat: add hello.txt initial file', scratchRepoDir);
    expect(commitRes.success).toBe(true);
    expect(commitRes.commitHash).toBeDefined();

    const status = await gitManager.getStatus(scratchRepoDir);
    expect(status.isClean).toBe(true);
  });

  it('Step 5: Modifies file and verifies unified diff generation', async () => {
    await fs.writeFile(sampleFile, 'Initial line 1\nAdded line 2\n', 'utf-8');

    const status = await gitManager.getStatus(scratchRepoDir);
    expect(status.isClean).toBe(false);

    const diff = await gitManager.getDiff('hello.txt', false, scratchRepoDir);
    expect(diff).toContain('+Added line 2');
  });

  it('Step 6: Stages, commits second change, and verifies Git commit log', async () => {
    await gitManager.stageAll(scratchRepoDir);
    const commit2 = await gitManager.commit('feat: add second line to hello.txt', scratchRepoDir);
    expect(commit2.success).toBe(true);

    const log = await gitManager.getLog(5, scratchRepoDir);
    expect(log.length).toBeGreaterThanOrEqual(2);
    expect(log[0].message).toContain('add second line');
    expect(log[1].message).toContain('initial file');
  });
});
