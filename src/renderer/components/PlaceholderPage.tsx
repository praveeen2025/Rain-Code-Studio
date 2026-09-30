/**
 * SnapDev AI - Placeholder Page Component
 * Professional developer empty state for upcoming phases.
 * Strictly adheres to rule: No fake AI responses or mock claims.
 */

import React from 'react';
import { LucideIcon, ShieldCheck, Cpu } from 'lucide-react';

interface Props {
  title: string;
  icon: LucideIcon;
  targetPhase: string;
  description: string;
  highlights: string[];
}

export const PlaceholderPage: React.FC<Props> = ({
  title,
  icon: Icon,
  targetPhase,
  description,
  highlights
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto select-none">
      <div className="w-14 h-14 rounded-2xl bg-ide-surface border border-ide-border flex items-center justify-center shadow-lg mb-5 text-snap-crimson">
        <Icon className="w-7 h-7" />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-ide-surface border border-ide-border text-ide-muted">
          {targetPhase}
        </span>
      </div>

      <p className="text-sm text-ide-muted mb-6 leading-relaxed">
        {description}
      </p>

      {/* Architecture Highlights Card */}
      <div className="w-full bg-ide-surface/60 border border-ide-border rounded-xl p-5 text-left mb-6 space-y-3">
        <div className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-snap-blue" />
          <span>Planned Architecture for this Module</span>
        </div>
        <ul className="space-y-2 text-xs text-ide-muted">
          {highlights.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-snap-crimson font-mono font-bold">›</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Privacy Guarantee Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ide-surface/80 border border-ide-border text-xs text-ide-muted">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Coming in a future phase — 100% on-device & private</span>
      </div>
    </div>
  );
};
