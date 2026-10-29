/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ALL_PRESETS, PRESET_BLANK } from '../engine/presets';
import { LanguageConfig } from '../engine/types';

interface PresetsSlideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeConfig: LanguageConfig;
  onSelectPreset: (preset: LanguageConfig) => void;
  onCreateBlankPreset: () => void;
}

export const PresetsSlideDrawer: React.FC<PresetsSlideDrawerProps> = ({
  isOpen,
  onClose,
  activeConfig,
  onSelectPreset,
  onCreateBlankPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide Drawer Content */}
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-xl h-full flex flex-col shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>🏛️ Language Architectures</span>
              <span aria-hidden="true">·</span>
              <span>Presets & Blank Canvas</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Conlang Presets Slide</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg text-lg leading-none"
            title="Close presets slide"
          >
            ✕
          </button>
        </div>

        {/* PROMINENT: Create New Blank Preset Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/60 via-slate-900 to-slate-950 border-2 border-cyan-500/80 shadow-lg shadow-cyan-500/10 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">📄</span>
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                Tabula Rasa
              </span>
            </div>
            <span className="text-[11px] text-cyan-300/80 font-sans">Fresh Slate</span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Create New Blank Preset</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Start with an unpopulated linguistic canvas. No pre-set vocabulary, custom sound rules, or rigid affixes — craft your phonemes, native script, and grammatical agreement completely from scratch!
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onCreateBlankPreset();
              onClose();
            }}
            className="w-full py-2.5 px-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-cyan-400/20"
          >
            <span>➕ Create New Blank Preset</span>
          </button>
        </div>

        {/* Section title for pre-configured presets */}
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
          <span>Pre-Configured World-Class Presets</span>
          <span>{ALL_PRESETS.filter((p) => p.id !== 'blank-canvas').length} Architectures</span>
        </div>

        {/* List of Presets */}
        <div className="space-y-4 flex-1">
          {ALL_PRESETS.filter((p) => p.id !== 'blank-canvas').map((preset) => {
            const isCurrent = activeConfig.id === preset.id;

            return (
              <div
                key={preset.id}
                className={`p-5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-slate-950/90 border-cyan-400/80 shadow-md ring-1 ring-cyan-500/40'
                    : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white font-mono">{preset.name}</h4>
                    <p className="text-xs text-slate-400 italic mt-0.5">"{preset.motto}"</p>
                  </div>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      Currently Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                  {preset.description}
                </p>

                {/* Typology badges */}
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-800/60 text-[11px] font-mono">
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                    {preset.wordOrder}
                  </span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-indigo-300 capitalize">
                    {preset.morphologyType}
                  </span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-emerald-300">
                    {preset.geometricMorphology}
                  </span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300 capitalize">
                    {preset.scriptStyle}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPreset(preset);
                      onClose();
                    }}
                    disabled={isCurrent}
                    className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {isCurrent ? 'Active Language' : 'Load This Preset'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-4 mt-6 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          Switching presets automatically adapts phonology, Slavic diacritics, and lexicon.
        </div>
      </div>
    </div>
  );
};
