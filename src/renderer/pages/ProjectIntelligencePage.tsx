/**
 * Rain Code Studio - Project Intelligence Page
 * Phase 12.1: Advanced Developer Intelligence Features
 * 
 * Features:
 * 1. AI Project Health Dashboard
 * 2. Codebase Architecture Map
 * 3. Smart Project Search
 * 4. AI Project Onboarding Mode
 * 5. Code Impact Analyzer
 * 6. AI Test Coverage Assistant
 * 7. Documentation Health
 * 8. AI Refactoring Planner
 * 9. Code Similarity Detector
 * 10. Local Project Knowledge Base
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  Activity,
  Network,
  Search,
  Compass,
  AlertTriangle,
  FlaskConical,
  BookOpen,
  Wrench,
  Copy,
  BookMarked,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Shield,
  FileCode,
  FolderTree,
  Sparkles,
  GitBranch,
  Layers,
  ArrowRight,
  Code2,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { useProject } from '../hooks/useProject';
import { editorTabsStore } from '../stores/editorTabsStore';
import {
  ProjectHealthReport,
  ArchitectureMapData,
  ArchitectureMapNode,
  SmartSearchResult,
  ProjectOnboardingData,
  ImpactAnalysisResult,
  TestCoverageAnalysis,
  TestCoverageCandidate,
  DocumentationHealthReport,
  RefactoringPlan,
  CodeSimilarityReport,
  CodeSimilarityItem,
  ProjectKnowledgeNote,
  KnowledgeCategory
} from '../../shared/types';

type IntelligenceTab =
  | 'overview'
  | 'architecture'
  | 'search'
  | 'onboarding'
  | 'impact'
  | 'tests'
  | 'docs'
  | 'refactor'
  | 'similarity'
  | 'knowledge';

export const ProjectIntelligencePage: React.FC = () => {
  const { activeProject } = useProject();
  const [activeTab, setActiveTab] = useState<IntelligenceTab>('overview');

  // Loading & State
  const [isLoading, setIsLoading] = useState(false);
  const [healthReport, setHealthReport] = useState<ProjectHealthReport | null>(null);
  const [archMap, setArchMap] = useState<ArchitectureMapData | null>(null);
  const [selectedArchNode, setSelectedArchNode] = useState<ArchitectureMapNode | null>(null);
  const [archZoom, setArchZoom] = useState(1);
  const [archFilter, setArchFilter] = useState<string>('all');

  // Smart Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SmartSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Onboarding State
  const [onboardingData, setOnboardingData] = useState<ProjectOnboardingData | null>(null);

  // Impact Analysis State
  const [impactTargetFile, setImpactTargetFile] = useState('');
  const [impactSymbol, setImpactSymbol] = useState('');
  const [impactResult, setImpactResult] = useState<ImpactAnalysisResult | null>(null);
  const [isAnalyzingImpact, setIsAnalyzingImpact] = useState(false);

  // Test Coverage State
  const [testCoverage, setTestCoverage] = useState<TestCoverageAnalysis | null>(null);
  const [selectedTestCandidate, setSelectedTestCandidate] = useState<TestCoverageCandidate | null>(null);

  // Documentation Health State
  const [docHealth, setDocHealth] = useState<DocumentationHealthReport | null>(null);
  const [docFilter, setDocFilter] = useState<'all' | 'Documented' | 'Partially documented' | 'Potentially undocumented'>('all');

  // Refactoring Planner State
  const [refactorFile, setRefactorFile] = useState('');
  const [refactorGoal, setRefactorGoal] = useState('');
  const [refactorPlan, setRefactorPlan] = useState<RefactoringPlan | null>(null);
  const [isPlanningRefactor, setIsPlanningRefactor] = useState(false);

  // Code Similarity State
  const [similarityThreshold, setSimilarityThreshold] = useState(70);
  const [similarityReport, setSimilarityReport] = useState<CodeSimilarityReport | null>(null);
  const [activeComparisonPair, setActiveComparisonPair] = useState<CodeSimilarityItem | null>(null);
  const [isScanningSimilarity, setIsScanningSimilarity] = useState(false);

  // Knowledge Base State
  const [knowledgeNotes, setKnowledgeNotes] = useState<ProjectKnowledgeNote[]>([]);
  const [knowledgeCategory, setKnowledgeCategory] = useState<string>('all');
  const [knowledgeSearch, setKnowledgeSearch] = useState<string>('');
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<KnowledgeCategory>('architecture');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState('');
  const [newNoteInRag, setNewNoteInRag] = useState(true);

  // Fetch Core Health Report
  const fetchHealthReport = useCallback(async () => {
    if (!window.electronAPI) return;
    setIsLoading(true);
    try {
      const rep = await window.electronAPI.intelligenceGetHealth(activeProject?.id, activeProject?.path);
      setHealthReport(rep);
    } catch (err) {
      console.error('[ProjectIntelligence] Failed to fetch health:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeProject]);

  // Fetch Architecture Map
  const fetchArchitecture = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      const data = await window.electronAPI.intelligenceGetArchitecture(activeProject?.id);
      setArchMap(data);
    } catch (err) {
      console.error('[ProjectIntelligence] Failed to fetch architecture:', err);
    }
  }, [activeProject]);

  // Fetch Onboarding Data
  const fetchOnboarding = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      const data = await window.electronAPI.intelligenceGetOnboarding(activeProject?.id, activeProject?.path);
      setOnboardingData(data);
    } catch (err) {
      console.error('[ProjectIntelligence] Failed to fetch onboarding:', err);
    }
  }, [activeProject]);

  // Fetch Test Coverage
  const fetchTestCoverage = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      const data = await window.electronAPI.intelligenceAnalyzeTestCoverage(activeProject?.id, activeProject?.path);
      setTestCoverage(data);
    } catch (err) {
      console.error('[ProjectIntelligence] Failed to fetch test coverage:', err);
    }
  }, [activeProject]);

  // Fetch Documentation Health
  const fetchDocHealth = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      const data = await window.electronAPI.intelligenceAnalyzeDocsHealth(activeProject?.id, activeProject?.path);
      setDocHealth(data);
    } catch (err) {
      console.error('[ProjectIntelligence] Failed to fetch docs health:', err);
    }
  }, [activeProject]);

  // Fetch Knowledge Base Notes
  const fetchKnowledgeNotes = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      const notes = await window.electronAPI.intelligenceKnowledgeGet(
        activeProject?.id,
        knowledgeCategory === 'all' ? undefined : knowledgeCategory,
        knowledgeSearch || undefined
      );
      setKnowledgeNotes(notes);
    } catch (err) {
      console.error('[ProjectIntelligence] Failed to fetch knowledge notes:', err);
    }
  }, [activeProject, knowledgeCategory, knowledgeSearch]);

  // Trigger initial data load
  useEffect(() => {
    fetchHealthReport();
  }, [fetchHealthReport]);

  useEffect(() => {
    if (activeTab === 'architecture' && !archMap) fetchArchitecture();
    if (activeTab === 'onboarding' && !onboardingData) fetchOnboarding();
    if (activeTab === 'tests' && !testCoverage) fetchTestCoverage();
    if (activeTab === 'docs' && !docHealth) fetchDocHealth();
    if (activeTab === 'knowledge') fetchKnowledgeNotes();
  }, [activeTab, archMap, onboardingData, testCoverage, docHealth, fetchArchitecture, fetchOnboarding, fetchTestCoverage, fetchDocHealth, fetchKnowledgeNotes]);

  // Handle Smart Search Submit
  const handleSmartSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!window.electronAPI || !searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await window.electronAPI.intelligenceSmartSearch(searchQuery, activeProject?.id, activeProject?.path);
      setSearchResults(res);
    } catch (err) {
      console.error('[SmartSearch] Error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Impact Analysis
  const handleRunImpact = async () => {
    if (!window.electronAPI || !impactTargetFile.trim()) return;
    setIsAnalyzingImpact(true);
    try {
      const res = await window.electronAPI.intelligenceAnalyzeImpact(impactTargetFile, impactSymbol || undefined, activeProject?.id);
      setImpactResult(res);
    } catch (err) {
      console.error('[ImpactAnalysis] Error:', err);
    } finally {
      setIsAnalyzingImpact(false);
    }
  };

  // Handle Refactoring Planner
  const handlePlanRefactor = async () => {
    if (!window.electronAPI || !refactorFile.trim() || !refactorGoal.trim()) return;
    setIsPlanningRefactor(true);
    try {
      const res = await window.electronAPI.intelligencePlanRefactor({
        targetFile: refactorFile,
        goal: refactorGoal,
        projectId: activeProject?.id
      });
      setRefactorPlan(res);
    } catch (err) {
      console.error('[RefactoringPlanner] Error:', err);
    } finally {
      setIsPlanningRefactor(false);
    }
  };

  // Handle Similarity Scan
  const handleScanSimilarity = async () => {
    if (!window.electronAPI) return;
    setIsScanningSimilarity(true);
    try {
      const res = await window.electronAPI.intelligenceDetectSimilarity(activeProject?.id, similarityThreshold / 100);
      setSimilarityReport(res);
    } catch (err) {
      console.error('[Similarity] Error:', err);
    } finally {
      setIsScanningSimilarity(false);
    }
  };

  // Handle Knowledge Create
  const handleCreateKnowledgeNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.electronAPI || !newNoteTitle.trim() || !newNoteContent.trim()) return;
    try {
      const tags = newNoteTags.split(',').map((t) => t.trim()).filter(Boolean);
      await window.electronAPI.intelligenceKnowledgeCreate({
        projectId: activeProject?.id || 'default-project',
        title: newNoteTitle,
        category: newNoteCategory,
        content: newNoteContent,
        tags,
        includeInRag: newNoteInRag
      });
      setIsCreatingNote(false);
      setNewNoteTitle('');
      setNewNoteContent('');
      setNewNoteTags('');
      fetchKnowledgeNotes();
    } catch (err) {
      console.error('[Knowledge] Error creating note:', err);
    }
  };

  const handleDeleteKnowledgeNote = async (id: string) => {
    if (!window.electronAPI) return;
    try {
      await window.electronAPI.intelligenceKnowledgeDelete(id);
      fetchKnowledgeNotes();
    } catch (err) {
      console.error('[Knowledge] Error deleting note:', err);
    }
  };

  const openFileInEditor = (filePath: string, line?: number) => {
    if (line) {
      console.log(`Navigating to ${filePath}:${line}`);
    }
    const ext = filePath.split('.').pop() || '';
    editorTabsStore.openFileTab({
      name: filePath.split(/[/\\]/).pop() || filePath,
      path: filePath,
      relativePath: filePath,
      isDirectory: false,
      size: 0,
      extension: ext
    });
  };

  return (
    <div className="flex flex-col h-full bg-ide-bg text-ide-text select-none overflow-hidden font-sans">
      {/* Top Intelligence Header Bar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-ide-header border-b border-ide-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-wide text-ide-text">
                Project Intelligence
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 font-mono border border-blue-700/50">
                Phase 12.1
              </span>
            </div>
            <p className="text-[11px] text-ide-muted">
              {activeProject ? activeProject.name : 'All Workspace Subsystems'} • Factual On-Device Intelligence
            </p>
          </div>
        </div>

        <button
          onClick={fetchHealthReport}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-ide-card hover:bg-ide-hover border border-ide-border text-ide-text transition"
          title="Refresh All Health & Diagnostic Telemetry"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </header>

      {/* Feature Sub-Navigation Tabs */}
      <nav className="flex items-center gap-1 px-3 py-1.5 bg-ide-activitybar border-b border-ide-border overflow-x-auto text-xs shrink-0">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'architecture', label: 'Architecture Map', icon: Network },
          { id: 'search', label: 'Smart Search', icon: Search },
          { id: 'onboarding', label: 'Onboarding', icon: Compass },
          { id: 'impact', label: 'Impact Analysis', icon: AlertTriangle },
          { id: 'tests', label: 'Test Coverage', icon: FlaskConical },
          { id: 'docs', label: 'Documentation Health', icon: BookOpen },
          { id: 'refactor', label: 'Refactoring Planner', icon: Wrench },
          { id: 'similarity', label: 'Code Similarity', icon: Copy },
          { id: 'knowledge', label: 'Project Knowledge', icon: BookMarked }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as IntelligenceTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-ide-muted hover:text-ide-text hover:bg-ide-hover'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Feature Content Area */}
      <main className="flex-1 overflow-y-auto p-4 bg-ide-bg">
        {/* ================================================== */}
        {/* TAB 1: AI PROJECT HEALTH DASHBOARD                 */}
        {/* ================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-4 max-w-6xl mx-auto">
            {healthReport ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Code Quality Card */}
                  <div className="p-3.5 rounded-lg bg-ide-card border border-ide-border flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-ide-text uppercase tracking-wider">Code Quality</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                        healthReport.codeQuality.parseStatus === 'healthy'
                          ? 'bg-green-950/60 text-green-400 border border-green-800/40'
                          : 'bg-yellow-950/60 text-yellow-400 border border-yellow-800/40'
                      }`}>
                        {healthReport.codeQuality.parseStatus.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-lg font-bold text-ide-text">{healthReport.codeQuality.totalFiles}</div>
                        <div className="text-[11px] text-ide-muted">Total Files</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-ide-text">{healthReport.codeQuality.totalLines.toLocaleString()}</div>
                        <div className="text-[11px] text-ide-muted">Total Lines</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-ide-text">{healthReport.codeQuality.totalSymbols}</div>
                        <div className="text-[11px] text-ide-muted">Parsed Symbols</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-ide-text">{healthReport.codeQuality.syntaxErrorCount}</div>
                        <div className="text-[11px] text-ide-muted">Parse Errors</div>
                      </div>
                    </div>
                  </div>

                  {/* Test Coverage Card (Strict Rule: Dynamic coverage is Not Measured) */}
                  <div className="p-3.5 rounded-lg bg-ide-card border border-ide-border flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-ide-text uppercase tracking-wider">Test Coverage</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
                        {healthReport.testCoverage.status}
                      </span>
                    </div>
                    <div className="text-xs space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-ide-muted">Detected Test Files:</span>
                        <span className="font-semibold text-ide-text">{healthReport.testCoverage.detectedTestSourceFiles}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-ide-muted">Test-to-Source Ratio:</span>
                        <span className="font-semibold text-ide-text">{healthReport.testCoverage.testToSourceRatio}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-ide-muted">Frameworks:</span>
                        <span className="font-semibold text-blue-400">
                          {healthReport.testCoverage.detectedFrameworks.length > 0
                            ? healthReport.testCoverage.detectedFrameworks.join(', ')
                            : 'None detected'}
                        </span>
                      </div>
                      <p className="text-[10px] text-amber-400/90 pt-1 leading-snug">
                        Note: Dynamic line execution coverage requires active test instrumentation.
                      </p>
                    </div>
                  </div>

                  {/* Documentation Coverage Card */}
                  <div className="p-3.5 rounded-lg bg-ide-card border border-ide-border flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-ide-text uppercase tracking-wider">Documentation</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40">
                        {healthReport.documentationCoverage.estimatedDocPercentage}% Documented
                      </span>
                    </div>
                    <div className="text-xs space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-ide-muted">README Status:</span>
                        <span className={`font-semibold ${healthReport.documentationCoverage.hasReadme ? 'text-green-400' : 'text-red-400'}`}>
                          {healthReport.documentationCoverage.hasReadme ? 'Found' : 'Missing'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-ide-muted">Markdown / Doc Files:</span>
                        <span className="font-semibold text-ide-text">{healthReport.documentationCoverage.totalDocFiles}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-ide-muted">Documented Symbols:</span>
                        <span className="font-semibold text-ide-text">
                          {healthReport.documentationCoverage.documentedSymbolsCount} / {healthReport.documentationCoverage.totalSymbolsCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subsystem Readiness Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Git Status */}
                  <div className="p-3.5 rounded-lg bg-ide-card border border-ide-border">
                    <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-ide-text">
                      <GitBranch className="w-4 h-4 text-orange-400" />
                      <span>Git Repository Status</span>
                    </div>
                    <div className="text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-ide-muted">Branch:</span>
                        <span className="font-mono text-ide-text">{healthReport.gitStatus.branch || 'None'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ide-muted">Working Tree:</span>
                        <span className={healthReport.gitStatus.isClean ? 'text-green-400' : 'text-amber-400'}>
                          {healthReport.gitStatus.isClean ? 'Clean' : `${healthReport.gitStatus.uncommittedChangesCount} Uncommitted Changes`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RAG Health */}
                  <div className="p-3.5 rounded-lg bg-ide-card border border-ide-border">
                    <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-ide-text">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <span>Local RAG Pipeline</span>
                    </div>
                    <div className="text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-ide-muted">Vector Index:</span>
                        <span className="text-green-400 font-medium">{healthReport.ragHealth.vectorStoreStatus}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ide-muted">Indexed Chunks:</span>
                        <span className="text-ide-text font-bold">{healthReport.ragHealth.chunksCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ide-muted">Model:</span>
                        <span className="text-ide-text font-mono text-[10px]">{healthReport.ragHealth.embeddingModel}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Readiness */}
                  <div className="p-3.5 rounded-lg bg-ide-card border border-ide-border">
                    <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-ide-text">
                      <Brain className="w-4 h-4 text-blue-400" />
                      <span>AI Model Readiness</span>
                    </div>
                    <div className="text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-ide-muted">Inference Engine:</span>
                        <span className={healthReport.aiReadiness.isLocalAIOnline ? 'text-green-400' : 'text-zinc-400'}>
                          {healthReport.aiReadiness.isLocalAIOnline ? 'Online (Ready)' : 'Unloaded'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ide-muted">Hardware Profile:</span>
                        <span className="text-ide-text font-mono text-[10px]">{healthReport.aiReadiness.deviceProfile.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Complexity Banner */}
                <div className="p-3.5 rounded-lg bg-ide-card border border-ide-border text-xs flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <span className="font-semibold text-ide-text">Average Symbols Per File:</span>{' '}
                    <span className="text-blue-400 font-bold">{healthReport.projectComplexity.averageSymbolsPerFile}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-ide-text">Highest Density File:</span>{' '}
                    <span className="font-mono text-zinc-300">
                      {healthReport.projectComplexity.maxSymbolsInFile.file} ({healthReport.projectComplexity.maxSymbolsInFile.count} symbols)
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-ide-text">Total Import Links:</span>{' '}
                    <span className="text-green-400 font-bold">{healthReport.projectComplexity.totalImports}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-ide-muted text-xs">
                {isLoading ? 'Collecting live project health indicators...' : 'No health telemetry available.'}
              </div>
            )}
          </div>
        )}

        {/* ================================================== */}
        {/* TAB 2: CODEBASE ARCHITECTURE MAP                   */}
        {/* ================================================== */}
        {activeTab === 'architecture' && (
          <div className="flex flex-col h-full space-y-3">
            <div className="flex items-center justify-between bg-ide-card p-2.5 rounded-lg border border-ide-border text-xs">
              <div className="flex items-center gap-3">
                <span className="font-medium text-ide-text">Summary:</span>
                <span className="text-ide-muted">{archMap?.summary.directoriesCount || 0} Directories</span>
                <span className="text-ide-muted">•</span>
                <span className="text-ide-muted">{archMap?.summary.filesCount || 0} Files</span>
                <span className="text-ide-muted">•</span>
                <span className="text-ide-muted">{archMap?.summary.symbolsCount || 0} Symbols</span>
                <span className="text-ide-muted">•</span>
                <span className="text-ide-muted">{archMap?.summary.importsCount || 0} Import Relations</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={archFilter}
                  onChange={(e) => setArchFilter(e.target.value)}
                  className="bg-ide-bg border border-ide-border rounded px-2 py-1 text-xs text-ide-text"
                >
                  <option value="all">All Elements</option>
                  <option value="directory">Directories Only</option>
                  <option value="file">Files Only</option>
                  <option value="class">Classes Only</option>
                  <option value="function">Functions Only</option>
                </select>
                <button
                  onClick={() => setArchZoom((prev) => Math.min(prev + 0.15, 2.0))}
                  className="p-1.5 rounded bg-ide-bg hover:bg-ide-hover border border-ide-border text-ide-text"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setArchZoom((prev) => Math.max(prev - 0.15, 0.5))}
                  className="p-1.5 rounded bg-ide-bg hover:bg-ide-hover border border-ide-border text-ide-text"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setArchZoom(1)}
                  className="p-1.5 rounded bg-ide-bg hover:bg-ide-hover border border-ide-border text-ide-text"
                  title="Reset Zoom"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex gap-3 min-h-[420px] overflow-hidden">
              {/* Architecture Node Explorer View */}
              <div className="flex-1 bg-ide-card rounded-lg border border-ide-border p-4 overflow-auto">
                <div
                  className="grid grid-cols-2 md:grid-cols-4 gap-2.5 transition-transform origin-top-left"
                  style={{ transform: `scale(${archZoom})` }}
                >
                  {archMap?.nodes
                    .filter((n) => archFilter === 'all' || n.type === archFilter)
                    .map((node) => {
                      const isSelected = selectedArchNode?.id === node.id;
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedArchNode(node)}
                          className={`p-2.5 rounded-lg border cursor-pointer transition text-xs ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500/10 text-white shadow-sm'
                              : 'border-ide-border bg-ide-bg hover:border-zinc-500 text-ide-text'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            {node.type === 'directory' && <FolderTree className="w-3.5 h-3.5 text-amber-400" />}
                            {node.type === 'file' && <FileCode className="w-3.5 h-3.5 text-blue-400" />}
                            {node.type === 'class' && <Layers className="w-3.5 h-3.5 text-purple-400" />}
                            {node.type === 'function' && <Code2 className="w-3.5 h-3.5 text-green-400" />}
                            {node.type === 'project' && <Shield className="w-3.5 h-3.5 text-blue-400" />}
                            <span className="font-semibold truncate">{node.label}</span>
                          </div>
                          <div className="text-[10px] text-ide-muted truncate">
                            {node.details || node.type}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Context Detail Inspector */}
              <div className="w-80 bg-ide-card rounded-lg border border-ide-border p-3.5 flex flex-col justify-between text-xs">
                {selectedArchNode ? (
                  <div className="space-y-3">
                    <div className="border-b border-ide-border pb-2">
                      <span className="text-[10px] uppercase font-mono text-ide-muted">Selected Node Details</span>
                      <h3 className="font-bold text-sm text-ide-text truncate">{selectedArchNode.label}</h3>
                      <span className="text-[11px] text-blue-400 capitalize">{selectedArchNode.type}</span>
                    </div>
                    {selectedArchNode.path && (
                      <div>
                        <span className="text-[10px] text-ide-muted block">Path</span>
                        <span className="font-mono text-[11px] text-zinc-300 break-all">{selectedArchNode.path}</span>
                      </div>
                    )}
                    {selectedArchNode.lineStart && (
                      <div>
                        <span className="text-[10px] text-ide-muted block">Line Span</span>
                        <span className="font-mono text-[11px] text-zinc-300">
                          L{selectedArchNode.lineStart} - L{selectedArchNode.lineEnd}
                        </span>
                      </div>
                    )}
                    {selectedArchNode.details && (
                      <div>
                        <span className="text-[10px] text-ide-muted block">Metrics</span>
                        <span className="text-[11px] text-zinc-300">{selectedArchNode.details}</span>
                      </div>
                    )}
                    {selectedArchNode.path && (
                      <button
                        onClick={() => openFileInEditor(selectedArchNode.path, selectedArchNode.lineStart)}
                        className="w-full mt-4 flex items-center justify-center gap-1.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open In Editor</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-ide-muted">
                    Click any node in the architecture map to inspect relationships and open source files.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* TAB 3: SMART PROJECT SEARCH                        */}
        {/* ================================================== */}
        {activeTab === 'search' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {/* Search Input Form */}
            <form onSubmit={handleSmartSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-ide-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask a natural-language question (e.g., 'Where is authentication handled?')..."
                  className="w-full pl-9 pr-3 py-2 bg-ide-card border border-ide-border rounded-lg text-xs text-ide-text placeholder:text-ide-muted focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition flex items-center gap-1.5"
              >
                {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Search</span>
              </button>
            </form>

            {/* Example Queries */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-ide-muted">
              <span>Try:</span>
              {[
                'Where is authentication handled?',
                'Which files process payments?',
                'Where is the database connection created?',
                'Which function handles user registration?'
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setSearchQuery(q);
                  }}
                  className="px-2 py-0.5 rounded bg-ide-card hover:bg-ide-hover border border-ide-border text-[11px] text-ide-text transition"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Results List */}
            {searchResults && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-xs text-ide-muted">
                  <span>Found {searchResults.totalMatches} matches</span>
                  <span>Retrieved via Hybrid RAG + AST Index</span>
                </div>
                {searchResults.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-ide-card border border-ide-border space-y-2 text-xs hover:border-zinc-600 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="font-semibold text-ide-text">{item.relativePath}</span>
                        {item.symbolName && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 font-mono text-[10px] border border-purple-800/40">
                            {item.kind ? `${item.kind} ` : ''}{item.symbolName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-400 font-mono">
                          Score: {Math.round(item.relevanceScore * 100)}%
                        </span>
                        <button
                          onClick={() => openFileInEditor(item.path, item.lineStart)}
                          className="px-2 py-0.5 rounded bg-ide-hover hover:bg-zinc-700 text-ide-text text-[11px] flex items-center gap-1 transition"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-2 rounded bg-ide-bg text-ide-muted text-[11px] font-mono leading-relaxed border border-ide-border">
                      {item.previewSnippet}
                    </div>

                    <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{item.selectionReason}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================== */}
        {/* TAB 4: AI PROJECT ONBOARDING MODE                  */}
        {/* ================================================== */}
        {activeTab === 'onboarding' && (
          <div className="space-y-4 max-w-4xl mx-auto text-xs">
            {onboardingData ? (
              <>
                {/* Purpose Banner */}
                <div className="p-4 rounded-lg bg-ide-card border border-ide-border space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-blue-400" />
                      <h2 className="font-semibold text-sm text-ide-text">Project Purpose</h2>
                    </div>
                    {onboardingData.purpose.isVerified ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-green-950/60 text-green-400 border border-green-800/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified from {onboardingData.purpose.sourceReference}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>AI Inferred</span>
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-300 leading-relaxed">{onboardingData.purpose.summary}</p>
                </div>

                {/* Entry Points & Core Modules */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg bg-ide-card border border-ide-border space-y-2">
                    <h3 className="font-semibold text-ide-text flex items-center gap-1.5">
                      <FileCode className="w-4 h-4 text-green-400" />
                      <span>Main Entry Points</span>
                    </h3>
                    <div className="space-y-1.5">
                      {onboardingData.entryPoints.map((ep, idx) => (
                        <div key={idx} className="p-2 rounded bg-ide-bg border border-ide-border flex justify-between items-center">
                          <span className="font-mono text-zinc-200">{ep.path}</span>
                          <span className="text-[10px] text-ide-muted">{ep.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-ide-card border border-ide-border space-y-2">
                    <h3 className="font-semibold text-ide-text flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <span>Core Export Modules</span>
                    </h3>
                    <div className="space-y-1.5">
                      {onboardingData.coreModules.map((m, idx) => (
                        <div key={idx} className="p-2 rounded bg-ide-bg border border-ide-border flex justify-between items-center">
                          <span className="font-mono text-zinc-200">{m.path}</span>
                          <span className="text-[10px] text-blue-400">{m.exportsCount} symbols</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Core Directories */}
                <div className="p-3.5 rounded-lg bg-ide-card border border-ide-border space-y-2">
                  <h3 className="font-semibold text-ide-text flex items-center gap-1.5">
                    <FolderTree className="w-4 h-4 text-amber-400" />
                    <span>Important Workspace Directories</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {onboardingData.coreDirectories.map((d, idx) => (
                      <div key={idx} className="p-2 rounded bg-ide-bg border border-ide-border">
                        <span className="font-semibold text-zinc-200 font-mono">{d.name}/</span>
                        <p className="text-[11px] text-ide-muted mt-0.5">{d.role}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Data Flow & Architecture Overview */}
                <div className="p-3.5 rounded-lg bg-ide-card border border-ide-border space-y-2">
                  <h3 className="font-semibold text-ide-text flex items-center gap-1.5">
                    <Network className="w-4 h-4 text-blue-400" />
                    <span>System Data Flow Overview</span>
                  </h3>
                  <p className="text-zinc-300 leading-relaxed">{onboardingData.dataFlowOverview.description}</p>
                  {onboardingData.dataFlowOverview.inferenceNotes && (
                    <div className="text-[11px] text-purple-400 flex items-center gap-1 mt-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{onboardingData.dataFlowOverview.inferenceNotes}</span>
                    </div>
                  )}
                </div>

                {/* Disclaimer */}
                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-700/50 text-[11px] text-zinc-400 leading-relaxed">
                  {onboardingData.inferenceDisclaimer}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-ide-muted">Generating structured project onboarding summary...</div>
            )}
          </div>
        )}

        {/* ================================================== */}
        {/* TAB 5: CODE IMPACT ANALYZER                        */}
        {/* ================================================== */}
        {activeTab === 'impact' && (
          <div className="space-y-4 max-w-4xl mx-auto text-xs">
            <div className="p-4 rounded-lg bg-ide-card border border-ide-border space-y-3">
              <h2 className="font-semibold text-sm text-ide-text flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Pre-Change Code Impact Analyzer</span>
              </h2>
              <p className="text-ide-muted">
                Analyze affected callers, import chains, and relevant test files before applying modifications.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={impactTargetFile}
                  onChange={(e) => setImpactTargetFile(e.target.value)}
                  placeholder="Target file path (e.g. src/auth/service.ts)..."
                  className="px-3 py-2 bg-ide-bg border border-ide-border rounded text-xs text-ide-text placeholder:text-ide-muted"
                />
                <input
                  type="text"
                  value={impactSymbol}
                  onChange={(e) => setImpactSymbol(e.target.value)}
                  placeholder="Optional symbol name (e.g. AuthService)..."
                  className="px-3 py-2 bg-ide-bg border border-ide-border rounded text-xs text-ide-text placeholder:text-ide-muted"
                />
              </div>
              <button
                onClick={handleRunImpact}
                disabled={isAnalyzingImpact || !impactTargetFile.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded transition flex items-center gap-1.5"
              >
                {isAnalyzingImpact ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                <span>Analyze Scope & Impact</span>
              </button>
            </div>

            {impactResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-ide-card border border-ide-border">
                  <span className="font-semibold text-ide-text">Potential Scope Assessment:</span>
                  <span className={`px-2 py-0.5 rounded font-mono font-bold uppercase ${
                    impactResult.potentialScope === 'isolated' ? 'bg-green-950 text-green-400' :
                    impactResult.potentialScope === 'moderate' ? 'bg-blue-950 text-blue-400' :
                    impactResult.potentialScope === 'broad' ? 'bg-amber-950 text-amber-400' : 'bg-red-950 text-red-400'
                  }`}>
                    {impactResult.potentialScope}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg bg-ide-card border border-ide-border space-y-2">
                    <h3 className="font-semibold text-ide-text">Detected Dependencies ({impactResult.detectedDependencies.length})</h3>
                    {impactResult.detectedDependencies.length > 0 ? (
                      <div className="space-y-1">
                        {impactResult.detectedDependencies.map((dep, idx) => (
                          <div key={idx} className="p-1.5 rounded bg-ide-bg border border-ide-border flex justify-between">
                            <span className="font-mono text-zinc-300">{dep.file}</span>
                            <span className="text-[10px] text-ide-muted">{dep.detail}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-ide-muted text-[11px]">No external dependencies detected.</span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-lg bg-ide-card border border-ide-border space-y-2">
                    <h3 className="font-semibold text-ide-text">Relevant Test Suites ({impactResult.relevantTestFiles.length})</h3>
                    {impactResult.relevantTestFiles.length > 0 ? (
                      <div className="space-y-1">
                        {impactResult.relevantTestFiles.map((tf, idx) => (
                          <div key={idx} className="p-1.5 rounded bg-ide-bg border border-ide-border flex justify-between items-center">
                            <span className="font-mono text-zinc-300">{tf}</span>
                            <button
                              onClick={() => openFileInEditor(tf)}
                              className="text-[10px] text-blue-400 hover:underline"
                            >
                              Open
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-amber-400/80 text-[11px]">No matching test files detected for target.</span>
                    )}
                  </div>
                </div>

                {impactResult.diffPreview && (
                  <div className="p-3.5 rounded-lg bg-ide-card border border-ide-border space-y-2">
                    <h3 className="font-semibold text-ide-text">Diff Preview</h3>
                    <pre className="p-2.5 rounded bg-ide-bg font-mono text-[11px] text-zinc-300 overflow-x-auto border border-ide-border">
                      {impactResult.diffPreview}
                    </pre>
                  </div>
                )}

                <div className="p-2.5 rounded bg-zinc-900 border border-zinc-700/50 text-[11px] text-zinc-400">
                  {impactResult.disclaimer}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================== */}
        {/* TAB 6: AI TEST COVERAGE ASSISTANT                  */}
        {/* ================================================== */}
        {activeTab === 'tests' && (
          <div className="space-y-4 max-w-4xl mx-auto text-xs">
            <div className="p-3.5 rounded-lg bg-ide-card border border-ide-border space-y-1">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-sm text-ide-text">Test Coverage Gap Assistant</h2>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] border border-zinc-700">
                  {testCoverage?.overallCoverageStatus}
                </span>
              </div>
              <p className="text-[11px] text-ide-muted">{testCoverage?.coverageStatusExplanation}</p>
            </div>

            <div className="space-y-2.5">
              {testCoverage?.candidates.map((cand, idx) => (
                <div key={idx} className="p-3.5 rounded-lg bg-ide-card border border-ide-border space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        cand.priority === 'high' ? 'bg-red-950 text-red-400' :
                        cand.priority === 'medium' ? 'bg-yellow-950 text-yellow-400' : 'bg-blue-950 text-blue-400'
                      }`}>
                        {cand.priority} Priority
                      </span>
                      <span className="font-mono font-semibold text-ide-text">{cand.symbolName}</span>
                      <span className="text-ide-muted">({cand.kind})</span>
                      <span className="text-ide-muted font-mono text-[11px]">{cand.file}:L{cand.lineStart}</span>
                    </div>
                    <button
                      onClick={() => setSelectedTestCandidate(selectedTestCandidate?.symbolName === cand.symbolName ? null : cand)}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium transition"
                    >
                      {selectedTestCandidate?.symbolName === cand.symbolName ? 'Hide Preview' : 'Generate Preview'}
                    </button>
                  </div>

                  <p className="text-[11px] text-zinc-300">{cand.reason}</p>

                  <div className="pl-3 border-l-2 border-ide-border space-y-1 text-[11px] text-zinc-400">
                    {cand.suggestedTests.map((st, sIdx) => (
                      <div key={sIdx}>• {st}</div>
                    ))}
                  </div>

                  {selectedTestCandidate?.symbolName === cand.symbolName && cand.generatedTestPreview && (
                    <div className="mt-3 p-3 rounded bg-ide-bg border border-ide-border space-y-2">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-ide-text">
                        <span>Generated Test Suite Preview (Non-Destructive)</span>
                        <span className="text-[10px] text-amber-400">User Review Required</span>
                      </div>
                      <pre className="font-mono text-[11px] text-zinc-300 overflow-x-auto p-2 rounded bg-zinc-950 border border-zinc-800">
                        {cand.generatedTestPreview}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* TAB 7: DOCUMENTATION HEALTH                        */}
        {/* ================================================== */}
        {activeTab === 'docs' && (
          <div className="space-y-4 max-w-4xl mx-auto text-xs">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-ide-card border border-ide-border">
                <div className="text-lg font-bold text-ide-text">{docHealth?.totalPublicSymbols || 0}</div>
                <div className="text-[11px] text-ide-muted">Total Public Symbols</div>
              </div>
              <div className="p-3 rounded-lg bg-ide-card border border-ide-border">
                <div className="text-lg font-bold text-green-400">{docHealth?.documentedCount || 0}</div>
                <div className="text-[11px] text-ide-muted">Documented</div>
              </div>
              <div className="p-3 rounded-lg bg-ide-card border border-ide-border">
                <div className="text-lg font-bold text-yellow-400">{docHealth?.partiallyDocumentedCount || 0}</div>
                <div className="text-[11px] text-ide-muted">Partially Documented</div>
              </div>
              <div className="p-3 rounded-lg bg-ide-card border border-ide-border">
                <div className="text-lg font-bold text-red-400">{docHealth?.undocumentedCount || 0}</div>
                <div className="text-[11px] text-ide-muted">Potentially Undocumented</div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-1.5">
                {(['all', 'Documented', 'Partially documented', 'Potentially undocumented'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDocFilter(filter)}
                    className={`px-2.5 py-1 rounded text-[11px] transition ${
                      docFilter === filter
                        ? 'bg-blue-600 text-white font-medium'
                        : 'bg-ide-card hover:bg-ide-hover border border-ide-border text-ide-muted'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {docHealth?.items
                .filter((item) => docFilter === 'all' || item.status === docFilter)
                .slice(0, 30)
                .map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-ide-card border border-ide-border flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ide-text font-mono">{item.symbolName}</span>
                        <span className="text-ide-muted font-mono text-[10px]">({item.kind})</span>
                        <span className="text-ide-muted text-[11px]">{item.file}:L{item.line}</span>
                      </div>
                      {item.docstringSnippet && (
                        <p className="text-[11px] text-zinc-400 mt-1 italic">"{item.docstringSnippet}"</p>
                      )}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                      item.status === 'Documented' ? 'bg-green-950 text-green-400' :
                      item.status === 'Partially documented' ? 'bg-yellow-950 text-yellow-400' : 'bg-red-950 text-red-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* TAB 8: AI REFACTORING PLANNER                      */}
        {/* ================================================== */}
        {activeTab === 'refactor' && (
          <div className="space-y-4 max-w-4xl mx-auto text-xs">
            <div className="p-4 rounded-lg bg-ide-card border border-ide-border space-y-3">
              <h2 className="font-semibold text-sm text-ide-text flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-blue-400" />
                <span>AI Refactoring Planner (Planning Only)</span>
              </h2>
              <p className="text-ide-muted">
                Create structured, multi-step migration plans before altering code. No automatic file modifications.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={refactorFile}
                  onChange={(e) => setRefactorFile(e.target.value)}
                  placeholder="Target file to refactor (e.g. src/auth/service.ts)..."
                  className="px-3 py-2 bg-ide-bg border border-ide-border rounded text-xs text-ide-text"
                />
                <input
                  type="text"
                  value={refactorGoal}
                  onChange={(e) => setRefactorGoal(e.target.value)}
                  placeholder="Refactoring goal (e.g. Decompose token handler into strategy)..."
                  className="px-3 py-2 bg-ide-bg border border-ide-border rounded text-xs text-ide-text"
                />
              </div>
              <button
                onClick={handlePlanRefactor}
                disabled={isPlanningRefactor || !refactorFile.trim() || !refactorGoal.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded transition flex items-center gap-1.5"
              >
                {isPlanningRefactor ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
                <span>Plan Refactor</span>
              </button>
            </div>

            {refactorPlan && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-300 text-[11px] leading-relaxed">
                  {refactorPlan.planningOnlyNotice}
                </div>

                <div className="p-3.5 rounded-lg bg-ide-card border border-ide-border space-y-2">
                  <h3 className="font-semibold text-ide-text">Current State & Observations</h3>
                  <div className="space-y-1 text-zinc-300 text-[11px]">
                    {refactorPlan.problemsAndObservations.map((obs, idx) => (
                      <div key={idx}>• {obs}</div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-ide-text">Sequential Migration Steps</h3>
                  {refactorPlan.proposedSteps.map((step) => (
                    <div key={step.stepNumber} className="p-3.5 rounded-lg bg-ide-card border border-ide-border space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-blue-400">Step {step.stepNumber}: {step.title}</span>
                      </div>
                      <p className="text-zinc-300 text-[11px]">{step.description}</p>
                      <div className="flex flex-wrap gap-1 text-[10px] text-ide-muted pt-1">
                        <span>Affected:</span>
                        {step.affectedFiles.map((af, i) => (
                          <span key={i} className="font-mono text-zinc-400">{af}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg bg-ide-card border border-ide-border space-y-2">
                    <h3 className="font-semibold text-ide-text">Testing Plan</h3>
                    <div className="space-y-1 text-zinc-300 text-[11px]">
                      {refactorPlan.testingPlan.map((tp, idx) => (
                        <div key={idx}>✓ {tp}</div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-ide-card border border-ide-border space-y-2">
                    <h3 className="font-semibold text-ide-text">Documentation Updates</h3>
                    <div className="space-y-1 text-zinc-300 text-[11px]">
                      {refactorPlan.documentationUpdates.map((du, idx) => (
                        <div key={idx}>✎ {du}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================== */}
        {/* TAB 9: CODE SIMILARITY DETECTOR                    */}
        {/* ================================================== */}
        {activeTab === 'similarity' && (
          <div className="space-y-4 max-w-4xl mx-auto text-xs">
            <div className="p-4 rounded-lg bg-ide-card border border-ide-border flex flex-col md:flex-row justify-between items-center gap-3">
              <div>
                <h2 className="font-semibold text-sm text-ide-text flex items-center gap-1.5">
                  <Copy className="w-4 h-4 text-blue-400" />
                  <span>Code Similarity & Duplication Detector</span>
                </h2>
                <p className="text-ide-muted mt-0.5">
                  Scan structural signatures and routine tokens across workspace modules.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-ide-muted">Threshold: {similarityThreshold}%</span>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={similarityThreshold}
                  onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                  className="w-28 accent-blue-600"
                />
                <button
                  onClick={handleScanSimilarity}
                  disabled={isScanningSimilarity}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded transition flex items-center gap-1.5"
                >
                  {isScanningSimilarity ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Scan Duplicates</span>
                </button>
              </div>
            </div>

            {similarityReport && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-ide-muted">
                  <span>Analyzed {similarityReport.totalSymbolsAnalyzed} symbols • Detected {similarityReport.potentialDuplicatesCount} potential duplicates</span>
                </div>
                <div className="space-y-2">
                  {similarityReport.pairs.map((pair, idx) => (
                    <div key={idx} className="p-3.5 rounded-lg bg-ide-card border border-ide-border space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ide-text">{pair.symbolA}</span>
                          <span className="text-ide-muted font-mono text-[11px]">({pair.fileA})</span>
                          <ArrowRight className="w-3.5 h-3.5 text-ide-muted" />
                          <span className="font-bold text-ide-text">{pair.symbolB}</span>
                          <span className="text-ide-muted font-mono text-[11px]">({pair.fileB})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 font-mono font-bold">
                            {pair.similarityPercentage}% Similarity
                          </span>
                          <button
                            onClick={() => setActiveComparisonPair(pair)}
                            className="px-2 py-0.5 rounded bg-ide-hover hover:bg-zinc-700 text-ide-text text-[11px]"
                          >
                            Compare Side-by-Side
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-400">{pair.similarityReason}</p>
                    </div>
                  ))}
                </div>

                <div className="p-2.5 rounded bg-zinc-900 border border-zinc-700/50 text-[11px] text-zinc-400">
                  {similarityReport.notice}
                </div>
              </div>
            )}

            {/* Side-by-Side Comparison Modal */}
            {activeComparisonPair && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
                <div className="bg-ide-card border border-ide-border rounded-xl p-5 w-full max-w-4xl space-y-4 max-h-[85vh] flex flex-col">
                  <div className="flex justify-between items-center border-b border-ide-border pb-2">
                    <h3 className="font-bold text-sm text-ide-text">Side-by-Side Code Comparison</h3>
                    <button onClick={() => setActiveComparisonPair(null)} className="text-ide-muted hover:text-white">✕</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 flex-1 overflow-auto">
                    <div className="space-y-1">
                      <div className="font-semibold text-zinc-300 font-mono text-[11px]">
                        {activeComparisonPair.fileA} (L{activeComparisonPair.linesA[0]}-L{activeComparisonPair.linesA[1]})
                      </div>
                      <pre className="p-3 rounded bg-ide-bg border border-ide-border font-mono text-[11px] text-zinc-200 overflow-auto h-72">
                        {activeComparisonPair.snippetA}
                      </pre>
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold text-zinc-300 font-mono text-[11px]">
                        {activeComparisonPair.fileB} (L{activeComparisonPair.linesB[0]}-L{activeComparisonPair.linesB[1]})
                      </div>
                      <pre className="p-3 rounded bg-ide-bg border border-ide-border font-mono text-[11px] text-zinc-200 overflow-auto h-72">
                        {activeComparisonPair.snippetB}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================== */}
        {/* TAB 10: LOCAL PROJECT KNOWLEDGE BASE               */}
        {/* ================================================== */}
        {activeTab === 'knowledge' && (
          <div className="space-y-4 max-w-4xl mx-auto text-xs">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h2 className="font-semibold text-sm text-ide-text flex items-center gap-1.5">
                  <BookMarked className="w-4 h-4 text-blue-400" />
                  <span>Local Project Knowledge Base</span>
                </h2>
                <p className="text-ide-muted mt-0.5">
                  Save architecture decisions, project conventions, and notes safely in local SQLite.
                </p>
              </div>
              <button
                onClick={() => setIsCreatingNote(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Note</span>
              </button>
            </div>

            {/* Filter and Search */}
            <div className="flex gap-2">
              <input
                type="text"
                value={knowledgeSearch}
                onChange={(e) => setKnowledgeSearch(e.target.value)}
                placeholder="Search knowledge notes..."
                className="flex-1 px-3 py-1.5 bg-ide-card border border-ide-border rounded text-xs text-ide-text"
              />
              <select
                value={knowledgeCategory}
                onChange={(e) => setKnowledgeCategory(e.target.value)}
                className="bg-ide-card border border-ide-border rounded px-3 py-1.5 text-xs text-ide-text"
              >
                <option value="all">All Categories</option>
                <option value="architecture">Architecture Decisions</option>
                <option value="development">Development Notes</option>
                <option value="commands">Commands</option>
                <option value="api">API Explanations</option>
                <option value="conventions">Conventions</option>
                <option value="limitations">Known Limitations</option>
                <option value="general">General</option>
              </select>
            </div>

            {/* Create Note Modal */}
            {isCreatingNote && (
              <form onSubmit={handleCreateKnowledgeNote} className="p-4 rounded-lg bg-ide-card border border-ide-border space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-ide-text">Create Project Knowledge Note</h3>
                  <button type="button" onClick={() => setIsCreatingNote(false)} className="text-ide-muted hover:text-white">✕</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Title (e.g. SQLite Schema & Migration Strategy)..."
                    className="px-3 py-1.5 bg-ide-bg border border-ide-border rounded text-xs text-ide-text"
                  />
                  <select
                    value={newNoteCategory}
                    onChange={(e) => setNewNoteCategory(e.target.value as KnowledgeCategory)}
                    className="px-3 py-1.5 bg-ide-bg border border-ide-border rounded text-xs text-ide-text"
                  >
                    <option value="architecture">Architecture</option>
                    <option value="development">Development</option>
                    <option value="commands">Commands</option>
                    <option value="api">API</option>
                    <option value="conventions">Conventions</option>
                    <option value="limitations">Limitations</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <textarea
                  required
                  rows={4}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Note content, architecture decisions, trade-offs..."
                  className="w-full p-2.5 bg-ide-bg border border-ide-border rounded text-xs text-ide-text font-mono"
                />
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    value={newNoteTags}
                    onChange={(e) => setNewNoteTags(e.target.value)}
                    placeholder="Comma-separated tags (e.g. database, sqlite, persistence)..."
                    className="flex-1 mr-3 px-3 py-1.5 bg-ide-bg border border-ide-border rounded text-xs text-ide-text"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-ide-muted cursor-pointer mr-3">
                    <input
                      type="checkbox"
                      checked={newNoteInRag}
                      onChange={(e) => setNewNoteInRag(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                    <span>Include in RAG</span>
                  </label>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                  >
                    Save Note
                  </button>
                </div>
              </form>
            )}

            {/* Notes List */}
            <div className="space-y-3">
              {knowledgeNotes.length > 0 ? (
                knowledgeNotes.map((note) => (
                  <div key={note.id} className="p-4 rounded-lg bg-ide-card border border-ide-border space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-ide-text">{note.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 font-mono capitalize border border-blue-800/40">
                          {note.category}
                        </span>
                        {note.includeInRag && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 font-mono border border-purple-800/40">
                            RAG Enabled
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteKnowledgeNote(note.id)}
                        className="text-ide-muted hover:text-red-400 p-1"
                        title="Delete Note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap">{note.content}</p>
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {note.tags.map((t, idx) => (
                          <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-ide-bg text-ide-muted border border-ide-border">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-ide-muted">
                  No knowledge notes found. Add architecture notes or development conventions above.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
