/**
 * SnapDev AI - Toast Notification Container
 * Phase 9: Elegant, accessible notification toasts.
 */

import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';
import { useNotifications } from '../../stores/notificationStore';
import { NotificationType } from '../../../shared/types';

const ICON_MAP: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
  info: <Info className="w-4 h-4 text-sky-400 shrink-0" />
};

const BORDER_MAP: Record<NotificationType, string> = {
  success: 'border-emerald-500/30 bg-emerald-950/40 text-emerald-200',
  error: 'border-rose-500/30 bg-rose-950/40 text-rose-200',
  warning: 'border-amber-500/30 bg-amber-950/40 text-amber-200',
  info: 'border-sky-500/30 bg-sky-950/40 text-sky-200'
};

export const ToastContainer: React.FC = () => {
  const { notifications, dismiss } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-8 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none select-none"
    >
      {notifications.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border backdrop-blur-md shadow-xl transition-all animate-slide-in ${
            BORDER_MAP[toast.type]
          } bg-ide-surface/95`}
        >
          {ICON_MAP[toast.type]}

          <div className="flex-1 min-w-0 pr-1">
            <div className="text-xs font-semibold text-white tracking-tight">
              {toast.title}
            </div>
            {toast.message && (
              <p className="text-[11px] text-ide-muted mt-0.5 leading-snug line-clamp-3">
                {toast.message}
              </p>
            )}
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  dismiss(toast.id);
                }}
                className="mt-2 text-[10px] font-semibold text-white px-2 py-0.5 rounded bg-ide-active hover:bg-ide-hover border border-ide-border transition"
              >
                {toast.action.label}
              </button>
            )}
          </div>

          <button
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
            className="text-ide-muted hover:text-white transition p-0.5 rounded hover:bg-white/10 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
