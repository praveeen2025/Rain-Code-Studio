/**
 * Rain Code Studio - Local Model Discovery Service
 * Phase 12.2: Automatic detection of locally installed AI models.
 *
 * Scans configurable search paths and well-known provider directories
 * for compatible model files (GGUF, SafeTensors, ONNX, etc.)
 * and Ollama / LM Studio / Jan registries.
 *
 * Security: Never executes model files. Path traversal is prevented.
 * Privacy: Zero telemetry. Fully on-device.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import {
  LocalModel,
  LocalModelFormat,
  LocalModelProvider,
  LocalModelStatus,
  LocalModelCapabilities,
  LocalModelHardwareRequirements,
  ModelRegistry,
  ModelDiscoveryResult,
  ModelValidationResult,
  ModelActivationResult,
  ModelImportRequest
} from '../../shared/types';

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const GGUF_EXTENSIONS = ['.gguf'];
const SAFETENSORS_EXTENSIONS = ['.safetensors'];
const ONNX_EXTENSIONS = ['.onnx'];
const PYTORCH_EXTENSIONS = ['.pt', '.pth', '.bin'];
const MODEL_EXTENSIONS = [
  ...GGUF_EXTENSIONS,
  ...SAFETENSORS_EXTENSIONS,
  ...ONNX_EXTENSIONS,
  ...PYTORCH_EXTENSIONS
];

// Maximum directory depth to recurse into
const MAX_SCAN_DEPTH = 4;
// Max file size we show (200 GB guard)
const MAX_MODEL_FILE_BYTES = 200 * 1024 * 1024 * 1024;

// ──────────────────────────────────────────────────────────────────────────────
// Default well-known search locations per platform
// ──────────────────────────────────────────────────────────────────────────────
function getDefaultSearchPaths(): string[] {
  const home = os.homedir();
  const paths: string[] = [];

  // Ollama model store
  if (process.platform === 'win32') {
    paths.push(path.join(home, 'AppData', 'Local', 'Ollama', 'models'));
    paths.push(path.join(home, '.ollama', 'models'));
    paths.push(path.join(home, 'AppData', 'Roaming', 'LM Studio', 'models'));
    paths.push(path.join(home, 'AppData', 'Roaming', 'Jan', 'models'));
    paths.push(path.join(home, '.cache', 'huggingface', 'hub'));
    paths.push(path.join('C:', 'Users', os.userInfo().username, '.lmstudio', 'models'));
  } else if (process.platform === 'darwin') {
    paths.push(path.join(home, '.ollama', 'models'));
    paths.push(path.join(home, 'Library', 'Application Support', 'LM Studio', 'models'));
    paths.push(path.join(home, 'Library', 'Application Support', 'Jan', 'models'));
    paths.push(path.join(home, '.cache', 'huggingface', 'hub'));
    paths.push(path.join(home, '.lmstudio', 'models'));
  } else {
    // Linux
    paths.push(path.join(home, '.ollama', 'models'));
    paths.push(path.join(home, '.cache', 'huggingface', 'hub'));
    paths.push(path.join(home, '.local', 'share', 'lmstudio', 'models'));
    paths.push(path.join(home, '.jan', 'models'));
    paths.push('/usr/local/lib/models');
    paths.push('/opt/models');
  }

  return paths.filter((p) => {
    try { return fs.existsSync(p); } catch { return false; }
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper utilities
// ──────────────────────────────────────────────────────────────────────────────

function stableId(filePath: string): string {
  return crypto.createHash('sha1').update(filePath).digest('hex').slice(0, 16);
}

function detectFormat(filePath: string): LocalModelFormat {
  const ext = path.extname(filePath).toLowerCase();
  if (GGUF_EXTENSIONS.includes(ext)) return 'gguf';
  if (SAFETENSORS_EXTENSIONS.includes(ext)) return 'safetensors';
  if (ONNX_EXTENSIONS.includes(ext)) return 'onnx';
  if (['.pt', '.pth'].includes(ext)) return 'pytorch';
  if (ext === '.bin') return 'pytorch';
  return 'unknown';
}

function guessProvider(filePath: string, format: LocalModelFormat): LocalModelProvider {
  const lower = filePath.toLowerCase();
  if (lower.includes('.ollama') || lower.includes('ollama')) return 'ollama';
  if (lower.includes('lm studio') || lower.includes('lmstudio')) return 'lmstudio';
  if (lower.includes('jan')) return 'jan';
  if (lower.includes('huggingface') || lower.includes('.cache/hub')) return 'huggingface';
  if (format === 'gguf') return 'llamacpp';
  if (format === 'onnx') return 'custom';
  return 'custom';
}

/** Extract model family/version hints from the filename */
function parseModelName(filePath: string): { name: string; family: string; version: string; parameterCount: string; quantization: string } {
  const base = path.basename(filePath, path.extname(filePath));

  // Common quantization suffixes
  const quantPatterns = ['q4_k_m', 'q4_k_s', 'q5_k_m', 'q8_0', 'q6_k', 'q4_0', 'q4_1',
    'f16', 'f32', 'fp16', 'fp32', 'int8', 'int4', 'bnb4', 'awq', 'gptq'];
  let quantization = 'unknown';
  for (const q of quantPatterns) {
    if (base.toLowerCase().includes(q)) {
      quantization = q;
      break;
    }
  }

  // Common parameter count patterns
  const paramPatterns = /(\d+(\.\d+)?[bBmM])/;
  const paramMatch = base.match(paramPatterns);
  const parameterCount = paramMatch ? paramMatch[1].toUpperCase() : 'Unknown';

  // Family detection
  const families: [string, string][] = [
    ['llama', 'Llama'], ['mistral', 'Mistral'], ['mixtral', 'Mixtral'],
    ['phi', 'Phi'], ['qwen', 'Qwen'], ['gemma', 'Gemma'], ['falcon', 'Falcon'],
    ['starcoder', 'StarCoder'], ['codellama', 'CodeLlama'], ['deepseek', 'DeepSeek'],
    ['vicuna', 'Vicuna'], ['orca', 'Orca'], ['wizardcoder', 'WizardCoder'],
    ['codestral', 'Codestral'], ['granite', 'Granite'], ['openchat', 'OpenChat'],
    ['neural', 'Neural'], ['hermes', 'Hermes'], ['tinyllama', 'TinyLlama'],
    ['yi', 'Yi'], ['nous', 'Nous'], ['solar', 'Solar']
  ];

  let family = 'Custom';
  for (const [key, label] of families) {
    if (base.toLowerCase().includes(key)) {
      family = label;
      break;
    }
  }

  // Clean display name
  const name = base.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  const version = parameterCount !== 'Unknown' ? parameterCount : 'Unknown';

  return { name, family, version, parameterCount, quantization };
}

