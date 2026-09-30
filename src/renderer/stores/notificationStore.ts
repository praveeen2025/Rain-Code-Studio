/**
 * SnapDev AI - Notification & Toast Store
 * Phase 9: Unified on-device desktop notification system.
 * Non-blocking, accessible, with auto-dismiss and priority styling.
 */

import { useState, useEffect } from 'react';
import { ToastNotification } from '../../shared/types';

type NotificationListener = (notifications: ToastNotification[]) => void;

class NotificationStore {
  private notifications: ToastNotification[] = [];
  private listeners: Set<NotificationListener> = new Set();
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  public getNotifications(): ToastNotification[] {
    return [...this.notifications];
  }

  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    listener(this.getNotifications());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const list = this.getNotifications();
    this.listeners.forEach((listener) => listener(list));
  }

  public notify(toast: Omit<ToastNotification, 'id'>): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const duration = toast.durationMs ?? (toast.type === 'error' ? 6000 : 4000);

    const newNotification: ToastNotification = {
      ...toast,
      id,
      durationMs: duration
    };

    // Keep at most 5 notifications on screen at a time
    this.notifications = [newNotification, ...this.notifications.slice(0, 4)];
    this.notifyListeners();

    if (duration > 0) {
      const timer = setTimeout(() => {
        this.dismiss(id);
      }, duration);
      this.timers.set(id, timer);
    }

    return id;
  }

  public dismiss(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notifyListeners();
  }

  public clear(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    this.notifications = [];
    this.notifyListeners();
  }

  public success(title: string, message?: string, durationMs?: number): string {
    return this.notify({ type: 'success', title, message, durationMs });
  }

  public info(title: string, message?: string, durationMs?: number): string {
    return this.notify({ type: 'info', title, message, durationMs });
  }

  public warning(title: string, message?: string, durationMs?: number): string {
    return this.notify({ type: 'warning', title, message, durationMs });
  }

  public error(title: string, message?: string, durationMs?: number): string {
    return this.notify({ type: 'error', title, message, durationMs });
  }
}

export const notificationStore = new NotificationStore();

/**
 * React hook for consuming notifications
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<ToastNotification[]>(() =>
    notificationStore.getNotifications()
  );

  useEffect(() => {
    return notificationStore.subscribe(setNotifications);
  }, []);

  return {
    notifications,
    notify: notificationStore.notify.bind(notificationStore),
    dismiss: notificationStore.dismiss.bind(notificationStore),
    clear: notificationStore.clear.bind(notificationStore),
    notifySuccess: notificationStore.success.bind(notificationStore),
    notifyInfo: notificationStore.info.bind(notificationStore),
    notifyWarning: notificationStore.warning.bind(notificationStore),
    notifyError: notificationStore.error.bind(notificationStore)
  };
}
