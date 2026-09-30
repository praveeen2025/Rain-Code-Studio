/**
 * SnapDev AI - Performance Monitor & Benchmark Unit Tests
 * Phase 8: Snapdragon Optimisation & Performance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceMonitor } from '../../src/main/system/performance-monitor';
import path from 'path';
import fs from 'fs';

describe('PerformanceMonitor & Benchmark Suite', () => {
  const tempHistoryFile = path.resolve(process.cwd(), 'database', 'test_benchmark_history.json');
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    if (fs.existsSync(tempHistoryFile)) {
      fs.unlinkSync(tempHistoryFile);
    }
    monitor = new PerformanceMonitor(tempHistoryFile);
  });

  it('records and returns application, RAG, AI, and Git timings accurately', async () => {
    monitor.recordStartupTime(245.5);
    monitor.recordProjectOpen(80.2);
    monitor.recordProjectScan(120.4);
    monitor.recordIndexBuild(310.1);

    monitor.recordRagIndexing(450.2, 180.5, 60, 60, 10);
    monitor.recordRagRetrieval(18.4, 4.2);

    monitor.recordAiModelLoad(112.5);
    monitor.recordAiGeneration(350.0, 14.5, 45, 52.3);
    monitor.recordAiCancellation(8.2);

    monitor.recordGitOperation('detection', 12.1);
    monitor.recordGitOperation('status', 22.4);
    monitor.recordGitOperation('diff', 15.6);

    const metrics = await monitor.getPerformanceMetrics();

    // Verify application metrics
    expect(metrics.application.startupTimeMs).toBe(245.5);
    expect(metrics.application.projectOpenTimeMs).toBe(80.2);
    expect(metrics.application.projectScanTimeMs).toBe(120.4);
    expect(metrics.application.indexBuildTimeMs).toBe(310.1);

    // Verify RAG metrics
    expect(metrics.rag.indexingTimeMs).toBe(450.2);
    expect(metrics.rag.embeddingTimeMs).toBe(180.5);
    expect(metrics.rag.retrievalLatencyMs).toBe(18.4);
    expect(metrics.rag.contextConstructionTimeMs).toBe(4.2);
    expect(metrics.rag.vectorCount).toBe(60);

    // Verify AI metrics
    expect(metrics.ai.modelLoadTimeMs).toBe(112.5);
    expect(metrics.ai.firstResponseLatencyMs).toBe(14.5);
    expect(metrics.ai.totalGenerationTimeMs).toBe(350.0);
    expect(metrics.ai.tokensPerSecond).toBe(52.3);
    expect(metrics.ai.cancellationLatencyMs).toBe(8.2);

    // Verify Git metrics
    expect(metrics.git.repoDetectionTimeMs).toBe(12.1);
    expect(metrics.git.statusRefreshTimeMs).toBe(22.4);
    expect(metrics.git.diffCalculationTimeMs).toBe(15.6);

    // Verify system metrics honesty (no fake thermal data)
    expect(metrics.system.thermalStatus).toBe('Thermal telemetry unavailable');
    expect(metrics.system.gpuUtilizationPercent).toBeNull();
    expect(metrics.system.npuUtilizationPercent).toBeNull();
  });

  it('runs benchmark suite and produces real measured results', async () => {
    const run = await monitor.runBenchmark(
      ['model_load', 'ai_generation', 'rag_retrieval', 'embedding_generation', 'project_indexing'],
      {
        pingBackend: async () => true,
        testAiGeneration: async () => ({ durationMs: 45.2, tokens: 30, tokensPerSec: 55.0 }),
        testRagRetrieval: async () => ({ durationMs: 12.0, itemsFound: 4 }),
        testEmbedding: async () => ({ durationMs: 8.5, embeddingsCount: 8 }),
        testIndexing: async () => ({ durationMs: 15.0, symbolsParsed: 12 })
      }
    );

    expect(run.results).toHaveLength(5);
    expect(run.overallStatus).toBe('completed');
    expect(run.totalDurationMs).toBeGreaterThanOrEqual(0.1);

    const aiResult = run.results.find((r) => r.test === 'ai_generation');
    expect(aiResult?.status).toBe('completed');
    expect(aiResult?.measuredResult).toContain('55 tokens/sec');

    const ragResult = run.results.find((r) => r.test === 'rag_retrieval');
    expect(ragResult?.measuredResult).toContain('4 chunks retrieved');
  });

  it('persists and retrieves benchmark history across runs', async () => {
    await monitor.runBenchmark(['model_load']);
    await monitor.runBenchmark(['rag_retrieval']);

    const history = monitor.getBenchmarkHistory();
    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history[0].results.length).toBeGreaterThan(0);
  });

  it('validates and safely constrains performance configuration parameters', () => {
    const initial = monitor.getPerformanceConfig();
    expect(initial.executionDevice).toBe('AUTO');
    expect(initial.temperature).toBe(0.2);

    // Update with valid parameters
    const updated = monitor.savePerformanceConfig({
      executionDevice: 'CPU',
      contextLength: 2048,
      maxTokens: 512,
      temperature: 0.1,
      batchSize: 32,
      embeddingBatchSize: 64
    });

    expect(updated.executionDevice).toBe('CPU');
    expect(updated.contextLength).toBe(2048);
    expect(updated.maxTokens).toBe(512);
    expect(updated.temperature).toBe(0.1);
    expect(updated.batchSize).toBe(32);
    expect(updated.embeddingBatchSize).toBe(64);

    // Attempt to set invalid/out-of-bound values (must be rejected/ignored safely)
    const constrained = monitor.savePerformanceConfig({
      temperature: 5.0, // Invalid (max 2.0)
      maxTokens: 99999, // Invalid (max 8192)
      contextLength: 100 // Invalid (min 512)
    });

    expect(constrained.temperature).toBe(0.1); // Preserved
    expect(constrained.maxTokens).toBe(512); // Preserved
    expect(constrained.contextLength).toBe(2048); // Preserved
  });
});
