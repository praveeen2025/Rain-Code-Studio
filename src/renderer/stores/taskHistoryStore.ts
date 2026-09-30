/**
 * SnapDev AI - Task History Store
 * Phase 6: Local AI Task History and Persistence.
 * Keeps developer AI task history strictly local on-device.
 */

import { useState, useEffect } from 'react';
import { TaskHistoryItem } from '../../shared/types';

type Listener = () => void;

interface TaskHistoryState {
  tasks: TaskHistoryItem[];
  activeTask: TaskHistoryItem | null;
  isLoading: boolean;
  error: string | null;
}

class TaskHistoryStore {
  private state: TaskHistoryState = {
    tasks: [],
    activeTask: null,
    isLoading: false,
    error: null
  };

  private listeners: Set<Listener> = new Set();

  public getState(): TaskHistoryState {
    return this.state;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public setState(updates: Partial<TaskHistoryState>): void {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  /**
   * Load task history from local storage / disk via IPC.
   */
  public async loadTasks(projectId?: string): Promise<TaskHistoryItem[]> {
    if (typeof window === 'undefined' || !window.electronAPI?.getTaskHistory) {
      return [];
    }

    this.setState({ isLoading: true, error: null });
    try {
      const tasks = await window.electronAPI.getTaskHistory(projectId);
      this.setState({ tasks, isLoading: false });
      return tasks;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.setState({ isLoading: false, error: msg });
      return [];
    }
  }

  /**
   * Record a new AI developer task in local history.
   */
  public async recordTask(task: TaskHistoryItem): Promise<void> {
    // Optimistic update
    const updated = [task, ...this.state.tasks.filter((t) => t.id !== task.id)];
    this.setState({ tasks: updated, activeTask: task });

    if (typeof window !== 'undefined' && window.electronAPI?.addTaskHistory) {
      try {
        await window.electronAPI.addTaskHistory(task);
      } catch (err) {
        console.error('Failed to persist task history:', err);
      }
    }
  }

  /**
   * Update an existing task status (e.g. applied or rejected).
   */
  public async updateTaskStatus(taskId: string, status: 'pending' | 'applied' | 'rejected'): Promise<void> {
    const updated = this.state.tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
    const active = this.state.activeTask?.id === taskId ? { ...this.state.activeTask, status } : this.state.activeTask;
    this.setState({ tasks: updated, activeTask: active });

    const target = updated.find((t) => t.id === taskId);
    if (target && typeof window !== 'undefined' && window.electronAPI?.addTaskHistory) {
      try {
        await window.electronAPI.addTaskHistory(target);
      } catch (err) {
        console.error('Failed to update task history status:', err);
      }
    }
  }

  /**
   * Delete a single task record.
   */
  public async deleteTask(taskId: string): Promise<void> {
    const filtered = this.state.tasks.filter((t) => t.id !== taskId);
    const active = this.state.activeTask?.id === taskId ? null : this.state.activeTask;
    this.setState({ tasks: filtered, activeTask: active });

    if (typeof window !== 'undefined' && window.electronAPI?.deleteTaskHistory) {
      try {
        await window.electronAPI.deleteTaskHistory(taskId);
      } catch (err) {
        console.error('Failed to delete task from disk:', err);
      }
    }
  }

  /**
   * Clear all task history for current project.
   */
  public async clearTasks(projectId?: string): Promise<void> {
    this.setState({ tasks: [], activeTask: null });
    if (typeof window !== 'undefined' && window.electronAPI?.clearTaskHistory) {
      try {
        await window.electronAPI.clearTaskHistory(projectId);
      } catch (err) {
        console.error('Failed to clear task history from disk:', err);
      }
    }
  }

  public selectTask(task: TaskHistoryItem | null): void {
    this.setState({ activeTask: task });
  }
}

export const taskHistoryStore = new TaskHistoryStore();

export function useTaskHistory(projectId?: string) {
  const [state, setState] = useState(taskHistoryStore.getState());

  useEffect(() => {
    taskHistoryStore.loadTasks(projectId);
    return taskHistoryStore.subscribe(() => {
      setState(taskHistoryStore.getState());
    });
  }, [projectId]);

  return {
    ...state,
    recordTask: (t: TaskHistoryItem) => taskHistoryStore.recordTask(t),
    updateTaskStatus: (id: string, s: 'pending' | 'applied' | 'rejected') => taskHistoryStore.updateTaskStatus(id, s),
    deleteTask: (id: string) => taskHistoryStore.deleteTask(id),
    clearTasks: () => taskHistoryStore.clearTasks(projectId),
    selectTask: (t: TaskHistoryItem | null) => taskHistoryStore.selectTask(t),
    refreshTasks: () => taskHistoryStore.loadTasks(projectId)
  };
}
