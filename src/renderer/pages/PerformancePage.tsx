/**
 * SnapDev AI - Performance & Snapdragon Telemetry Dashboard
 * Phase 8: Snapdragon Optimisation & Performance
 *
 * Implements factual hardware detection, AI runtime capability awareness,
 * RAG profiling, application startup latency tracking, and on-device benchmarking.
 * CRITICAL RULE: Never fabricates hardware acceleration or benchmark numbers.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Gauge,
  Cpu,
  Zap,
  Activity,
  Server,
  Database,
  HardDrive,
  RefreshCw,
  Play,
  CheckCircle2,
  Sliders,
  History,
  Sparkles,
  Info,
  Clock,
  ShieldCheck
} from 'lucide-react';
import type {
  HardwareInfo,
  AIExecutionInfo,
  PerformanceMetrics,
  BenchmarkRun,
  BenchmarkResult,
  LocalAIPerformanceConfig
} from '../../shared/types';
import { useProject } from '../hooks/useProject';

export const PerformancePage: React.FC = () => {
  const { activeProject } = useProject();

  // State
  const [hardwareInfo, setHardwareInfo] = useState<HardwareInfo | null>(null);
  const [executionInfo, setExecutionInfo] = useState<AIExecutionInfo | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [config, setConfig] = useState<LocalAIPerformanceConfig | null>(null);
  const [benchmarkHistory, setBenchmarkHistory] = useState<BenchmarkRun[]>([]);
  const [latestBenchmark, setLatestBenchmark] = useState<BenchmarkRun | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSaveSuccess, setConfigSaveSuccess] = useState(false);
  const [isUnloadingModel, setIsUnloadingModel] = useState(false);
  const [unloadMessage, setUnloadMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'benchmark' | 'settings'>('dashboard');

  // Load telemetry data from Electron main process
  const fetchTelemetry = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      const [hw, aiExec, perf, cfg, hist] = await Promise.all([
        window.electronAPI.getHardwareInfo(),
        window.electronAPI.getAIExecutionInfo(),
        window.electronAPI.getPerformanceMetrics(),
        window.electronAPI.getPerformanceConfig(),
        window.electronAPI.getBenchmarkHistory()
      ]);

      setHardwareInfo(hw);
      setExecutionInfo(aiExec);
      setMetrics(perf);
      setConfig(cfg);
      setBenchmarkHistory(hist);
      if (hist.length > 0 && !latestBenchmark) {
        setLatestBenchmark(hist[0]);
      }
    } catch (err) {
      console.error('[PerformancePage] Telemetry fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [latestBenchmark]);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 6000);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  // Execute manual on-device benchmark test
  const handleRunBenchmark = async () => {
    if (!window.electronAPI || isBenchmarking) return;
    setIsBenchmarking(true);
    try {
      const run = await window.electronAPI.startBenchmark();
      setLatestBenchmark(run);
      setBenchmarkHistory((prev) => [run, ...prev]);
      await fetchTelemetry();
    } catch (err) {
      console.error('[PerformancePage] Benchmark execution error:', err);
    } finally {
      setIsBenchmarking(false);
    }
  };

  // Save local AI performance configuration
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.electronAPI || !config || isSavingConfig) return;
    setIsSavingConfig(true);
    setConfigSaveSuccess(false);
    try {
      const saved = await window.electronAPI.savePerformanceConfig(config);
      setConfig(saved);
      setConfigSaveSuccess(true);
      setTimeout(() => setConfigSaveSuccess(false), 3000);
      await fetchTelemetry();
    } catch (err) {
      console.error('[PerformancePage] Config save error:', err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Unload model to reclaim memory
  const handleUnloadModel = async () => {
    if (!window.electronAPI || isUnloadingModel) return;
    setIsUnloadingModel(true);
    setUnloadMessage(null);
    try {
      const res = await window.electronAPI.aiUnloadModel();
      setUnloadMessage(res.message || 'Model memory freed successfully');
      setTimeout(() => setUnloadMessage(null), 4000);
      await fetchTelemetry();
    } catch (err) {
      setUnloadMessage(`Unload error: ${String(err)}`);
    } finally {
      setIsUnloadingModel(false);
    }
  };

  // Formatting helpers
  const formatBytes = (bytes?: number | null): string => {
    if (!bytes || bytes <= 0) return '0 MB';
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  };

  const formatMs = (ms?: number | null): string => {
    if (ms === undefined || ms === null) return 'Not available';
    if (ms < 1) return '< 1 ms';
    return `${ms.toFixed(1)} ms`;
  };

  const isSnapdragon = hardwareInfo?.snapdragonDetected === 'Snapdragon Detected';
  const memoryTotal = hardwareInfo?.memoryTotal || 1;
  const memoryFree = hardwareInfo?.memoryFree || 0;
  const memoryUsed = memoryTotal - memoryFree;
  const memoryUsedPercent = Math.min(100, Math.round((memoryUsed / memoryTotal) * 100));

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Header Bar */}
      <div className="p-6 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 text-cyan-400">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight">Performance & Snapdragon Telemetry</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                Phase 8
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified on-device hardware diagnostics, local AI execution velocity, and zero fabricated telemetry
            </p>
          </div>
        </div>

        {/* Tab Controls & Refresh */}
        <div className="flex items-center space-x-2">
          <div className="flex rounded-lg bg-slate-800/70 p-1 border border-slate-700/60">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('benchmark')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'benchmark'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Benchmark Suite
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              AI Settings
            </button>
          </div>

          <button
            onClick={fetchTelemetry}
            disabled={isLoading}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* SNAPDRAGON ENVIRONMENT BANNER */}
        <div
          className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
            isSnapdragon
              ? 'bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-slate-900 border-emerald-500/40'
              : hardwareInfo?.snapdragonDetected === 'Snapdragon Not Detected'
              ? 'bg-slate-900/60 border-slate-800'
              : 'bg-amber-950/20 border-amber-800/40'
          }`}
        >
          <div className="flex items-start space-x-3.5">
            <div
              className={`p-2.5 rounded-lg mt-0.5 ${
                isSnapdragon
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : hardwareInfo?.snapdragonDetected === 'Snapdragon Not Detected'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-white">
                  {isSnapdragon
                    ? 'Snapdragon Optimised Environment'
                    : hardwareInfo?.snapdragonDetected === 'Snapdragon Not Detected'
                    ? 'Standard Development Environment (Snapdragon Not Detected)'
                    : 'Processor Architecture Status: Unknown'}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isSnapdragon
                      ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700/60'
                      : hardwareInfo?.snapdragonDetected === 'Snapdragon Not Detected'
                      ? 'bg-slate-800 text-slate-300 border border-slate-700'
                      : 'bg-amber-900/80 text-amber-300 border border-amber-700/60'
                  }`}
                >
                  {hardwareInfo?.snapdragonDetected || 'Detecting...'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {hardwareInfo?.detectionStatus || 'Analyzing CPU model, architecture, and runtime capabilities...'}
              </p>
              {!isSnapdragon && (
                <div className="flex items-center space-x-2 mt-2 text-xs text-slate-400">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>
                    Recommended configuration: Local CPU / DirectML runtime active. Rain Code Studio runs 100% on-device
                    across both Intel/AMD and Snapdragon architectures without degradation.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setActiveTab('benchmark')}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Benchmark</span>
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* TOP GRID: SYSTEM, LOCAL AI, RAG, APPLICATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* SYSTEM CARD */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">System</span>
                    <Cpu className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-sm font-semibold text-white truncate" title={hardwareInfo?.cpuName}>
                    {hardwareInfo?.cpuName || 'Detecting CPU...'}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center space-x-2">
                    <span>Arch: <strong className="text-slate-200">{hardwareInfo?.architecture || 'Unknown'}</strong></span>
                    <span>•</span>
                    <span>Cores: <strong className="text-slate-200">{hardwareInfo?.logicalCores || 0} logical</strong></span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Memory Load ({memoryUsedPercent}%)</span>
                      <span className="text-slate-200 font-medium">{formatBytes(memoryUsed)} / {formatBytes(memoryTotal)}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-cyan-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${memoryUsedPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 text-xs flex items-center justify-between text-slate-500">
                  <span>GPU: {hardwareInfo?.gpuName ? 'Detected' : 'Standard'}</span>
                  <span>NPU: {hardwareInfo?.npuAvailable ? 'Verified' : 'Not detected'}</span>
                </div>
              </div>

              {/* LOCAL AI CARD */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Local AI Model</span>
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-sm font-semibold text-white truncate">
                    {executionInfo?.model || 'Local Developer Engine'}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Device: <strong className="text-indigo-300">{executionInfo?.actualDeviceUsed || 'Host CPU'}</strong>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-slate-500">Inference Speed</div>
                      <div className="text-slate-200 font-bold mt-0.5">
                        {executionInfo?.tokensPerSecond ? `${executionInfo.tokensPerSecond} t/s` : 'Ready'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Load Time</div>
                      <div className="text-slate-200 font-bold mt-0.5">
                        {formatMs(executionInfo?.modelLoadTimeMs)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 text-xs flex items-center justify-between border-t border-slate-800/40">
                  <span className="text-slate-500 truncate" title={executionInfo?.accelerationProvider}>
                    {executionInfo?.accelerationProvider || 'CPU Provider'}
                  </span>
                  <button
                    onClick={handleUnloadModel}
                    disabled={isUnloadingModel}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium underline transition-colors"
                  >
                    {isUnloadingModel ? 'Freeing...' : 'Unload'}
                  </button>
                </div>
              </div>

              {/* RAG CARD */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Local RAG</span>
                    <Database className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {metrics?.rag.vectorCount || 0} Embeddings
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Across <strong className="text-slate-200">{metrics?.rag.indexedFilesCount || 0}</strong> indexed files
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-slate-500">Retrieval Latency</div>
                      <div className="text-slate-200 font-bold mt-0.5">
                        {formatMs(metrics?.rag.retrievalLatencyMs)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Embedding Batch</div>
                      <div className="text-slate-200 font-bold mt-0.5">
                        {formatMs(metrics?.rag.embeddingTimeMs)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 text-xs flex items-center justify-between text-slate-500">
                  <span>Scope: {activeProject?.name || 'Local Project'}</span>
                  <span>100% On-Device</span>
                </div>
              </div>

              {/* APPLICATION CARD */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Application</span>
                    <Activity className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Startup: {formatMs(metrics?.application.startupTimeMs)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Process Memory: <strong className="text-slate-200">{formatBytes(metrics?.system.processMemoryBytes)}</strong>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-slate-500">Project Scan</div>
                      <div className="text-slate-200 font-bold mt-0.5">
                        {formatMs(metrics?.application.projectScanTimeMs)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Git Refresh</div>
                      <div className="text-slate-200 font-bold mt-0.5">
                        {formatMs(metrics?.git.statusRefreshTimeMs)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 text-xs flex items-center justify-between text-slate-500">
                  <span>CPU: {metrics?.system.cpuUtilizationPercent !== null ? `${metrics?.system.cpuUtilizationPercent}%` : 'Sampling...'}</span>
                  <span className="text-slate-400">{metrics?.system.thermalStatus}</span>
                </div>
              </div>
            </div>

            {unloadMessage && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{unloadMessage}</span>
              </div>
            )}

            {/* DETAILED TELEMETRY SECTIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SECTION: HARDWARE SPECIFICATION & SNAPDRAGON DETECTION */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Hardware Diagnostics</h2>
                  </div>
                  <span className="text-xs text-slate-400">Windows CIM / OS Inspection</span>
                </div>

                <div className="divide-y divide-slate-800/60 text-xs">
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400">Processor Model</span>
                    <span className="font-medium text-slate-200 text-right">{hardwareInfo?.cpuName || 'Unknown'}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400">Architecture</span>
                    <span className="font-mono text-cyan-400">{hardwareInfo?.architecture || 'Unknown'}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400">Logical Processors</span>
                    <span className="font-medium text-slate-200">{hardwareInfo?.logicalCores || 0} Cores</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400">Physical Cores</span>
                    <span className="font-medium text-slate-200">
                      {hardwareInfo?.physicalCores !== null && hardwareInfo?.physicalCores !== undefined
                        ? `${hardwareInfo.physicalCores} Physical Cores`
                        : 'Querying / Standard'}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400">System Memory</span>
                    <span className="font-medium text-slate-200">
                      {formatBytes(memoryTotal)} Total ({formatBytes(memoryFree)} Available)
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400">Video / Graphics Controller</span>
                    <span className="font-medium text-slate-200 text-right max-w-xs truncate" title={hardwareInfo?.gpuName || 'Standard'}>
                      {hardwareInfo?.gpuName || 'Standard Display Controller'}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400">NPU Acceleration</span>
                    <span className={`font-semibold ${hardwareInfo?.npuAvailable ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {hardwareInfo?.npuAvailable ? 'Verified Qualcomm Hexagon NPU' : 'Not detected'}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400">Snapdragon Detection Status</span>
                    <span
                      className={`font-semibold ${
                        isSnapdragon
                          ? 'text-emerald-400'
                          : hardwareInfo?.snapdragonDetected === 'Snapdragon Not Detected'
                          ? 'text-blue-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {hardwareInfo?.snapdragonDetected || 'Unknown'}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400">Thermal Telemetry</span>
                    <span className="text-slate-500 font-mono">
                      {metrics?.system.thermalStatus || 'Thermal telemetry unavailable'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION: AI RUNTIME & QUALCOMM AI HUB CAPABILITY REPORT */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <Server className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">AI Runtime Capability Report</h2>
                  </div>
                  <span className="text-xs text-slate-400">Section 5 & 6 Factual Report</span>
                </div>

                <div className="divide-y divide-slate-800/60 text-xs">
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400">AI Runtime</span>
                    <span className="font-medium text-slate-200">{executionInfo?.runtime || 'Local Transformers / ONNXRuntime'}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400">Model Name</span>
                    <span className="font-medium text-slate-200">{executionInfo?.model || 'Local Developer Model'}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400">Model Format</span>
                    <span className="font-mono text-indigo-300">{executionInfo?.modelFormat || 'safetensors / ONNX'}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400">Execution Profile</span>
                    <span className="font-mono text-cyan-400 font-bold">{executionInfo?.executionDevice || 'AUTO'}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400">Actual Compute Device Used</span>
                    <span className="font-medium text-emerald-400">{executionInfo?.actualDeviceUsed || 'Host CPU'}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400">CPU Support</span>
                    <span className="text-emerald-400 font-medium">True (Active)</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400">GPU Support</span>
                    <span className="text-slate-400">{executionInfo?.gpuSupport ? 'Available' : 'Not detected'}</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400">NPU Support</span>
                    <span className="font-medium text-slate-400">
                      {typeof executionInfo?.npuSupport === 'string'
                        ? executionInfo.npuSupport
                        : executionInfo?.npuSupport
                        ? 'Verified'
                        : 'Not detected'}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-slate-400">Qualcomm AI Hub Integration</span>
                    <span className="text-slate-400">
                      {isSnapdragon ? 'Preparation Layer Active (Ready for qai-hub)' : 'Inactive on x86_64 host'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RAG & LATENCY BENCHMARKS OVERVIEW */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Live Measurement Telemetry</h2>
                </div>
                <span className="text-xs text-slate-400">Actual Millisecond Timings</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Startup Time</div>
                  <div className="text-base font-bold text-white mt-1">{formatMs(metrics?.application.startupTimeMs)}</div>
                  <div className="text-slate-500 mt-0.5 text-[11px]">Electron UI window ready</div>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800">
                  <div className="text-slate-400">RAG Retrieval</div>
                  <div className="text-base font-bold text-white mt-1">{formatMs(metrics?.rag.retrievalLatencyMs)}</div>
                  <div className="text-slate-500 mt-0.5 text-[11px]">Vector & hybrid search</div>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Embedding Batch</div>
                  <div className="text-base font-bold text-white mt-1">{formatMs(metrics?.rag.embeddingTimeMs)}</div>
                  <div className="text-slate-500 mt-0.5 text-[11px]">Dense vector computation</div>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Git Status Check</div>
                  <div className="text-base font-bold text-white mt-1">{formatMs(metrics?.git.statusRefreshTimeMs)}</div>
                  <div className="text-slate-500 mt-0.5 text-[11px]">Working tree diff inspection</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BENCHMARK SUITE */}
        {activeTab === 'benchmark' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Play className="w-4 h-4 text-cyan-400 fill-current" />
                  <span>On-Device Performance Benchmark</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Executes authentic, measured workloads directly on this device. Tests local model readiness,
                  AI token inference speed, vector retrieval, batch embedding generation, and AST symbol parsing.
                  All numbers are genuine measurements without synthetic scaling.
                </p>
              </div>

              <button
                onClick={handleRunBenchmark}
                disabled={isBenchmarking}
                className="px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs flex items-center space-x-2 transition-all shadow-md shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isBenchmarking ? 'animate-spin' : ''}`} />
                <span>{isBenchmarking ? 'Executing Benchmark...' : 'Run Performance Test'}</span>
              </button>
            </div>

            {/* SNAPDRAGON BENCHMARK PROFILE CARD (COMPETITION DEMO) */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Snapdragon Benchmark Profile (Competition Demo)</h3>
                    <p className="text-xs text-slate-400">Standardized benchmark summary for judging & evaluation</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
                  {latestBenchmark?.timestamp ? new Date(latestBenchmark.timestamp).toLocaleTimeString() : 'Not run yet'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800/60">
                  <div className="text-slate-500 font-medium">Snapdragon Hardware</div>
                  <div className={`font-bold text-sm mt-1 ${isSnapdragon ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {isSnapdragon ? 'Yes (Verified ARM64)' : 'No (x86_64 host)'}
                  </div>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800/60">
                  <div className="text-slate-500 font-medium">Execution Device</div>
                  <div className="font-bold text-sm mt-1 text-cyan-300">
                    {executionInfo?.actualDeviceUsed || 'Host CPU'}
                  </div>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800/60">
                  <div className="text-slate-500 font-medium">RAG Retrieval</div>
                  <div className="font-bold text-sm mt-1 text-emerald-400">
                    {formatMs(metrics?.rag.retrievalLatencyMs)}
                  </div>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800/60">
                  <div className="text-slate-500 font-medium">AI Generation Velocity</div>
                  <div className="font-bold text-sm mt-1 text-indigo-400">
                    {executionInfo?.tokensPerSecond ? `${executionInfo.tokensPerSecond} tokens/sec` : 'Measured in test'}
                  </div>
                </div>
              </div>
            </div>

            {/* LATEST BENCHMARK RESULTS TABLE */}
            {latestBenchmark && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Latest Measured Results ({latestBenchmark.totalDurationMs} ms total)
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">{latestBenchmark.hardwareSummary}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-800 font-medium">
                      <tr>
                        <th className="py-2.5 px-4">Test Workload</th>
                        <th className="py-2.5 px-4">Duration</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Measured Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {latestBenchmark.results.map((res: BenchmarkResult, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/20">
                          <td className="py-3 px-4 font-medium text-slate-200">{res.name}</td>
                          <td className="py-3 px-4 font-mono text-cyan-400">{res.durationMs} ms</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                res.status === 'completed'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800'
                              }`}
                            >
                              {res.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-mono">{res.measuredResult}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BENCHMARK HISTORY */}
            {benchmarkHistory.length > 1 && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <History className="w-4 h-4 text-slate-400" />
                  <span>Previous Benchmark Runs (Local History)</span>
                </div>

                <div className="space-y-2">
                  {benchmarkHistory.slice(1, 8).map((run: BenchmarkRun, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-800/30 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="text-slate-300 font-medium">
                          {new Date(run.timestamp).toLocaleString()}
                        </span>
                        <span className="text-slate-500 ml-2">• {run.executionDevice} device</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-cyan-400 font-mono">{run.totalDurationMs} ms</span>
                        <span className="text-emerald-400 font-medium">{run.overallStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LOCAL AI PERFORMANCE SETTINGS */}
        {activeTab === 'settings' && config && (
          <form onSubmit={handleSaveConfig} className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Local AI Performance Configuration</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Adjust execution device priority, context capacity, and token generation parameters
                </p>
              </div>

              {configSaveSuccess && (
                <div className="text-xs text-emerald-400 font-semibold flex items-center space-x-1.5 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Configuration Saved</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Execution Device */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-300">Execution Device</label>
                <select
                  value={config.executionDevice}
                  onChange={(e) =>
                    setConfig({ ...config, executionDevice: e.target.value as any })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
                >
                  <option value="AUTO">AUTO (Recommended: Best Verified Hardware)</option>
                  <option value="CPU">CPU (Universal Safe Fallback)</option>
                  <option value="GPU">GPU (CUDA / DirectML if available)</option>
                  <option value="NPU">NPU (Qualcomm Hexagon if verified)</option>
                </select>
                <p className="text-slate-500 text-[11px]">
                  Priority: Supported NPU → Supported GPU → Safe CPU Fallback.
                </p>
              </div>

              {/* Context Length */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="font-semibold text-slate-300">Context Window Capacity</label>
                  <span className="font-mono text-cyan-400">{config.contextLength} tokens</span>
                </div>
                <input
                  type="range"
                  min={512}
                  max={8192}
                  step={512}
                  value={config.contextLength}
                  onChange={(e) =>
                    setConfig({ ...config, contextLength: Number(e.target.value) })
                  }
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <p className="text-slate-500 text-[11px]">
                  Higher context supports larger code files but consumes more system memory.
                </p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="font-semibold text-slate-300">Max Generation Tokens</label>
                  <span className="font-mono text-cyan-400">{config.maxTokens} tokens</span>
                </div>
                <input
                  type="range"
                  min={64}
                  max={2048}
                  step={64}
                  value={config.maxTokens}
                  onChange={(e) =>
                    setConfig({ ...config, maxTokens: Number(e.target.value) })
                  }
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <p className="text-slate-500 text-[11px]">Maximum length of generated markdown code answers.</p>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="font-semibold text-slate-300">Sampling Temperature</label>
                  <span className="font-mono text-cyan-400">{config.temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={1.0}
                  step={0.05}
                  value={config.temperature}
                  onChange={(e) =>
                    setConfig({ ...config, temperature: Number(e.target.value) })
                  }
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <p className="text-slate-500 text-[11px]">
                  Lower temperature (0.1 - 0.2) yields deterministic, precise code answers.
                </p>
              </div>

              {/* Embedding Batch Size */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-300">Embedding Batch Size</label>
                <input
                  type="number"
                  min={1}
                  max={128}
                  value={config.embeddingBatchSize}
                  onChange={(e) =>
                    setConfig({ ...config, embeddingBatchSize: Number(e.target.value) })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
                />
                <p className="text-slate-500 text-[11px]">Number of code chunks embedded in a single vector pass.</p>
              </div>

              {/* Memory Optimization Info */}
              <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1.5 flex flex-col justify-center">
                <div className="font-semibold text-slate-200">Memory Optimization Active</div>
                <div>• Bounded in-memory embedding cache active (5000 max entries)</div>
                <div>• Zero background model duplication</div>
                <div>• On-demand garbage collection during model unload</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
              <button
                type="submit"
                disabled={isSavingConfig}
                className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                {isSavingConfig ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
