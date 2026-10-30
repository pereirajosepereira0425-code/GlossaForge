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
  // 15-second visual auto-save props
  autoSaveStatus: {
    lastSavedAt: Date | null;
    secondsUntilNext: number;
    isSaving: boolean;
    saveCount: number;
    saveNow: () => void;
  };
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeConfig,
  onSelectPreset,
  onRegenerate,
  onOpenPresetsSlide,
  onCreateBlankPreset,
  autoSaveStatus,
}) => {
  const { lastSavedAt, secondsUntilNext, isSaving, saveNow } = autoSaveStatus;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-slate-800/80 px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Wordmark & Live Auto-save badge */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('parameters');
            }}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-cyan-400 transition-colors flex items-center gap-1.5"
          >
            <span className="text-xl">✨</span>
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent font-black">
              GlossaForge
            </span>
          </a>

          {/* 15-Second Visual Auto-Save Status Pill */}
          <div
            onClick={saveNow}
            title={`Auto-saving every 15s. Click to force save now. Last saved: ${
              lastSavedAt ? lastSavedAt.toLocaleTimeString() : 'Pending initial save'
            }`}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 hover:border-cyan-500/60 transition-all cursor-pointer text-[11px] group"
          >
            {isSaving ? (
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Saving...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-slate-400 group-hover:text-slate-200">
                  💾 {lastSavedAt ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Auto-saving'}
                </span>
                <span className="text-[10px] font-mono text-cyan-400/90 bg-cyan-950/70 px-1.5 py-0.2 rounded border border-cyan-800/60">
                  {secondsUntilNext}s
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Zone 2: Navigation tabs including Community Vault */}
        <nav className="hidden md:flex items-center gap-4 text-xs lg:text-sm font-medium text-slate-400 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setActiveTab('parameters')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'parameters'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            Parameters
          </button>
          <button
            onClick={() => setActiveTab('phonology')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'phonology'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            Phonology
          </button>
          <button
            onClick={() => setActiveTab('syllables')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 flex items-center gap-1 ${
              activeTab === 'syllables'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
            title="Compose and edit custom syllables using standard and custom characters"
          >
            <span>🎼</span>
            <span>Syllable Editor</span>
          </button>
          <button
            onClick={() => setActiveTab('character-maker')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 flex items-center gap-1 ${
              activeTab === 'character-maker'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
            title="Design and paint custom Unicode characters"
          >
            <span>🔣</span>
            <span>Character Maker</span>
          </button>
          <button
            onClick={() => setActiveTab('morphology')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'morphology'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            Grammar
          </button>
          <button
            onClick={() => setActiveTab('translator')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'translator'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            Translator
          </button>
          <button
            onClick={() => setActiveTab('script-studio')}
            className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'script-studio'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            Script Studio
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
            Dossier
          </button>

          {/* Community Vault Navigation Tab */}
          <button
            onClick={() => setActiveTab('community-vault')}
            className={`transition-all whitespace-nowrap shrink-0 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'community-vault'
                ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/30 text-cyan-300 border border-cyan-400/50 shadow-sm shadow-cyan-500/20'
                : 'text-indigo-300/80 hover:text-indigo-200 hover:bg-indigo-950/40 border border-indigo-500/20'
            }`}
            title="Browse, use, and post community languages"
          >
            <span>🌐</span>
            <span>Community Vault</span>
          </button>
        </nav>

        {/* Zone 3: Primary action area */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Post to Community Fast Action Button */}
          <button
            type="button"
            onClick={() => setActiveTab('community-vault')}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-500/50 hover:bg-indigo-900/60 hover:border-indigo-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm flex items-center gap-1"
            title="Share language with community"
          >
            <span>🚀</span>
            <span className="hidden sm:inline">Post Lang</span>
          </button>

          {/* Create New Blank Preset Button */}
          <button
            type="button"
            onClick={onCreateBlankPreset}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/70 border border-cyan-500/50 hover:bg-cyan-900/50 hover:border-cyan-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm flex items-center gap-1.5"
            title="Create a fresh blank conlang preset from scratch"
          >
            <span>➕</span>
            <span className="hidden xl:inline">New Blank</span>
          </button>

          {/* Open Presets Slide Drawer */}
          <button
            type="button"
            onClick={onOpenPresetsSlide}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
            title="Open Presets Slide Drawer"
          >
            <span>🏛️</span>
            <span className="hidden lg:inline">Presets</span>
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
            className="hidden 2xl:block bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-sans"
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

      {/* Mobile Auto-save indicator strip */}
      <div className="sm:hidden mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>{isSaving ? 'Saving...' : `💾 Auto-save in ${secondsUntilNext}s`}</span>
        </div>
        <button
          onClick={saveNow}
          className="text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
        >
          Save Now
        </button>
      </div>
    </header>
  );
};
