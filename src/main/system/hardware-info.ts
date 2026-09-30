/**
 * SnapDev AI - Hardware Information & Snapdragon Detection Service
 * Phase 8: Snapdragon Optimisation & Performance
 *
 * Implements factual hardware detection and multi-signal Snapdragon detection
 * without inventing hardware acceleration or fabricating benchmark values.
 */

import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import type {
  HardwareInfo,
  SnapdragonDetectionStatus,
  AIExecutionProfile,
  DeviceCapabilities
} from '../../shared/types';

const execFileAsync = promisify(execFile);

// Snapdragon / Qualcomm identification patterns (lowercase)
const QUALCOMM_IDENTIFIERS = [
  'qualcomm',
  'snapdragon',
  'sc8380',
  'sc8280',
  'x elite',
  'x plus',
  'sq1',
  'sq2',
  'sq3',
  'adreno',
  'hexagon'
];

export interface MockHardwareEnv {
  arch?: string;
  processorIdentifier?: string;
  cpuModel?: string;
  manufacturer?: string;
  logicalCores?: number;
  physicalCores?: number | null;
  totalMem?: number;
  freeMem?: number;
  gpuName?: string | null;
  hasQnnDriver?: boolean;
}

export class HardwareInfoService {
  private cachedInfo: HardwareInfo | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_TTL_MS = 15000; // Cache hardware specs for 15s

  /**
   * Determine Snapdragon status using multi-signal analysis.
   * Signal 1: Architecture (must be arm64/aarch64)
   * Signal 2: CPU model name string
   * Signal 3: Windows PROCESSOR_IDENTIFIER environment variable
   * Signal 4: Hardware manufacturer info
   */
  public evaluateSnapdragonSignals(signals: {
    arch: string;
    cpuModel: string;
    processorIdentifier?: string;
    manufacturer?: string;
  }): {
    status: SnapdragonDetectionStatus;
    isQualcomm: boolean;
    reason: string;
  } {
    const archLower = (signals.arch || '').toLowerCase();
    const isArm64 = archLower === 'arm64' || archLower === 'aarch64';
    const cpuModelLower = (signals.cpuModel || '').toLowerCase();
    const procIdLower = (signals.processorIdentifier || '').toLowerCase();
    const mfgLower = (signals.manufacturer || '').toLowerCase();

    // Check for Qualcomm keywords in CPU model, processor ID, and manufacturer
    const hasQualcommName = QUALCOMM_IDENTIFIERS.some(
      (keyword) =>
        cpuModelLower.includes(keyword) ||
        procIdLower.includes(keyword) ||
        mfgLower.includes(keyword)
    );

    // If architecture is definitely x86/x64 (e.g. Intel, AMD)
    if (!isArm64 && (archLower === 'x64' || archLower === 'ia32' || archLower === 'x86_64')) {
      return {
        status: 'Snapdragon Not Detected',
        isQualcomm: false,
        reason: `x86_64 architecture detected (${signals.cpuModel || 'Intel/AMD'}). Snapdragon optimization inactive.`
      };
    }

    // If ARM64 and verified Qualcomm signature
    if (isArm64 && hasQualcommName) {
      return {
        status: 'Snapdragon Detected',
        isQualcomm: true,
        reason: 'Qualcomm Snapdragon ARM64 processor verified via architecture and hardware signatures.'
      };
    }

    // If ARM64 but unknown manufacturer / no Qualcomm signature
    if (isArm64 && !hasQualcommName) {
      return {
        status: 'Unknown',
        isQualcomm: false,
        reason: 'ARM64 processor detected without verified Qualcomm Snapdragon signatures.'
      };
    }

    // If detection was ambiguous or non-standard
    return {
      status: 'Unknown',
      isQualcomm: false,
      reason: 'Host processor architecture could not be verified with confidence.'
    };
  }

