/**
 * SnapDev AI - Process Manager
 * Manages the lifecycle of the local Python FastAPI backend.
 * Handles process spawning, port verification, readiness health checks,
 * and clean shutdown to prevent orphan processes.
 */

import { spawn, ChildProcess, exec } from 'child_process';
import http from 'http';
import path from 'path';
import { app } from 'electron';
import {
  DEFAULT_BACKEND_HOST,
  DEFAULT_BACKEND_PORT,
  BACKEND_START_TIMEOUT_MS,
  HEALTH_CHECK_TIMEOUT_MS
} from '../shared/constants';
import { ProcessState } from '../shared/types';

export class ProcessManager {
  private pythonProcess: ChildProcess | null = null;
  private state: ProcessState = {
    isRunning: false,
    pid: null,
    port: DEFAULT_BACKEND_PORT,
    error: null,
    exitCode: null
  };
  private host: string = DEFAULT_BACKEND_HOST;
  private port: number = DEFAULT_BACKEND_PORT;
  private isShuttingDown: boolean = false;

  constructor(host = DEFAULT_BACKEND_HOST, port = DEFAULT_BACKEND_PORT) {
    this.host = host;
    this.port = port;
    this.state.port = port;
  }

  public getState(): ProcessState {
    return { ...this.state };
  }

  /**
   * Determine Python executable path.
   * Checks environment variable first, then platform defaults.
   */
  private resolvePythonExecutable(): string {
    if (process.env.SNAPDEV_PYTHON_PATH) {
      return process.env.SNAPDEV_PYTHON_PATH;
    }
    // Default to system python
    return process.platform === 'win32' ? 'python' : 'python3';
  }

  /**
   * Get path to python/main.py relative to app root.
   */
  private getBackendScriptPath(): string {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'python', 'main.py');
    }
    return path.join(app.getAppPath(), 'python', 'main.py');
  }

  /**
   * Verify if backend HTTP health endpoint is responding.
   */
  public async checkHealth(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const options: http.RequestOptions = {
        hostname: this.host,
        port: this.port,
        path: '/health',
        method: 'GET',
        timeout: HEALTH_CHECK_TIMEOUT_MS
      };

      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve(json.status === 'ok');
            } catch {
              resolve(false);
            }
          });
        } else {
          resolve(false);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.on('error', () => {
        resolve(false);
      });

      req.end();
    });
  }

  /**
   * Wait for the backend to become available with exponential/interval polling.
   */
  private async waitForBackendReady(timeoutMs = BACKEND_START_TIMEOUT_MS): Promise<boolean> {
    const startTime = Date.now();
    const intervalMs = 300;

    while (Date.now() - startTime < timeoutMs) {
      if (this.pythonProcess && this.pythonProcess.exitCode !== null) {
        throw new Error(`Python process exited prematurely with code ${this.pythonProcess.exitCode}`);
      }

      const healthy = await this.checkHealth();
      if (healthy) {
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return false;
  }

  /**
   * Launch the Python FastAPI backend process.
   */
  public async start(): Promise<boolean> {
    if (this.state.isRunning && this.pythonProcess) {
      const isAlive = await this.checkHealth();
      if (isAlive) {
        console.log('[ProcessManager] Backend is already running and healthy.');
        return true;
      }
    }

    // Check if another instance is already running on the target port
    const alreadyResponding = await this.checkHealth();
    if (alreadyResponding) {
      console.log(`[ProcessManager] Backend already responding on port ${this.port}`);
      this.state.isRunning = true;
      this.state.error = null;
      return true;
    }

    const pythonBin = this.resolvePythonExecutable();
    const scriptPath = this.getBackendScriptPath();
    const workingDir = app.isPackaged ? process.resourcesPath : app.getAppPath();

    console.log(`[ProcessManager] Spawning backend: ${pythonBin} ${scriptPath} --host ${this.host} --port ${this.port}`);

    try {
      this.isShuttingDown = false;
      this.pythonProcess = spawn(
        pythonBin,
        [scriptPath, '--host', this.host, '--port', String(this.port)],
        {
          cwd: workingDir,
          env: {
            ...process.env,
            PYTHONUNBUFFERED: '1',
            SNAPDEV_API_HOST: this.host,
            SNAPDEV_API_PORT: String(this.port)
          },
          stdio: ['pipe', 'pipe', 'pipe']
        }
      );

      this.state.pid = this.pythonProcess.pid ?? null;

      this.pythonProcess.stdout?.on('data', (data: Buffer) => {
        const line = data.toString().trim();
        if (line) {
          console.log(`[Python Backend] ${line}`);
        }
      });

      this.pythonProcess.stderr?.on('data', (data: Buffer) => {
        const line = data.toString().trim();
        if (line) {
          console.error(`[Python Backend Error] ${line}`);
        }
      });

      this.pythonProcess.on('error', (err) => {
        console.error('[ProcessManager] Failed to start Python process:', err);
        this.state.isRunning = false;
        this.state.error = err.message;
      });

      this.pythonProcess.on('exit', (code, signal) => {
        console.log(`[ProcessManager] Python backend exited (code: ${code}, signal: ${signal})`);
        this.state.isRunning = false;
        this.state.exitCode = code;
        this.state.pid = null;

        if (!this.isShuttingDown && code !== 0) {
          this.state.error = `Backend process exited unexpectedly with code ${code}`;
        }
      });

      // Poll until backend is online
      const ready = await this.waitForBackendReady();
      if (ready) {
        this.state.isRunning = true;
        this.state.error = null;
        console.log(`[ProcessManager] Backend ready and verified on http://${this.host}:${this.port}`);
        return true;
      } else {
        throw new Error(`Backend failed to respond within ${timeoutMsToSeconds(BACKEND_START_TIMEOUT_MS)}s`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.state.isRunning = false;
      this.state.error = message;
      console.error('[ProcessManager] Backend startup failed:', message);
      return false;
    }
  }

  /**
   * Stop the backend process and clean up subprocess trees.
   */
  public async stop(): Promise<void> {
    this.isShuttingDown = true;
    const pid = this.state.pid;

    if (!pid || !this.pythonProcess) {
      this.state.isRunning = false;
      return;
    }

    const numericPid = typeof pid === 'number' ? Math.floor(pid) : parseInt(String(pid), 10);
    if (isNaN(numericPid) || numericPid <= 0) {
      this.cleanupState();
      return;
    }

    console.log(`[ProcessManager] Terminating backend process (PID ${numericPid})...`);

    return new Promise<void>((resolve) => {
      if (process.platform === 'win32') {
        // Force-kill process tree on Windows to prevent orphan processes
        exec(`taskkill /pid ${numericPid} /T /F`, (error) => {
          if (error) {
            console.warn('[ProcessManager] taskkill reported:', error.message);
          }
          this.cleanupState();
          resolve();
        });
      } else {
        this.pythonProcess?.kill('SIGTERM');
        const timeout = setTimeout(() => {
          if (this.pythonProcess && !this.pythonProcess.killed) {
            this.pythonProcess.kill('SIGKILL');
          }
          this.cleanupState();
          resolve();
        }, 2000);

        this.pythonProcess?.once('exit', () => {
          clearTimeout(timeout);
          this.cleanupState();
          resolve();
        });
      }
    });
  }

  private cleanupState(): void {
    this.state.isRunning = false;
    this.state.pid = null;
    this.pythonProcess = null;
  }
}

function timeoutMsToSeconds(ms: number): number {
  return Math.round(ms / 1000);
}
