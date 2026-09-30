/**
 * SnapDev AI - Reusable Confirmation Dialog
 * Phase 9: For destructive or consequential user actions.
 */

import React from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      showCloseButton={!isLoading}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            isDestructive
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
          }`}
        >
          {isDestructive ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white tracking-tight">
            {title}
          </h4>
          <p className="text-xs text-ide-muted mt-1 leading-relaxed">
            {message}
          </p>

          <div className="mt-5 flex items-center justify-end gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button
              variant={isDestructive ? 'destructive' : 'primary'}
              size="sm"
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
