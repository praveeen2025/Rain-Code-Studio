/**
 * SnapDev AI - Task History Manager (Main Process)
 * Persists and retrieves local AI developer task history on disk.
 * 100% on-device local execution; zero telemetry or external network transmission.
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { TaskHistoryItem } from '../../shared/types';

export class TaskHistoryManager {
  private historyFilePath: string;
  private maxItems = 50;

  constructor() {
    const dataDir = path.join(process.cwd(), 'database');
    try {
      if (!fsSync.existsSync(dataDir)) {
        fsSync.mkdirSync(dataDir, { recursive: true });
      }
    } catch {
      // Handled gracefully
    }
    this.historyFilePath = path.join(dataDir, 'ai-task-history.json');
  }

  /**
   * Get all recorded AI developer tasks.
   */
  public async getHistory(): Promise<TaskHistoryItem[]> {
    try {
      if (!fsSync.existsSync(this.historyFilePath)) {
        return [];
      }
      const data = await fs.readFile(this.historyFilePath, 'utf-8');
      return JSON.parse(data) as TaskHistoryItem[];
    } catch (err) {
      console.warn('[TaskHistoryManager] Error reading history:', err);
      return [];
    }
  }

  /**
   * Add a new task record or update existing item.
   */
  public async addTask(item: TaskHistoryItem): Promise<boolean> {
    try {
      const history = await this.getHistory();
      const existingIdx = history.findIndex((h) => h.id === item.id);

      if (existingIdx >= 0) {
        history[existingIdx] = item;
      } else {
        history.unshift(item);
        if (history.length > this.maxItems) {
          history.pop();
        }
      }

      await fs.writeFile(this.historyFilePath, JSON.stringify(history, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.warn('[TaskHistoryManager] Error saving task:', err);
      return false;
    }
  }

  /**
   * Delete a specific task by ID.
   */
  public async deleteTask(id: string): Promise<boolean> {
    try {
      const history = await this.getHistory();
      const filtered = history.filter((h) => h.id !== id);
      await fs.writeFile(this.historyFilePath, JSON.stringify(filtered, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.warn('[TaskHistoryManager] Error deleting task:', err);
      return false;
    }
  }

  /**
   * Clear all task history.
   */
  public async clearHistory(): Promise<boolean> {
    try {
      if (fsSync.existsSync(this.historyFilePath)) {
        await fs.unlink(this.historyFilePath);
      }
      return true;
    } catch (err) {
      console.warn('[TaskHistoryManager] Error clearing history:', err);
      return false;
    }
  }
}

export const taskHistoryManager = new TaskHistoryManager();
