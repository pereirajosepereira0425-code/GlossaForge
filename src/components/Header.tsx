/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ALL_PRESETS } from '../engine/presets';
import { LanguageConfig } from '../engine/types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeConfig: LanguageConfig;
  onSelectPreset: (preset: LanguageConfig) => void;
  onRegenerate: () => void;
  onOpenPresetsSlide: () => void;
  onCreateBlankPreset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeConfig,
  onSelectPreset,
  onRegenerate,
  onOpenPresetsSlide,
  onCreateBlankPreset,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-slate-800/80 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('parameters');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-cyan-400 transition-colors"
        >
          GlossaForge
        </a>

        {/* Zone 2: 4–5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-400 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setActiveTab('parameters')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'parameters'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            Parameters & Geometry
          </button>
          <button
            onClick={() => setActiveTab('phonology')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'phonology'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            Phonology & Diacritics
          </button>
          <button
            onClick={() => setActiveTab('character-maker')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 flex items-center gap-1.5 ${
              activeTab === 'character-maker'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
            title="Design and paint custom Unicode characters with PUA code points and recorded audio"
          >
            <span>🔣</span>
            <span>Unicode Character Maker</span>
          </button>
          <button
            onClick={() => setActiveTab('morphology')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'morphology'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            Grammar & Pronouns
          </button>
          <button
            onClick={() => setActiveTab('translator')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'translator'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            Live Translator
          </button>
          <button
            onClick={() => setActiveTab('script-studio')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'script-studio'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            Unicode Script Studio
          </button>
          <button
            onClick={() => setActiveTab('lexicon')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'lexicon'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            Dictionary
          </button>
          <button
            onClick={() => setActiveTab('audio-studio')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'audio-studio'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            Audio Studio
          </button>
          <button
            onClick={() => setActiveTab('dossier')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'dossier'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            Dossier & Markdown
          </button>
        </nav>

        {/* Zone 3: Primary action area with Visible Presets Slide & Blank Preset buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Create New Blank Preset Button (User requested: make create new blank preset visible) */}
          <button
            type="button"
            onClick={onCreateBlankPreset}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/70 border border-cyan-500/50 hover:bg-cyan-900/50 hover:border-cyan-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm flex items-center gap-1.5"
            title="Create a fresh blank conlang preset from scratch"
          >
            <span>➕</span>
            <span className="hidden sm:inline">New Blank Preset</span>
            <span className="sm:hidden">Blank</span>
          </button>

          {/* Open Presets Slide Drawer */}
          <button
            type="button"
            onClick={onOpenPresetsSlide}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
            title="Open Presets Slide Drawer"
          >
            <span>🏛️</span>
            <span className="hidden md:inline">Presets Slide</span>
          </button>

          <label htmlFor="preset-select" className="sr-only">
            Select Preset Language
          </label>
          <select
            id="preset-select"
            value={activeConfig.id}
            onChange={(e) => {
              const found = ALL_PRESETS.find((p) => p.id === e.target.value);
              if (found) onSelectPreset(found);
            }}
            className="hidden lg:block bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-sans"
          >
            {ALL_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.morphologyType})
              </option>
            ))}
          </select>

          <button
            onClick={onRegenerate}
            className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm shadow-cyan-400/20"
          >
            <span className="hidden sm:inline">Regen</span>
            <span className="sm:hidden">↻</span>
          </button>
        </div>
      </div>
    </header>
  );
};
