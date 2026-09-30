/**
 * SnapDev AI - useChat Hook
 * Connects React components to the ChatStore for local AI inference and model management.
 */

import { useState, useEffect } from 'react';
import { chatStore } from '../stores/chatStore';
import { GenerationSettings } from '../../shared/types';

export function useChat() {
  const [state, setState] = useState(chatStore.getState());

  useEffect(() => {
    const unsubscribe = chatStore.subscribe(() => {
      setState(chatStore.getState());
    });
    return unsubscribe;
  }, []);

  return {
    ...state,
    sendMessage: (query: string, projectId?: string | null) =>
      chatStore.sendMessage(query, projectId),
    stopGeneration: () => chatStore.stopGeneration(),
    clearChat: () => chatStore.clearChat(),
    loadLocalModel: (path?: string, device?: string) =>
      chatStore.loadLocalModel(path, device),
    unloadLocalModel: () => chatStore.unloadLocalModel(),
    refreshStatus: () => chatStore.refreshStatus(),
    updateSettings: (newSettings: Partial<GenerationSettings>) =>
      chatStore.updateSettings(newSettings)
  };
}
