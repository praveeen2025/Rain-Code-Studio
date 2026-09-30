/**
 * SnapDev AI - API Types
 * Definitions for FastAPI backend HTTP communication.
 */

export interface BackendHealth {
  status: 'ok' | 'error' | string;
  service: string;
}

export interface BackendConfigDetails {
  api_host: string;
  api_port: number;
  environment: string;
  model_path: string;
  model_name: string;
  model_device: string;
}

export interface BackendStatus {
  status: 'online' | 'starting' | 'error' | string;
  service: string;
  version: string;
  environment: string;
  port: number;
  device: string;
  uptime_seconds: number;
  phase: string;
  config: BackendConfigDetails;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  timestamp: string;
}
