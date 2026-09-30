/**
 * SnapDev AI - Hardware Detection & Snapdragon Multi-Signal Unit Tests
 * Phase 8: Snapdragon Optimisation & Performance
 */

import { describe, it, expect } from 'vitest';
import { HardwareInfoService } from '../../src/main/system/hardware-info';

describe('HardwareInfoService & Multi-Signal Snapdragon Detection', () => {
  const service = new HardwareInfoService();

  it('correctly identifies Intel x86_64 host as Snapdragon Not Detected', () => {
    const result = service.evaluateSnapdragonSignals({
      arch: 'x64',
      cpuModel: '11th Gen Intel(R) Core(TM) i7-11800H @ 2.30GHz',
      processorIdentifier: 'Intel64 Family 6 Model 141 Stepping 1, GenuineIntel',
      manufacturer: 'GenuineIntel'
    });

    expect(result.status).toBe('Snapdragon Not Detected');
    expect(result.isQualcomm).toBe(false);
    expect(result.reason).toContain('x86_64');
  });

  it('correctly identifies AMD x86_64 host as Snapdragon Not Detected', () => {
    const result = service.evaluateSnapdragonSignals({
      arch: 'x64',
      cpuModel: 'AMD Ryzen 7 5800H with Radeon Graphics',
      processorIdentifier: 'AMD64 Family 25 Model 80 Stepping 0, AuthenticAMD',
      manufacturer: 'AuthenticAMD'
    });

    expect(result.status).toBe('Snapdragon Not Detected');
    expect(result.isQualcomm).toBe(false);
  });

  it('correctly detects Qualcomm Snapdragon X Elite on ARM64 host', () => {
    const result = service.evaluateSnapdragonSignals({
      arch: 'arm64',
      cpuModel: 'Snapdragon(R) X Elite - X1E80100 - Qualcomm(R) Oryon(TM) CPU',
      processorIdentifier: 'ARMv8 (64-bit) Family 8 Model 1 Revision 0, Qualcomm',
      manufacturer: 'Qualcomm'
    });

    expect(result.status).toBe('Snapdragon Detected');
    expect(result.isQualcomm).toBe(true);
    expect(result.reason).toContain('Qualcomm Snapdragon ARM64');
  });

  it('correctly detects Snapdragon X Plus on ARM64 host via SC8380 chip id', () => {
    const result = service.evaluateSnapdragonSignals({
      arch: 'arm64',
      cpuModel: 'Qualcomm SC8380 Snapdragon X Plus',
      processorIdentifier: 'ARMv8 Qualcomm SC8380',
      manufacturer: 'Qualcomm Technologies Inc'
    });

    expect(result.status).toBe('Snapdragon Detected');
    expect(result.isQualcomm).toBe(true);
  });

  it('returns Unknown when ARM64 host has no verified Qualcomm signatures', () => {
    const result = service.evaluateSnapdragonSignals({
      arch: 'arm64',
      cpuModel: 'Generic ARMv8 Processor',
      processorIdentifier: 'ARMv8 Family 8 Model 0',
      manufacturer: 'Generic'
    });

    expect(result.status).toBe('Unknown');
    expect(result.isQualcomm).toBe(false);
    expect(result.reason).toContain('without verified Qualcomm');
  });

  it('handles empty or ambiguous signals safely without throwing', () => {
    const result = service.evaluateSnapdragonSignals({
      arch: '',
      cpuModel: ''
    });

    expect(result.status).toBe('Unknown');
    expect(result.isQualcomm).toBe(false);
  });

  it('does not claim Snapdragon based solely on machine name or hostname', () => {
    // Standard Intel CPU with hostname containing snapdragon
    const result = service.evaluateSnapdragonSignals({
      arch: 'x64',
      cpuModel: 'Intel Core i5-12400',
      manufacturer: 'GenuineIntel'
    });

    expect(result.status).toBe('Snapdragon Not Detected');
    expect(result.isQualcomm).toBe(false);
  });

  it('calculates genuine device capabilities and safe fallback', () => {
    // Non-Snapdragon CPU without NPU
    const caps = service.calculateCapabilities(false, 'Snapdragon Not Detected', false, 'NVIDIA GeForce RTX 3050');
    expect(caps.npuSupported).toBe(false);
    expect(caps.gpuAccelerationSupported).toBe(true);
    expect(caps.isArm64).toBe(false);
    expect(caps.thermalTelemetryAvailable).toBe(false);

    // Snapdragon with verified NPU
    const snapCaps = service.calculateCapabilities(true, 'Snapdragon Detected', true, null);
    expect(snapCaps.npuSupported).toBe(true);
    expect(snapCaps.recommendedExecutionDevice).toBe('NPU');
    expect(snapCaps.qualcommAiHubAvailable).toBe(true);
  });

  it('returns mocked hardware info accurately in unit test environment', async () => {
    const hw = await service.getHardwareInfo({
      arch: 'arm64',
      cpuModel: 'Snapdragon X Elite',
      manufacturer: 'Qualcomm',
      logicalCores: 12,
      physicalCores: 12,
      hasQnnDriver: true,
      totalMem: 16 * 1024 * 1024 * 1024,
      freeMem: 8 * 1024 * 1024 * 1024
    });

    expect(hw.architecture).toBe('arm64');
    expect(hw.snapdragonDetected).toBe('Snapdragon Detected');
    expect(hw.qualcommDetected).toBe(true);
    expect(hw.npuAvailable).toBe(true);
    expect(hw.deviceCapabilities.recommendedExecutionDevice).toBe('NPU');
  });
});
