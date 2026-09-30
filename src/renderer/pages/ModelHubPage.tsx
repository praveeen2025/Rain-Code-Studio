/**
 * Rain Code Studio - Local AI Model Hub Page
 * Phase 12.2: Discover, validate, activate and import local AI models.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  LocalModel,
  ModelRegistry,
  ModelDiscoveryResult,
  ModelValidationResult,
  ModelActivationResult,
  ModelImportRequest,
  LocalModelStatus,
  LocalModelFormat,
  LocalModelProvider
} from '../../shared/types';
import { chatStore } from '../stores/chatStore';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let val = bytes; let unit = 0;
  while (val >= 1024 && unit < units.length - 1) { val /= 1024; unit++; }
  return `${val.toFixed(1)} ${units[unit]}`;
}
function statusColor(s: LocalModelStatus): string {
  switch (s) {
    case 'Active': return '#4ade80';
    case 'Ready': return '#60a5fa';
    case 'Validated': return '#a78bfa';
    case 'Discovered': return '#facc15';
    case 'Importing': return '#fb923c';
    case 'Error': return '#f87171';
    default: return '#6b7280';
  }
}
function fmtIcon(f: LocalModelFormat): string {
  switch (f) {
    case 'gguf': return '🦙'; case 'safetensors': return '🔒';
    case 'onnx': return '⚡'; case 'pytorch': return '🔥';
    case 'mlx': return '🍎'; case 'openvino': return '🔵';
    default: return '📦';
  }
}
function provColor(p: LocalModelProvider): string {
  switch (p) {
    case 'ollama': return '#1a7de8'; case 'llamacpp': return '#7c3aed';
    case 'huggingface': return '#f97316'; case 'lmstudio': return '#0ea5e9';
    case 'jan': return '#10b981'; case 'localai': return '#ec4899';
    default: return '#6b7280';
  }
}
function btnSt(color: string, ghost = false): React.CSSProperties {
  return {
    background: ghost ? 'transparent' : `${color}22`,
    border: `1px solid ${color}66`, color: ghost ? '#f87171' : color,
    borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 500, cursor: 'pointer'
  };
}
const inputSt: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: '#e2e8f0', padding: '7px 10px', fontSize: 12, marginBottom: 12, boxSizing: 'border-box'
};
const labelSt: React.CSSProperties = { display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: 500 };

// ── ModelCard ──────────────────────────────────────────────────────────────────
interface CardProps {
  model: LocalModel; isSelected: boolean; isProcessing: boolean;
  onSelect(): void; onValidate(): void; onActivate(): void;
  onDeactivate(): void; onRemove(): void; onChat?(): void;
}
const ModelCard: React.FC<CardProps> = ({ model, isSelected, isProcessing, onSelect, onValidate, onActivate, onDeactivate, onRemove, onChat }) => {
  const active = model.status === 'Active';
  return (
    <div onClick={onSelect} style={{
      background: isSelected ? 'linear-gradient(135deg,rgba(96,165,250,.12),rgba(167,139,250,.08))' : 'rgba(255,255,255,.03)',
      border: isSelected ? '1px solid rgba(96,165,250,.4)' : active ? '1px solid rgba(74,222,128,.3)' : '1px solid rgba(255,255,255,.06)',
      borderRadius: 10, padding: '14px 16px', cursor: 'pointer', marginBottom: 8, position: 'relative', transition: 'all .18s'
    }}>
      {active && <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(74,222,128,.15)', border: '1px solid rgba(74,222,128,.4)', borderRadius: 4, padding: '2px 7px', fontSize: 10, color: '#4ade80', fontWeight: 600 }}>ACTIVE</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 22 }}>{fmtIcon(model.format)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{model.name}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{model.family} · {model.parameterCount} · {model.quantization}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
        <span style={{ background: `${statusColor(model.status)}22`, border: `1px solid ${statusColor(model.status)}55`, color: statusColor(model.status), borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 600 }}>{model.status}</span>
        <span style={{ background: `${provColor(model.provider)}22`, border: `1px solid ${provColor(model.provider)}55`, color: provColor(model.provider), borderRadius: 4, padding: '2px 7px', fontSize: 10 }}>{model.provider}</span>
        <span style={{ color: '#475569', fontSize: 10 }}>{model.format.toUpperCase()}</span>
        <span style={{ color: '#475569', fontSize: 10, marginLeft: 'auto' }}>{formatBytes(model.fileSize)}</span>
      </div>
      {model.status === 'Error' && model.errorMessage && (
        <div style={{ marginTop: 8, fontSize: 10, color: '#f87171', background: 'rgba(248,113,113,.08)', borderRadius: 4, padding: '4px 8px' }}>⚠ {model.errorMessage}</div>
      )}
      {isSelected && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <button onClick={(e) => { e.stopPropagation(); onValidate(); }} disabled={isProcessing} style={btnSt('#7c3aed')}>✓ Validate</button>
          {active
            ? <button onClick={(e) => { e.stopPropagation(); onDeactivate(); }} disabled={isProcessing} style={btnSt('#475569')}>⏹ Deactivate</button>
            : <button onClick={(e) => { e.stopPropagation(); onActivate(); }} disabled={isProcessing} style={btnSt('#1a7de8')}>▶ Activate</button>}
          {active && onChat && (
            <button onClick={(e) => { e.stopPropagation(); onChat(); }} style={btnSt('#4ade80')}>💬 Chat</button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} disabled={isProcessing} style={btnSt('#b91c1c', true)}>✕ Remove</button>
        </div>
      )}
    </div>
  );
};

// ── ImportModal ────────────────────────────────────────────────────────────────
const ImportModal: React.FC<{ onClose(): void; onImport(r: ModelImportRequest): void; isImporting: boolean }> = ({ onClose, onImport, isImporting }) => {
  const [fp, setFp] = useState('');
  const [name, setName] = useState('');
  const [provider, setProvider] = useState<LocalModelProvider>('llamacpp');
  const [ep, setEp] = useState('');
  const [isOllama, setIsOllama] = useState(false);
  const submit = () => { if (!fp.trim()) return; onImport({ filePath: fp.trim(), name: name.trim() || undefined, provider, endpointUrl: ep.trim() || undefined }); };
  const tog: React.CSSProperties = { flex: 1, padding: '6px 10px', fontSize: 11, fontWeight: 500, color: '#e2e8f0', borderRadius: 6, cursor: 'pointer' };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: 28, width: 480, maxWidth: '90vw' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>📥 Import Model</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => { setIsOllama(false); setProvider('llamacpp'); }} style={{ ...tog, background: !isOllama ? 'rgba(96,165,250,.2)' : 'transparent', border: `1px solid ${!isOllama ? '#60a5fa' : 'rgba(255,255,255,.1)'}` }}>File / Directory</button>
          <button onClick={() => { setIsOllama(true); setProvider('ollama'); }} style={{ ...tog, background: isOllama ? 'rgba(26,125,232,.2)' : 'transparent', border: `1px solid ${isOllama ? '#1a7de8' : 'rgba(255,255,255,.1)'}` }}>🦙 Ollama Model</button>
        </div>
        <label style={labelSt}>{isOllama ? 'Ollama Model Name (e.g. llama3:latest)' : 'File Path'}</label>
        <input value={fp} onChange={(e) => setFp(e.target.value)} placeholder={isOllama ? 'llama3:latest' : 'C:\\Models\\model.gguf'} style={inputSt} />
        <label style={labelSt}>Display Name (optional)</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder='My Custom Model' style={inputSt} />
        {!isOllama && (<>
          <label style={labelSt}>Provider</label>
          <select value={provider} onChange={(e) => setProvider(e.target.value as LocalModelProvider)} style={inputSt}>
            <option value='llamacpp'>llama.cpp</option><option value='huggingface'>HuggingFace</option>
            <option value='lmstudio'>LM Studio</option><option value='jan'>Jan</option><option value='custom'>Custom</option>
          </select>
          <label style={labelSt}>Endpoint URL (optional)</label>
          <input value={ep} onChange={(e) => setEp(e.target.value)} placeholder='http://localhost:8080' style={inputSt} />
        </>)}
        {isOllama && (<>
          <label style={labelSt}>Ollama Endpoint</label>
          <input value={ep || 'http://localhost:11434'} onChange={(e) => setEp(e.target.value)} style={inputSt} />
        </>)}
        <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnSt('#475569')}>Cancel</button>
          <button onClick={submit} disabled={!fp.trim() || isImporting} style={{ ...btnSt('#1a7de8'), opacity: (!fp.trim() || isImporting) ? 0.5 : 1 }}>{isImporting ? 'Importing…' : '📥 Import'}</button>
        </div>
      </div>
    </div>
  );
};

// ── SearchPathsPanel ───────────────────────────────────────────────────────────
const SearchPathsPanel: React.FC<{ paths: string[]; onAdd(p: string): void; onRemove(p: string): void }> = ({ paths, onAdd, onRemove }) => {
  const [input, setInput] = useState('');
  return (
    <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 8, padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>🗂 Scan Paths</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && input.trim()) { onAdd(input.trim()); setInput(''); } }} placeholder='Add scan path…' style={{ ...inputSt, marginBottom: 0, flex: 1 }} />
        <button onClick={() => { if (input.trim()) { onAdd(input.trim()); setInput(''); } }} style={btnSt('#1a7de8')}>+ Add</button>
      </div>
      <div style={{ maxHeight: 140, overflowY: 'auto' }}>
        {paths.length === 0 && <div style={{ fontSize: 11, color: '#475569' }}>No paths configured.</div>}
        {paths.map((p) => (
          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: '#64748b', flex: 1, wordBreak: 'break-all' }}>{p}</span>
            <button onClick={() => onRemove(p)} style={{ ...btnSt('#b91c1c', true), padding: '2px 6px', fontSize: 10 }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── ValidationPanel ────────────────────────────────────────────────────────────
const ValidationPanel: React.FC<{ result: ModelValidationResult }> = ({ result }) => (
  <div style={{ background: result.isValid ? 'rgba(74,222,128,.06)' : 'rgba(248,113,113,.06)', border: `1px solid ${result.isValid ? 'rgba(74,222,128,.2)' : 'rgba(248,113,113,.2)'}`, borderRadius: 8, padding: 12, marginTop: 10 }}>
    <div style={{ fontSize: 12, fontWeight: 600, color: result.isValid ? '#4ade80' : '#f87171', marginBottom: 8 }}>{result.isValid ? '✓ Validation Passed' : '✗ Validation Failed'}</div>
    {result.checks.map((c, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, marginBottom: 4 }}>
        <span style={{ color: c.passed ? '#4ade80' : '#f87171', flexShrink: 0 }}>{c.passed ? '✓' : '✗'}</span>
        <span style={{ color: '#94a3b8' }}><strong>{c.name}</strong> — {c.detail}</span>
      </div>
    ))}
    {result.errorMessage && <div style={{ fontSize: 11, color: '#f87171', marginTop: 6 }}>{result.errorMessage}</div>}
  </div>
);

// ── Main Page ──────────────────────────────────────────────────────────────────
interface ModelHubPageProps {
  onNavigateChat?: () => void;
}

export const ModelHubPage: React.FC<ModelHubPageProps> = ({ onNavigateChat }) => {
  const [registry, setRegistry] = useState<ModelRegistry | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [valResult, setValResult] = useState<ModelValidationResult | null>(null);
  const [searchPaths, setSearchPaths] = useState<string[]>([]);
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState<LocalModelStatus | 'all'>('all');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const api = window.electronAPI;
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  };

  const loadRegistry = useCallback(async () => {
    if (!api) return;
    try {
      const reg = await api.modelHubGetRegistry();
      setRegistry(reg);
      const paths = await api.modelHubGetSearchPaths();
      setSearchPaths(paths);
    } catch (err) { showToast(`Failed to load: ${err instanceof Error ? err.message : String(err)}`, 'error'); }
  }, [api]);

  useEffect(() => { loadRegistry(); }, [loadRegistry]);

  const handleDiscover = async () => {
    if (!api) return;
    setDiscovering(true); setValResult(null);
    try {
      const r: ModelDiscoveryResult = await api.modelHubDiscover();
      setRegistry(r.registry);
      showToast(`Found ${r.registry.models.length} model(s)${r.newModels.length > 0 ? ` (${r.newModels.length} new)` : ''}.`, 'success');
    } catch (err) { showToast(`Discovery failed: ${err instanceof Error ? err.message : String(err)}`, 'error'); }
    finally { setDiscovering(false); }
  };

  const handleValidate = async (id: string) => {
    if (!api) return; setProcessing(true); setValResult(null);
    try { const r = await api.modelHubValidate(id); setValResult(r); await loadRegistry(); showToast(r.isValid ? 'Validated.' : 'Validation failed.', r.isValid ? 'success' : 'error'); }
    catch (err) { showToast(`${err instanceof Error ? err.message : String(err)}`, 'error'); }
    finally { setProcessing(false); }
  };

  const handleActivate = async (id: string) => {
    if (!api) return; setProcessing(true);
    try {
      const r: ModelActivationResult = await api.modelHubActivate(id);
      await loadRegistry();
      chatStore.refreshStatus();
      showToast(r.success ? `${r.message} Ready in Chat!` : `Failed: ${r.message}`, r.success ? 'success' : 'error');
    }
    catch (err) { showToast(String(err), 'error'); }
    finally { setProcessing(false); }
  };

  const handleDeactivate = async () => {
    if (!api) return; setProcessing(true);
    try {
      const r = await api.modelHubDeactivate();
      await loadRegistry();
      chatStore.refreshStatus();
      showToast(r.success ? r.message : `Failed: ${r.message}`, r.success ? 'success' : 'error');
    }
    catch (err) { showToast(String(err), 'error'); }
    finally { setProcessing(false); }
  };

  const handleRemove = async (id: string) => {
    if (!api) return; setProcessing(true);
    try { const r = await api.modelHubRemove(id); setSelectedId(null); setValResult(null); await loadRegistry(); showToast(r.success ? r.message : `Failed: ${r.message}`, r.success ? 'success' : 'error'); }
    catch (err) { showToast(String(err), 'error'); }
    finally { setProcessing(false); }
  };

  const handleImport = async (req: ModelImportRequest) => {
    if (!api) return; setImporting(true);
    try { const r = await api.modelHubImport(req); setShowImport(false); await loadRegistry(); showToast(r.success ? `"${r.model?.name ?? req.filePath}" imported.` : `Import failed: ${r.error}`, r.success ? 'success' : 'error'); }
    catch (err) { showToast(String(err), 'error'); }
    finally { setImporting(false); }
  };

  const handleAddPath = async (p: string) => {
    if (!api) return;
    try { setSearchPaths(await api.modelHubAddSearchPath(p)); showToast('Path added.', 'success'); }
    catch (err) { showToast(String(err), 'error'); }
  };

  const handleRemovePath = async (p: string) => {
    if (!api) return;
    try { setSearchPaths(await api.modelHubRemoveSearchPath(p)); }
    catch (err) { showToast(String(err), 'error'); }
  };

  const models = (registry?.models ?? []).filter((m) => {
    const t = !filterText || m.name.toLowerCase().includes(filterText.toLowerCase()) || m.family.toLowerCase().includes(filterText.toLowerCase()) || m.provider.toLowerCase().includes(filterText.toLowerCase());
    const s = filterStatus === 'all' || m.status === filterStatus;
    return t && s;
  });

  const activeModel = registry?.models.find((m) => m.status === 'Active');
  const selectedModel = registry?.models.find((m) => m.id === selectedId);

  const toastColor = toast?.type === 'success' ? { bg: 'rgba(16,185,129,.15)', border: 'rgba(16,185,129,.4)' }
    : toast?.type === 'error' ? { bg: 'rgba(239,68,68,.15)', border: 'rgba(239,68,68,.4)' }
    : { bg: 'rgba(59,130,246,.15)', border: 'rgba(59,130,246,.4)' };

  const capBadge: React.CSSProperties = { background: 'rgba(96,165,250,.1)', border: '1px solid rgba(96,165,250,.2)', color: '#60a5fa', borderRadius: 4, padding: '2px 6px', fontSize: 9, fontWeight: 500 };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 24px', fontFamily: "'Inter','Segoe UI',sans-serif", color: '#e2e8f0' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 10000, background: toastColor.bg, border: `1px solid ${toastColor.border}`, borderRadius: 8, padding: '10px 16px', fontSize: 12, color: '#e2e8f0', maxWidth: 380 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 24 }}>🧠</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, background: 'linear-gradient(135deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Local AI Model Hub</h1>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Discover · Validate · Activate local models · 100% on-device</div>
          </div>
        </div>
        {activeModel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 8, padding: '8px 14px' }}>
            <span style={{ fontSize: 18 }}>{fmtIcon(activeModel.format)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#4ade80' }}>Active Model</div>
              <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeModel.name} · {activeModel.provider} · {activeModel.format.toUpperCase()}</div>
            </div>
            <span style={{ fontSize: 11, color: '#4ade80', opacity: 0.7 }}>● LIVE</span>
            {onNavigateChat && (
              <button
                onClick={onNavigateChat}
                style={{
                  background: 'rgba(74,222,128,.2)',
                  border: '1px solid rgba(74,222,128,.4)',
                  color: '#4ade80',
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                💬 Open in Chat
              </button>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={handleDiscover} disabled={discovering} style={{ background: 'linear-gradient(135deg,rgba(96,165,250,.15),rgba(167,139,250,.1))', border: '1px solid rgba(96,165,250,.35)', color: '#60a5fa', borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: discovering ? 'not-allowed' : 'pointer', opacity: discovering ? 0.6 : 1 }}>
          {discovering ? '⏳ Scanning…' : '🔍 Discover Models'}
        </button>
        <button onClick={() => setShowImport(true)} style={{ background: 'rgba(26,125,232,.12)', border: '1px solid rgba(26,125,232,.35)', color: '#60a5fa', borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>📥 Import Model</button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: '#475569' }}>{registry?.lastDiscoveryAt ? `Last scan: ${new Date(registry.lastDiscoveryAt).toLocaleTimeString()}` : 'Not scanned yet'}</span>
      </div>

      {/* Stats */}
      {registry && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {([['Total', registry.models.length, '#94a3b8'], ['Ready', registry.models.filter(m => m.status === 'Ready').length, '#60a5fa'], ['Validated', registry.models.filter(m => m.status === 'Validated').length, '#a78bfa'], ['Active', registry.models.filter(m => m.status === 'Active').length, '#4ade80'], ['Errors', registry.models.filter(m => m.status === 'Error').length, '#f87171']] as [string, number, string][]).map(([label, val, color]) => (
            <div key={label} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 7, padding: '7px 12px', textAlign: 'center', minWidth: 60 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color }}>{val}</div>
              <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
        {/* Left: list */}
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder='Filter models…' style={{ ...inputSt, marginBottom: 0, flex: 1 }} />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as LocalModelStatus | 'all')} style={{ ...inputSt, marginBottom: 0, width: 130 }}>
              <option value='all'>All Status</option>
              {(['Active', 'Ready', 'Validated', 'Discovered', 'Error'] as LocalModelStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {!registry && (
            <div style={{ textAlign: 'center', padding: 48, color: '#475569' }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>🧠</div>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>No models scanned yet</div>
              <div style={{ fontSize: 12 }}>Click "Discover Models" to auto-detect installed models on your system.</div>
            </div>
          )}
          {registry && models.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: '#475569' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{filterText || filterStatus !== 'all' ? 'No models match your filter.' : 'No models discovered.'}</div>
            </div>
          )}
          {models.map(m => (
            <ModelCard key={m.id} model={m} isSelected={selectedId === m.id} isProcessing={processing}
              onSelect={() => { setSelectedId(m.id === selectedId ? null : m.id); setValResult(null); }}
              onValidate={() => handleValidate(m.id)} onActivate={() => handleActivate(m.id)}
              onDeactivate={handleDeactivate} onRemove={() => handleRemove(m.id)}
              onChat={onNavigateChat} />
          ))}
          {valResult && <ValidationPanel result={valResult} />}
        </div>

        {/* Right: detail + stats + paths */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {selectedModel && (
            <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>ℹ Model Details</div>
              {([['Family', selectedModel.family], ['Parameters', selectedModel.parameterCount], ['Quantization', selectedModel.quantization], ['Format', selectedModel.format.toUpperCase()], ['Context', `${selectedModel.contextLength.toLocaleString()} tokens`], ['Size', formatBytes(selectedModel.fileSize)], ['Provider', selectedModel.provider], ['Status', selectedModel.status], ['Imported', selectedModel.isImported ? 'Yes' : 'No'], ['Discovered', new Date(selectedModel.discoveredAt).toLocaleDateString()]] as [string, string][]).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                  <span style={{ color: '#475569' }}>{k}</span>
                  <span style={{ color: '#94a3b8', fontWeight: 500, textAlign: 'right', maxWidth: 150, wordBreak: 'break-all' }}>{v}</span>
                </div>
              ))}
              {selectedModel.endpointUrl && <div style={{ marginTop: 6, fontSize: 10, color: '#475569', wordBreak: 'break-all' }}>🔗 {selectedModel.endpointUrl}</div>}
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {selectedModel.capabilities.chat && <span style={capBadge}>💬 Chat</span>}
                {selectedModel.capabilities.completion && <span style={capBadge}>✏ Completion</span>}
                {selectedModel.capabilities.embedding && <span style={capBadge}>📐 Embedding</span>}
                {selectedModel.capabilities.vision && <span style={capBadge}>👁 Vision</span>}
                {selectedModel.capabilities.functionCalling && <span style={capBadge}>⚙ Functions</span>}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: '#475569' }}>
                <div style={{ fontWeight: 600, marginBottom: 4, color: '#64748b' }}>Hardware Requirements</div>
                <div>Min RAM: {selectedModel.hardware.minRamMb >= 1024 ? `${(selectedModel.hardware.minRamMb / 1024).toFixed(1)} GB` : `${selectedModel.hardware.minRamMb} MB`}</div>
                <div>Rec RAM: {selectedModel.hardware.recommendedRamMb >= 1024 ? `${(selectedModel.hardware.recommendedRamMb / 1024).toFixed(1)} GB` : `${selectedModel.hardware.recommendedRamMb} MB`}</div>
                <div>GPU: {selectedModel.hardware.gpuSupported ? '✓' : '✗'} · NPU: {selectedModel.hardware.npuSupported ? '✓' : '✗'}</div>
              </div>
            </div>
          )}

          {registry?.discoveryStats && (
            <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>📊 Last Discovery</div>
              {([['Scanned', String(registry.discoveryStats.totalScanned)], ['Found', String(registry.discoveryStats.discovered)], ['Errors', String(registry.discoveryStats.errors)], ['Duration', `${registry.discoveryStats.durationMs}ms`]] as [string, string][]).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: '#475569' }}>{k}</span>
                  <span style={{ color: '#94a3b8', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          <SearchPathsPanel paths={searchPaths} onAdd={handleAddPath} onRemove={handleRemovePath} />
        </div>
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} onImport={handleImport} isImporting={importing} />}
    </div>
  );
};

export default ModelHubPage;