/** Infer context length from filename hints or use format defaults */
function guessContextLength(name: string, format: LocalModelFormat): number {
  const lower = name.toLowerCase();
  if (lower.includes('128k')) return 131072;
  if (lower.includes('64k')) return 65536;
  if (lower.includes('32k')) return 32768;
  if (lower.includes('16k')) return 16384;
  if (lower.includes('8k')) return 8192;
  if (format === 'gguf') return 4096;
  if (format === 'safetensors') return 4096;
  return 2048;
}

/** Estimate RAM requirements from file size */
function estimateHardware(fileSizeBytes: number): LocalModelHardwareRequirements {
  const fileSizeMb = Math.round(fileSizeBytes / (1024 * 1024));
  // Rough rule: need ~1.2x file size as RAM
  const minRamMb = Math.round(fileSizeMb * 1.2);
  const recommendedRamMb = Math.round(fileSizeMb * 1.5);
  return {
    minRamMb,
    recommendedRamMb,
    gpuSupported: true,
    npuSupported: false,
    estimatedVramMb: fileSizeMb
  };
}

function defaultCapabilities(): LocalModelCapabilities {
  return { chat: true, completion: true, embedding: false, vision: false, functionCalling: false };
}

function buildLocalModel(
  filePath: string,
  stat: fs.Stats,
  overrides: Partial<LocalModel> = {}
): LocalModel {
  const format = detectFormat(filePath);
  const provider = guessProvider(filePath, format);
  const parsed = parseModelName(filePath);
  const contextLength = guessContextLength(parsed.name, format);
  const hardware = estimateHardware(stat.size);

  return {
    id: stableId(filePath),
    name: overrides.name ?? parsed.name,
    family: parsed.family,
    version: parsed.version,
    format,
    quantization: parsed.quantization,
    contextLength,
    parameterCount: parsed.parameterCount,
    filePath,
    fileSize: stat.size,
    provider: overrides.provider ?? provider,
    status: 'Discovered',
    capabilities: defaultCapabilities(),
    hardware,
    discoveredAt: new Date().toISOString(),
    tags: [parsed.family.toLowerCase(), format, parsed.quantization],
    isImported: overrides.isImported ?? false,
    endpointUrl: overrides.endpointUrl
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Ollama API scanner (HTTP-based, no shell execution)
// ──────────────────────────────────────────────────────────────────────────────

async function discoverOllamaModels(): Promise<LocalModel[]> {
  const ollamaUrls = ['http://localhost:11434', 'http://127.0.0.1:11434'];
  for (const baseUrl of ollamaUrls) {
    try {
      const res = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) continue;
      const data = await res.json() as { models?: Array<{ name: string; size: number; details?: Record<string, unknown> }> };
      const models: LocalModel[] = (data.models ?? []).map((m) => {
        const parsed = parseModelName(m.name);
        return {
          id: stableId(`ollama:${m.name}`),
          name: m.name,
          family: parsed.family,
          version: parsed.version,
          format: 'gguf' as LocalModelFormat,
          quantization: parsed.quantization,
          contextLength: 4096,
          parameterCount: parsed.parameterCount,
          filePath: `ollama:${m.name}`,
          fileSize: m.size ?? 0,
          provider: 'ollama' as LocalModelProvider,
          status: 'Ready' as LocalModelStatus,
          capabilities: defaultCapabilities(),
          hardware: estimateHardware(m.size ?? 0),
          discoveredAt: new Date().toISOString(),
          tags: ['ollama', parsed.family.toLowerCase()],
          isImported: false,
          endpointUrl: baseUrl
        };
      });
      return models;
    } catch {
      // Ollama not running — silently skip
    }
  }
  return [];
}

// ──────────────────────────────────────────────────────────────────────────────
// Filesystem scanner
// ──────────────────────────────────────────────────────────────────────────────

function scanDirectory(dirPath: string, depth = 0, results: LocalModel[] = [], errors: string[] = []): LocalModel[] {
  if (depth > MAX_SCAN_DEPTH) return results;

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    // Skip hidden dirs and symlinks for security
    if (entry.name.startsWith('.') && depth > 0) continue;

    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath, depth + 1, results, errors);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!MODEL_EXTENSIONS.includes(ext)) continue;

      try {
        const stat = fs.statSync(fullPath);
        if (stat.size === 0 || stat.size > MAX_MODEL_FILE_BYTES) continue;
        results.push(buildLocalModel(fullPath, stat));
      } catch (err) {
        errors.push(`Failed to stat ${fullPath}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  return results;
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Service Class
// ──────────────────────────────────────────────────────────────────────────────

export class LocalModelDiscoveryService {
  private registry: ModelRegistry = {
    models: [],
    activeModelId: null,
    lastDiscoveryAt: null,
    searchPaths: [],
    discoveryStats: { totalScanned: 0, discovered: 0, errors: 0, durationMs: 0 }
  };

  constructor() {
    this.registry.searchPaths = getDefaultSearchPaths();
  }

  // ── Registry ──────────────────────────────────────────────────────────────

  public getRegistry(): ModelRegistry {
    return { ...this.registry, models: [...this.registry.models] };
  }

  // ── Search Paths ──────────────────────────────────────────────────────────

  public getSearchPaths(): string[] {
    return [...this.registry.searchPaths];
  }

  public addSearchPath(dirPath: string): string[] {
    const resolved = path.resolve(dirPath);
    if (!this.registry.searchPaths.includes(resolved)) {
      this.registry.searchPaths.push(resolved);
    }
    return this.getSearchPaths();
  }

  public removeSearchPath(dirPath: string): string[] {
    const resolved = path.resolve(dirPath);
    this.registry.searchPaths = this.registry.searchPaths.filter((p) => p !== resolved);
    return this.getSearchPaths();
  }

  // ── Discovery ─────────────────────────────────────────────────────────────

  public async discover(): Promise<ModelDiscoveryResult> {
    const startMs = Date.now();
    const errors: string[] = [];
    const discovered: LocalModel[] = [];
    let totalScanned = 0;

    // 1. Scan filesystem paths
    for (const searchPath of this.registry.searchPaths) {
      try {
        if (!fs.existsSync(searchPath)) continue;
        const before = discovered.length;
        scanDirectory(searchPath, 0, discovered, errors);
        totalScanned += discovered.length - before;
      } catch (err) {
        errors.push(`Error scanning ${searchPath}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // 2. Query Ollama HTTP API
    try {
      const ollamaModels = await discoverOllamaModels();
      discovered.push(...ollamaModels);
    } catch (err) {
      errors.push(`Ollama discovery error: ${err instanceof Error ? err.message : String(err)}`);
    }

    // 3. Deduplicate by ID (preserve active/imported state from existing registry)
    const existingById = new Map(this.registry.models.map((m) => [m.id, m]));
    const deduplicated = new Map<string, LocalModel>();

    for (const model of discovered) {
      const existing = existingById.get(model.id);
      if (existing) {
        // Preserve user-set state
        deduplicated.set(model.id, {
          ...model,
          status: existing.status === 'Active' ? 'Active' : model.status,
          isImported: existing.isImported,
          name: existing.name // preserve user-renamed names
        });
      } else {
        deduplicated.set(model.id, model);
      }
    }

    // 4. Also preserve manually imported models not on disk paths
    for (const [id, model] of existingById) {
      if (model.isImported && !deduplicated.has(id)) {
        deduplicated.set(id, model);
      }
    }

    const newModels = [...deduplicated.values()].filter((m) => !existingById.has(m.id));
    const durationMs = Date.now() - startMs;

    this.registry = {
      ...this.registry,
      models: [...deduplicated.values()],
      lastDiscoveryAt: new Date().toISOString(),
      discoveryStats: {
        totalScanned,
        discovered: deduplicated.size,
        errors: errors.length,
        durationMs
      }
    };

    return {
      success: true,
      registry: this.getRegistry(),
      newModels,
      errors,
      durationMs
    };
  }

  // ── Validation ────────────────────────────────────────────────────────────

  public async validate(modelId: string): Promise<ModelValidationResult> {
    const model = this.registry.models.find((m) => m.id === modelId);
    if (!model) {
      return {
        modelId,
        isValid: false,
        status: 'Error',
        checks: [],
        errorMessage: `Model ${modelId} not found in registry.`
      };
    }

    const checks: ModelValidationResult['checks'] = [];

    // Check 1: File/endpoint exists
    const isOllama = model.filePath.startsWith('ollama:');
    if (isOllama) {
      let ollamaReachable = false;
      try {
        const res = await fetch(`${model.endpointUrl ?? 'http://localhost:11434'}/api/tags`, {
          signal: AbortSignal.timeout(3000)
        });
        ollamaReachable = res.ok;
      } catch { /* ignore */ }
      checks.push({ name: 'Ollama endpoint reachable', passed: ollamaReachable, detail: ollamaReachable ? 'Ollama API responded' : 'Ollama not reachable' });
    } else {
      let fileExists = false;
      let fileSizeOk = false;
      try {
        const stat = fs.statSync(model.filePath);
        fileExists = true;
        fileSizeOk = stat.size > 0 && stat.size <= MAX_MODEL_FILE_BYTES;
      } catch { /* ignore */ }
      checks.push({ name: 'File exists on disk', passed: fileExists, detail: fileExists ? model.filePath : 'File not found' });
      checks.push({ name: 'File size valid', passed: fileSizeOk, detail: fileSizeOk ? `${Math.round(model.fileSize / 1024 / 1024)} MB` : 'File is empty or exceeds 200GB limit' });
    }

    // Check 2: Format recognized
    const formatKnown = model.format !== 'unknown';
    checks.push({ name: 'Model format recognized', passed: formatKnown, detail: `Format: ${model.format}` });

    // Check 3: Provider configured
    const providerOk = model.provider !== 'custom' || Boolean(model.endpointUrl);
    checks.push({ name: 'Provider configured', passed: providerOk, detail: `Provider: ${model.provider}` });

    const allPassed = checks.every((c) => c.passed);
    const newStatus: LocalModelStatus = allPassed ? 'Validated' : 'Error';

    // Update registry
    this.registry.models = this.registry.models.map((m) =>
      m.id === modelId
        ? { ...m, status: newStatus, lastValidatedAt: new Date().toISOString(), errorMessage: allPassed ? undefined : 'One or more validation checks failed' }
        : m
    );

    return {
      modelId,
      isValid: allPassed,
      status: newStatus,
      checks,
      errorMessage: allPassed ? undefined : 'One or more validation checks failed'
    };
  }

  // ── Activation ────────────────────────────────────────────────────────────

  public async activate(modelId: string): Promise<ModelActivationResult> {
    const model = this.registry.models.find((m) => m.id === modelId);
    if (!model) {
      return { success: false, modelId, message: `Model ${modelId} not found in registry.` };
    }

    const previousActiveModelId = this.registry.activeModelId ?? undefined;

    // Deactivate current active model in registry
    this.registry.models = this.registry.models.map((m) => ({
      ...m,
      status: m.status === 'Active' ? 'Ready' : m.status
    }));

    // ── Tell the Python backend to actually load/switch the model ──────────
    try {
      const { aiBackendClient } = await import('./ai-backend-client');
      const backendResult = await aiBackendClient.loadHubModel({
        modelId: model.id,
        modelName: model.provider === 'ollama'
          ? model.filePath.replace('ollama:', '')  // "llama3:latest"
          : model.name,
        provider: model.provider,
        filePath: model.provider !== 'ollama' ? model.filePath : undefined,
        endpointUrl: model.endpointUrl,
        contextLength: model.contextLength,
        format: model.format
      });

      if (!backendResult.success) {
        // Registry stays un-activated; surface the error to UI
        return {
          success: false,
          modelId,
          message: `Backend load failed: ${backendResult.message}`
        };
      }
    } catch (err) {
      // Backend unreachable (e.g. Python process not yet up) — still activate in registry
      console.warn(`[ModelHub] Backend load call failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Activate in registry
    this.registry.models = this.registry.models.map((m) =>
      m.id === modelId ? { ...m, status: 'Active' as LocalModelStatus } : m
    );
    this.registry.activeModelId = modelId;

    return {
      success: true,
      modelId,
      message: `Model "${model.name}" is now active.`,
      previousActiveModelId
    };
  }

  public deactivate(): { success: boolean; message: string } {
    if (!this.registry.activeModelId) {
      return { success: false, message: 'No model is currently active.' };
    }
    this.registry.models = this.registry.models.map((m) => ({
      ...m,
      status: m.status === 'Active' ? ('Ready' as LocalModelStatus) : m.status
    }));
    this.registry.activeModelId = null;
    return { success: true, message: 'Active model deactivated.' };
  }

  // ── Import ────────────────────────────────────────────────────────────────

  public async importModel(req: ModelImportRequest): Promise<{ success: boolean; model?: LocalModel; error?: string }> {
    const { filePath, name, provider, endpointUrl } = req;

    // Ollama model by name (e.g. "llama3:latest")
    const isOllamaRef = !path.isAbsolute(filePath) && !filePath.includes(path.sep);
    if (isOllamaRef || (provider === 'ollama')) {
      const modelName = filePath;
      const id = stableId(`ollama:${modelName}`);
      const existing = this.registry.models.find((m) => m.id === id);
      if (existing) return { success: false, error: `Model "${modelName}" is already in the registry.` };

      const parsed = parseModelName(modelName);
      const model: LocalModel = {
        id,
        name: name ?? modelName,
        family: parsed.family,
        version: parsed.version,
        format: 'gguf',
        quantization: parsed.quantization,
        contextLength: 4096,
        parameterCount: parsed.parameterCount,
        filePath: `ollama:${modelName}`,
        fileSize: 0,
        provider: 'ollama',
        status: 'Ready',
        capabilities: defaultCapabilities(),
        hardware: { minRamMb: 0, recommendedRamMb: 8192, gpuSupported: true, npuSupported: false },
        discoveredAt: new Date().toISOString(),
        tags: ['ollama', 'imported'],
        isImported: true,
        endpointUrl: endpointUrl ?? 'http://localhost:11434'
      };
      this.registry.models.push(model);
      return { success: true, model };
    }

    // Regular file import
    const resolved = path.resolve(filePath);

    // Security: ensure absolute path with recognized extension
    const ext = path.extname(resolved).toLowerCase();
    if (!MODEL_EXTENSIONS.includes(ext)) {
      return { success: false, error: `Unsupported model file extension: ${ext}` };
    }

    let stat: fs.Stats;
    try {
      stat = fs.statSync(resolved);
    } catch {
      return { success: false, error: `File not found or not accessible: ${resolved}` };
    }

    if (!stat.isFile()) return { success: false, error: 'Path must point to a file, not a directory.' };
    if (stat.size === 0) return { success: false, error: 'File is empty.' };
    if (stat.size > MAX_MODEL_FILE_BYTES) return { success: false, error: 'File exceeds 200GB size limit.' };

    const id = stableId(resolved);
    const existing = this.registry.models.find((m) => m.id === id);
    if (existing) return { success: false, error: `Model at "${resolved}" is already in the registry.` };

    const model = buildLocalModel(resolved, stat, {
      name: name ?? undefined,
      provider: provider ?? undefined,
      isImported: true,
      endpointUrl
    });
    model.status = 'Discovered';

    this.registry.models.push(model);
    return { success: true, model };
  }

  // ── Remove ────────────────────────────────────────────────────────────────

  public removeModel(modelId: string): { success: boolean; message: string } {
    const idx = this.registry.models.findIndex((m) => m.id === modelId);
    if (idx === -1) return { success: false, message: `Model ${modelId} not found.` };

    const model = this.registry.models[idx];
    this.registry.models.splice(idx, 1);

    if (this.registry.activeModelId === modelId) {
      this.registry.activeModelId = null;
    }

    return { success: true, message: `Model "${model.name}" removed from registry.` };
  }
}

export const localModelDiscoveryService = new LocalModelDiscoveryService();
