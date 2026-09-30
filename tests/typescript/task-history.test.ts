/**
 * SnapDev AI - Task History Manager Tests
 * Phase 6: Local AI developer task history persistence and retrieval.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TaskHistoryManager } from '../../src/main/patch/task-history-manager';
import { TaskHistoryItem } from '../../src/shared/types';

describe('TaskHistoryManager - Local Task History Persistence', () => {
  let taskManager: TaskHistoryManager;

  beforeEach(async () => {
    taskManager = new TaskHistoryManager();
    await taskManager.clearHistory();
  });

  afterEach(async () => {
    await taskManager.clearHistory();
  });

  it('records, retrieves, updates, and deletes tasks', async () => {
    const task: TaskHistoryItem = {
      id: 'task-test-1',
      timestamp: new Date().toISOString(),
      taskType: 'explain',
      userRequest: 'Explain login function',
      selectedFile: 'src/auth.ts',
      selectedSymbol: 'login',
      summary: 'Handles user authentication',
      status: 'completed'
    };

    const added = await taskManager.addTask(task);
    expect(added).toBe(true);

    const history = await taskManager.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].id).toBe('task-test-1');
    expect(history[0].userRequest).toBe('Explain login function');

    // Update existing task status (e.g. applied)
    const updatedTask: TaskHistoryItem = { ...task, status: 'applied' };
    await taskManager.addTask(updatedTask);

    const updatedHistory = await taskManager.getHistory();
    expect(updatedHistory.length).toBe(1);
    expect(updatedHistory[0].status).toBe('applied');

    // Delete single task
    await taskManager.deleteTask('task-test-1');
    const afterDelete = await taskManager.getHistory();
    expect(afterDelete.length).toBe(0);
  });

  it('clears all history cleanly', async () => {
    await taskManager.addTask({
      id: 'task-1',
      timestamp: new Date().toISOString(),
      taskType: 'bug_analysis',
      userRequest: 'Fix null error',
      summary: 'Null error in discount calculation',
      status: 'completed'
    });

    await taskManager.addTask({
      id: 'task-2',
      timestamp: new Date().toISOString(),
      taskType: 'test_generation',
      userRequest: 'Generate vitest unit tests',
      summary: 'Vitest suite with 3 cases',
      status: 'completed'
    });

    const beforeClear = await taskManager.getHistory();
    expect(beforeClear.length).toBe(2);

    await taskManager.clearHistory();
    const afterClear = await taskManager.getHistory();
    expect(afterClear.length).toBe(0);
  });
});