  /**
   * Safe asynchronous query for Windows physical processor info (NumberOfCores, Manufacturer).
   * Conforms strictly to security rules: no shell, fixed arguments, timeout bounded.
   */
  private async queryWindowsProcessorDetails(): Promise<{
    physicalCores: number | null;
    manufacturer: string | null;
    cpuName: string | null;
  }> {
    if (process.platform !== 'win32') {
      return { physicalCores: null, manufacturer: null, cpuName: null };
    }

    try {
      const { stdout } = await execFileAsync(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          'Get-CimInstance Win32_Processor | Select-Object -Property Name, NumberOfCores, Manufacturer | ConvertTo-Json'
        ],
        { shell: false, timeout: 2500 }
      );

      const parsed = JSON.parse(stdout.trim());
      const item = Array.isArray(parsed) ? parsed[0] : parsed;
      return {
        physicalCores: typeof item?.NumberOfCores === 'number' ? item.NumberOfCores : null,
        manufacturer: typeof item?.Manufacturer === 'string' ? item.Manufacturer : null,
        cpuName: typeof item?.Name === 'string' ? item.Name : null
      };
    } catch {
      return { physicalCores: null, manufacturer: null, cpuName: null };
    }
  }

  /**
   * Safe asynchronous query for Windows GPU controller name.
   */
  private async queryWindowsGpuDetails(): Promise<string | null> {
    if (process.platform !== 'win32') {
      return null;
    }

    try {
      const { stdout } = await execFileAsync(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          'Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name'
        ],
        { shell: false, timeout: 2500 }
      );

      const lines = stdout
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      return lines.length > 0 ? lines.join(', ') : null;
    } catch {
      return null;
    }
  }

  /**
   * Calculate device capabilities and AUTO execution recommendation based genuinely
   * on detected hardware. Never invent NPU acceleration.
   */
  public calculateCapabilities(
    isArm64: boolean,
    snapdragonStatus: SnapdragonDetectionStatus,
    npuAvailable: boolean,
    gpuName: string | null
  ): DeviceCapabilities {
    const hasDedicatedGpu = Boolean(
      gpuName &&
        !gpuName.toLowerCase().includes('basic render') &&
        !gpuName.toLowerCase().includes('microsoft basic display')
    );

    let recommended: AIExecutionProfile = 'CPU';
    if (npuAvailable) {
      recommended = 'NPU';
    } else if (hasDedicatedGpu) {
      recommended = 'AUTO'; // Or GPU if verified
    } else {
      recommended = 'CPU';
    }

    return {
      npuSupported: npuAvailable,
      gpuAccelerationSupported: hasDedicatedGpu,
      recommendedExecutionDevice: recommended,
      isArm64,
      thermalTelemetryAvailable: false, // Standard Windows user mode restricts thermal zone access
      qualcommAiHubAvailable: snapdragonStatus === 'Snapdragon Detected'
    };
  }

  /**
   * Main entry point to detect host hardware information.
   * If mock is provided, evaluates deterministically without OS queries.
   */
  public async getHardwareInfo(mock?: MockHardwareEnv): Promise<HardwareInfo> {
    if (mock) {
      const arch = mock.arch || 'x64';
      const cpus = os.cpus();
      const cpuName = mock.cpuModel || (cpus.length > 0 ? cpus[0].model : 'Unknown CPU');
      const logicalCores = mock.logicalCores ?? cpus.length;
      const physicalCores = mock.physicalCores ?? null;
      const memTotal = mock.totalMem ?? os.totalmem();
      const memFree = mock.freeMem ?? os.freemem();

      const evaluation = this.evaluateSnapdragonSignals({
        arch,
        cpuModel: cpuName,
        processorIdentifier: mock.processorIdentifier,
        manufacturer: mock.manufacturer
      });

      const isArm64 = arch === 'arm64' || arch === 'aarch64';
      const npuAvailable = Boolean(mock.hasQnnDriver && evaluation.status === 'Snapdragon Detected');
      const capabilities = this.calculateCapabilities(
        isArm64,
        evaluation.status,
        npuAvailable,
        mock.gpuName ?? null
      );

      return {
        cpuName,
        architecture: arch,
        logicalCores,
        physicalCores,
        memoryTotal: memTotal,
        memoryFree: memFree,
        operatingSystem: `${os.type()} ${os.release()} (${os.arch()})`,
        gpuName: mock.gpuName ?? null,
        npuAvailable,
        snapdragonDetected: evaluation.status,
        qualcommDetected: evaluation.isQualcomm,
        detectionStatus: evaluation.reason,
        deviceCapabilities: capabilities
      };
    }

    // Check cache
    const now = Date.now();
    if (this.cachedInfo && now - this.cacheTimestamp < this.CACHE_TTL_MS) {
      // Refresh dynamic free memory
      return {
        ...this.cachedInfo,
        memoryFree: os.freemem()
      };
    }

    const cpus = os.cpus();
    const logicalCores = cpus.length || 1;
    const baseCpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown Processor';
    const arch = process.arch;
    const procId = process.env.PROCESSOR_IDENTIFIER || '';

    // Asynchronously query WMI for Windows processor and GPU details
    const [procDetails, gpuName] = await Promise.all([
      this.queryWindowsProcessorDetails(),
      this.queryWindowsGpuDetails()
    ]);

    const finalCpuName = procDetails.cpuName || baseCpuModel;
    const physicalCores = procDetails.physicalCores;
    const manufacturer = procDetails.manufacturer || undefined;

    const evaluation = this.evaluateSnapdragonSignals({
      arch,
      cpuModel: finalCpuName,
      processorIdentifier: procId,
      manufacturer
    });

    const isArm64 = (arch as string) === 'arm64' || (arch as string) === 'aarch64';
    // Only claim NPU if verified
    const npuAvailable = false; // On host machine without verified QNN driver, honestly report false

    const capabilities = this.calculateCapabilities(
      isArm64,
      evaluation.status,
      npuAvailable,
      gpuName
    );

    const info: HardwareInfo = {
      cpuName: finalCpuName,
      architecture: arch,
      logicalCores,
      physicalCores,
      memoryTotal: os.totalmem(),
      memoryFree: os.freemem(),
      operatingSystem: `${os.type()} ${os.release()} (${os.arch()})`,
      gpuName,
      npuAvailable,
      snapdragonDetected: evaluation.status,
      qualcommDetected: evaluation.isQualcomm,
      detectionStatus: evaluation.reason,
      deviceCapabilities: capabilities
    };

    this.cachedInfo = info;
    this.cacheTimestamp = now;
    return info;
  }
}

export const hardwareInfoService = new HardwareInfoService();
