/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CustomLetter,
  CustomSyllableDefinition,
  LanguageConfig,
  PhonemeDef,
} from '../engine/types';
import { romanToIpa } from '../engine/phonology';
import { playConlangPronunciation } from '../engine/audioSynthesizer';
import { buildNativeGlyphMap, transliterateToNativeUnicode } from '../engine/scriptGenerator';

interface SyllableEditorPanelProps {
  config: LanguageConfig;
  onChangeConfig: (newConfig: LanguageConfig) => void;
}

export const SyllableEditorPanel: React.FC<SyllableEditorPanelProps> = ({
  config,
  onChangeConfig,
}) => {
  // Form input state
  const [syllableInput, setSyllableInput] = useState<string>('');
  const [ipaInput, setIpaInput] = useState<string>('');
  const [structureInput, setStructureInput] = useState<string>('CVC');
  const [meaningInput, setMeaningInput] = useState<string>('');
  const [isMandatory, setIsMandatory] = useState<boolean>(false);
  const [weight, setWeight] = useState<number>(3);
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([]);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const customSyllables: CustomSyllableDefinition[] = config.syllableConfig.customSyllables || [];

  // Build glyph map for instant native script rendering
  const glyphMap = buildNativeGlyphMap(
    config.consonantInventory,
    config.vowelInventory,
    config.scriptStyle,
    config.customLetters
  );

  // Available custom characters
  const customLetters: CustomLetter[] = config.customLetters || [];
  const customGlyphs = config.customGlyphs || [];

  // Standard vowels and consonants in active inventory
  const activeConsonants: PhonemeDef[] = config.consonantInventory || [];
  const activeVowels: PhonemeDef[] = config.vowelInventory || [];

  // Handle adding a token/character into syllable input
  const handleInsertToken = (token: string, charId?: string) => {
    setSyllableInput((prev) => prev + token);
    if (charId && !selectedCharIds.includes(charId)) {
      setSelectedCharIds((prev) => [...prev, charId]);
    }
  };

  // Auto-generate IPA when syllableInput changes if IPA input is empty or matches previous auto-gen
  const handleSyllableChange = (val: string) => {
    setSyllableInput(val);
    if (val.trim()) {
      const generatedIpa = romanToIpa(val.trim(), config);
      setIpaInput(generatedIpa);
      // Infer structure (e.g. CV, CVC, CCV)
      let struct = '';
      for (const char of val.trim()) {
        const isV = activeVowels.some((v) => v.romanization.toLowerCase() === char.toLowerCase()) ||
          ['a', 'e', 'i', 'o', 'u', 'y', 'ä', 'ö', 'ü', 'ě'].includes(char.toLowerCase());
        struct += isV ? 'V' : 'C';
      }
      if (struct) setStructureInput(struct);
    }
  };

  // Add custom syllable
  const handleAddSyllable = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = syllableInput.trim();
    if (!clean) return;

    // Check duplicate
    if (customSyllables.some((s) => s.romanization.toLowerCase() === clean.toLowerCase())) {
      setFeedback(`⚠️ Syllable "${clean}" already exists in your syllables matrix!`);
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const nativeScript = transliterateToNativeUnicode(clean, glyphMap);

    const newSyllable: CustomSyllableDefinition = {
      id: `syl-${clean.toLowerCase()}-${Date.now().toString(36)}`,
      romanization: clean,
      ipa: ipaInput.trim() || romanToIpa(clean, config),
      nativeScript,
      structure: structureInput.trim().toUpperCase() || 'CVC',
      meaningOrLore: meaningInput.trim(),
      characterIds: selectedCharIds,
      weight,
      isMandatoryRoot: isMandatory,
      createdAt: new Date().toISOString(),
    };

    const updated = [newSyllable, ...customSyllables];

    onChangeConfig({
      ...config,
      syllableConfig: {
        ...config.syllableConfig,
        customSyllables: updated,
      },
    });

    // Reset form
    setSyllableInput('');
    setIpaInput('');
    setMeaningInput('');
    setSelectedCharIds([]);
    setIsMandatory(false);
    setFeedback(`✨ Syllable "${clean}" [${newSyllable.ipa}] added to generator!`);
    setTimeout(() => setFeedback(null), 3000);
  };

  // Remove syllable
  const handleRemoveSyllable = (id: string) => {
    const updated = customSyllables.filter((s) => s.id !== id);
    onChangeConfig({
      ...config,
      syllableConfig: {
        ...config.syllableConfig,
        customSyllables: updated,
      },
    });
  };

  // Toggle mandatory root inclusion
  const handleToggleMandatory = (id: string) => {
    const updated = customSyllables.map((s) =>
      s.id === id ? { ...s, isMandatoryRoot: !s.isMandatoryRoot } : s
    );
    onChangeConfig({
      ...config,
      syllableConfig: {
        ...config.syllableConfig,
        customSyllables: updated,
      },
    });
  };

  // Filtered list
  const filteredList = customSyllables.filter((s) => {
    const q = filterQuery.toLowerCase();
    return (
      s.romanization.toLowerCase().includes(q) ||
      (s.ipa && s.ipa.toLowerCase().includes(q)) ||
      (s.structure && s.structure.toLowerCase().includes(q)) ||
      (s.meaningOrLore && s.meaningOrLore.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-sky-500/30 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold border border-sky-400/30">
              <span>🧬</span> Custom Syllable Phonotactics & Morphology
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>🎼 Syllable Studio & Custom Morpheme Editor</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Design your own syllables composed of standard inventory sounds or your unique hand-drawn Unicode characters. These custom syllables organically infuse root words, vocabulary generation, and community publications!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-black text-cyan-400 font-mono">
                {customSyllables.length}
              </div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Custom Syllables
              </div>
            </div>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute -right-8 -top-8 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Floating feedback alert */}
      {feedback && (
        <div className="p-3.5 bg-sky-950/90 border border-sky-500/50 rounded-xl text-sky-200 text-xs font-medium flex items-center justify-between animate-bounce">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="opacity-75 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Main Grid: Creator form + Syllables list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Syllable Composer */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>✍️</span> Compose New Syllable
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Combine sounds, IPA symbols, or your custom characters
                </p>
              </div>
            </div>

            <form onSubmit={handleAddSyllable} className="space-y-4">
              {/* Syllable Romanization Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Syllable Romanization *</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Live Slavic & IPA</span>
                </label>
                <input
                  type="text"
                  required
                  value={syllableInput}
                  onChange={(e) => handleSyllableChange(e.target.value)}
                  placeholder="e.g. kra, šol, đan, ʔor..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Quick Click Sound Palettes */}
              <div className="space-y-2.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                  <span>⚡ Quick-Insert Custom Characters</span>
                  <span className="text-[10px] text-indigo-400 font-mono">{customLetters.length + customGlyphs.length} available</span>
                </div>

                {customLetters.length > 0 || customGlyphs.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {customLetters.map((cl) => (
                      <button
                        key={cl.id}
                        type="button"
                        onClick={() => handleInsertToken(cl.romanization, cl.id)}
                        className="px-2 py-1 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 hover:text-white rounded-lg text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer"
                        title={`Custom Letter: ${cl.romanization} (${cl.unicodeHex})`}
                      >
                        <span className="font-bold">{cl.romanization}</span>
                        <span className="text-[9px] text-indigo-400 font-mono">{cl.unicodeHex}</span>
                      </button>
                    ))}

                    {customGlyphs.map((cg) => (
                      <button
                        key={cg.id}
                        type="button"
                        onClick={() => handleInsertToken(cg.romanization, cg.id)}
                        className="px-2 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-white rounded-lg text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer"
                        title={`Custom Drawn Glyph: ${cg.name || cg.romanization}`}
                      >
                        <span className="font-bold">{cg.glyphChar || cg.romanization}</span>
                        <span className="text-[9px] text-cyan-400">{cg.romanization}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    No custom characters created yet. You can build custom glyphs in the <strong>Character Maker</strong> tab!
                  </p>
                )}

                {/* Quick Insert Common Inventory Sounds */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[10px] text-slate-400 font-semibold mb-1">Active Consonants & Slavic Diacritics</div>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                    {activeConsonants.map((c) => (
                      <button
                        key={c.romanization}
                        type="button"
                        onClick={() => handleInsertToken(c.romanization)}
                        className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded text-[11px] font-mono cursor-pointer"
                      >
                        {c.romanization}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-1">
                  <div className="text-[10px] text-slate-400 font-semibold mb-1">Active Vowels</div>
                  <div className="flex flex-wrap gap-1">
                    {activeVowels.map((v) => (
                      <button
                        key={v.romanization}
                        type="button"
                        onClick={() => handleInsertToken(v.romanization)}
                        className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-300 hover:text-white rounded text-[11px] font-mono cursor-pointer"
                      >
                        {v.romanization}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* IPA & Structure Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    IPA Pronunciation
                  </label>
                  <input
                    type="text"
                    value={ipaInput}
                    onChange={(e) => setIpaInput(e.target.value)}
                    placeholder="e.g. kɾa, vɛl..."
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Template Structure
                  </label>
                  <input
                    type="text"
                    value={structureInput}
                    onChange={(e) => setStructureInput(e.target.value.toUpperCase())}
                    placeholder="e.g. CCV, CVC, V..."
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Lore & Meaning */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Linguistic Meaning or Lore (Optional)
                </label>
                <input
                  type="text"
                  value={meaningInput}
                  onChange={(e) => setMeaningInput(e.target.value)}
                  placeholder="e.g. Sacred spirit prefix, ancient mountain root..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Weight & Mandatory Root */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium">
                  <input
                    type="checkbox"
                    checked={isMandatory}
                    onChange={(e) => setIsMandatory(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500/20 bg-slate-900"
                  />
                  <span>Mandatory Root Component</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Frequency Weight:</span>
                  <select
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 font-mono"
                  >
                    <option value={1}>1 (Rare)</option>
                    <option value={2}>2 (Moderate)</option>
                    <option value={3}>3 (Standard)</option>
                    <option value={4}>4 (Frequent)</option>
                    <option value={5}>5 (Dominant)</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>➕ Add Syllable to Language</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Custom Syllables Matrix / Library */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🏛️</span> Active Custom Syllables Matrix
                </h2>
                <p className="text-xs text-slate-400">
                  Infused into roots, dictionary synthesis, and community publishing
                </p>
              </div>

              {/* Search filter */}
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="🔍 Filter syllables..."
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-full sm:w-48"
              />
            </div>

            {filteredList.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/50 rounded-xl border border-slate-800/80 p-6 space-y-2">
                <span className="text-3xl">🎼</span>
                <h4 className="text-sm font-bold text-slate-300">No Custom Syllables Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {filterQuery ? 'No syllables match your search filter.' : 'Use the composer on the left to add your first custom syllables with your unique sounds and custom characters!'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[550px] overflow-y-auto pr-1">
                {filteredList.map((item) => {
                  const renderedScript = item.nativeScript || transliterateToNativeUnicode(item.romanization, glyphMap);
                  return (
                    <div
                      key={item.id}
                      className="bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 transition-all duration-200 space-y-3 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-base font-bold text-white font-mono group-hover:text-cyan-300 transition-colors">
                              {item.romanization}
                            </span>
                            <span className="text-xs text-emerald-400 font-mono">
                              [{item.ipa || romanToIpa(item.romanization, config)}]
                            </span>
                          </div>
                          <div className="text-lg text-cyan-400 font-mono tracking-wider mt-0.5">
                            {renderedScript}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              const ipa = item.ipa || romanToIpa(item.romanization, config);
                              playConlangPronunciation(item.romanization, ipa, {
                                customLetters: config.customLetters,
                              });
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                            title="Listen to syllable pronunciation"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => handleRemoveSyllable(item.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete syllable"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {item.meaningOrLore && (
                        <p className="text-xs text-slate-300 italic border-l-2 border-slate-700 pl-2">
                          "{item.meaningOrLore}"
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-sky-300 font-mono">
                          {item.structure || 'CVC'}
                        </span>

                        <button
                          onClick={() => handleToggleMandatory(item.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                            item.isMandatoryRoot
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                          }`}
                          title="Toggle mandatory injection in root synthesis"
                        >
                          {item.isMandatoryRoot ? '★ Mandatory Root' : '☆ Optional Root'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
