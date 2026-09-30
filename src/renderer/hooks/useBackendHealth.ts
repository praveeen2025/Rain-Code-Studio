/**
 * SnapDev AI - useBackendHealth Hook
 * Monitors the real-time health of the local FastAPI backend.
 * Provides accurate states: 'connected' | 'starting' | 'error'.
 * Never fakes the connection status.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { BackendConnectionStatus } from '../../shared/types';
import { BackendStatus } from '../../shared/api-types';
import { checkBackendHealth, getBackendStatus } from '../services/api';

export interface BackendHealthState {
  status: BackendConnectionStatus;
  details: BackendStatus | null;
  error: string | null;
  lastChecked: Date | null;
  retryCount: number;
}

export function useBackendHealth(pollIntervalMs = 5000) {
  const [health, setHealth] = useState<BackendHealthState>({
    status: 'starting',
    details: null,
    error: null,
    lastChecked: null,
    retryCount: 0
  });

  const isMounted = useRef(true);

  const checkHealth = useCallback(async () => {
    try {
      const healthRes = await checkBackendHealth();

      if (!isMounted.current) return;

      if (healthRes.success && healthRes.data?.status === 'ok') {
        // Fetch detailed status if available
        const statusRes = await getBackendStatus();
        if (!isMounted.current) return;

        setHealth({
          status: 'connected',
          details: statusRes.success && statusRes.data ? statusRes.data : null,
          error: null,
          lastChecked: new Date(),
          retryCount: 0
        });
      } else {
        setHealth((prev) => {
          // If we were starting and haven't exceeded 6 retries, keep starting state
          const newRetries = prev.retryCount + 1;
          const status: BackendConnectionStatus =
            newRetries > 4 ? 'error' : 'starting';

          return {
            status,
            details: null,
            error: healthRes.error || 'Backend not responding',
            lastChecked: new Date(),
            retryCount: newRetries
          };
        });
      }
    } catch (err: unknown) {
      if (!isMounted.current) return;
      const msg = err instanceof Error ? err.message : String(err);
      setHealth((prev) => ({
        status: 'error',
        details: null,
        error: msg,
        lastChecked: new Date(),
        retryCount: prev.retryCount + 1
      }));
    }
  }, []);

  const restartBackend = useCallback(async () => {
    if (!window.electronAPI) return;
    setHealth((prev) => ({ ...prev, status: 'starting', error: null, retryCount: 0 }));
    try {
      await window.electronAPI.restartBackend();
      setTimeout(checkHealth, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setHealth((prev) => ({ ...prev, status: 'error', error: msg }));
    }
  }, [checkHealth]);

  useEffect(() => {
    isMounted.current = true;
    checkHealth();

    // Dynamically adjust interval: faster while starting/reconnecting
    const interval = setInterval(() => {
      checkHealth();
    }, health.status === 'starting' ? 1500 : pollIntervalMs);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [checkHealth, pollIntervalMs, health.status]);

  return {
    ...health,
    refreshHealth: checkHealth,
    restartBackend
  };
}
