/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LanguageConfig, PhonemeDef, SoundLawRule } from '../engine/types';
import { STANDARD_IPA_CONSONANTS, STANDARD_IPA_VOWELS } from '../engine/phonology';
import { playConlangPronunciation } from '../engine/audioSynthesizer';

interface PhonologyPanelProps {
  config: LanguageConfig;
  onChangeConfig: (newConfig: LanguageConfig) => void;
}

export const PhonologyPanel: React.FC<PhonologyPanelProps> = ({
  config,
  onChangeConfig,
}) => {
  const [newTemplate, setNewTemplate] = useState('CVCC');
  const [newBanned, setNewBanned] = useState('');
  const [newSoundLawPattern, setNewSoundLawPattern] = useState('');
  const [newSoundLawReplacement, setNewSoundLawReplacement] = useState('');
  const [newSoundLawDesc, setNewSoundLawDesc] = useState('');
  const [playingSymbol, setPlayingSymbol] = useState<string | null>(null);

  const toggleConsonant = (phoneme: PhonemeDef) => {
    const exists = config.consonantInventory.some((p) => p.romanization === phoneme.romanization);
    let updated: PhonemeDef[];
    if (exists) {
      updated = config.consonantInventory.filter((p) => p.romanization !== phoneme.romanization);
    } else {
      updated = [...config.consonantInventory, phoneme];
    }
    onChangeConfig({
      ...config,
      consonantInventory: updated,
    });
  };

  const toggleVowel = (phoneme: PhonemeDef) => {
    const exists = config.vowelInventory.some((p) => p.romanization === phoneme.romanization);
    let updated: PhonemeDef[];
    if (exists) {
      updated = config.vowelInventory.filter((p) => p.romanization !== phoneme.romanization);
    } else {
      updated = [...config.vowelInventory, phoneme];
    }
    onChangeConfig({
      ...config,
      vowelInventory: updated,
    });
  };

  const handleAddTemplate = () => {
    if (!newTemplate.trim()) return;
    const clean = newTemplate.trim().toUpperCase();
    if (!config.syllableConfig.templates.includes(clean)) {
      onChangeConfig({
        ...config,
        syllableConfig: {
          ...config.syllableConfig,
          templates: [...config.syllableConfig.templates, clean],
        },
      });
      setNewTemplate('');
    }
  };

  const handleRemoveTemplate = (template: string) => {
    onChangeConfig({
      ...config,
      syllableConfig: {
        ...config.syllableConfig,
        templates: config.syllableConfig.templates.filter((t) => t !== template),
      },
    });
  };

  const handleAddBanned = () => {
    if (!newBanned.trim()) return;
    const clean = newBanned.trim();
    if (!config.bannedSequences.includes(clean)) {
      onChangeConfig({
        ...config,
        bannedSequences: [...config.bannedSequences, clean],
      });
      setNewBanned('');
    }
  };

  const handleRemoveBanned = (seq: string) => {
    onChangeConfig({
      ...config,
      bannedSequences: config.bannedSequences.filter((s) => s !== seq),
    });
  };

  const handleAddSoundLaw = () => {
    if (!newSoundLawPattern.trim()) return;
    const law: SoundLawRule = {
      id: `sl-${Date.now()}`,
      pattern: newSoundLawPattern.trim(),
      replacement: newSoundLawReplacement.trim(),
      description: newSoundLawDesc.trim() || `${newSoundLawPattern} → ${newSoundLawReplacement}`,
    };
    onChangeConfig({
      ...config,
      soundLaws: [...config.soundLaws, law],
    });
    setNewSoundLawPattern('');
    setNewSoundLawReplacement('');
    setNewSoundLawDesc('');
  };

  const handleRemoveSoundLaw = (id: string) => {
    onChangeConfig({
      ...config,
      soundLaws: config.soundLaws.filter((l) => l.id !== id),
    });
  };

  const playSound = (roman: string, ipa: string, audioUrl?: string) => {
    setPlayingSymbol(roman);
    if (audioUrl) {
      import('../engine/audioSynthesizer').then(({ playAudioDataUrl }) => {
        playAudioDataUrl(audioUrl, undefined, () => setPlayingSymbol(null));
      });
      return;
    }
    playConlangPronunciation(roman, ipa, {
      customLetters: config.customLetters,
      onEnd: () => setPlayingSymbol(null),
    });
  };

  return (
    <div className="space-y-8">
      {/* Slavic Romanization & Diacritic Orthography Conventions Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Phonology & Orthography</span>
            <span aria-hidden="true">·</span>
            <span>Slavic Diacritic & Glottal Standard</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Slavic-Inspired Romanization & IPA Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic mapping of complex IPA phonemes to clean Slavic orthography and explicit apostrophes (ʼ)
          </p>
        </div>

        {/* Orthography key cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-2 font-mono text-center">
          {[
            { roman: 'š', ipa: '/ʃ/', desc: 'Voiceless postalveolar fricative' },
            { roman: 'č', ipa: '/tʃ/', desc: 'Voiceless postalveolar affricate' },
            { roman: 'ž', ipa: '/ʒ/', desc: 'Voiced postalveolar fricative' },
            { roman: 'ć', ipa: '/tɕ/', desc: 'Voiceless alveolo-palatal affricate' },
            { roman: 'đ', ipa: '/dʑ/', desc: 'Voiced alveolo-palatal affricate' },
            { roman: 'ř', ipa: '/r̝/', desc: 'Alveolar fricative trill' },
            { roman: 'ň', ipa: '/ɲ/', desc: 'Palatal nasal' },
            { roman: 'ľ', ipa: '/ʎ/', desc: 'Palatal lateral approximant' },
            { roman: 'y', ipa: '/ɨ/', desc: 'Close central unrounded vowel' },
            { roman: "'", ipa: '/ʔ/', desc: 'Glottal stop / ejective boundary' },
          ].map((item) => (
            <div
              key={item.roman}
              onClick={() => playSound(item.roman, item.ipa)}
              className="bg-slate-950 border border-slate-800 hover:border-cyan-500/60 p-2.5 rounded-lg transition-all cursor-pointer group"
              title={`${item.desc} (Click to play)`}
            >
              <div className="text-base font-bold text-cyan-300 group-hover:scale-110 transition-transform">
                {item.roman}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{item.ipa}</div>
            </div>
          ))}

          {/* User's Custom Registered Characters */}
          {config.customLetters.map((cl) => {
            const displayIpa = cl.ipa || cl.ipaSymbol || cl.romanization;
            return (
              <div
                key={cl.id}
                onClick={() => playSound(cl.romanization, displayIpa, cl.audioDataUrl)}
                className="bg-cyan-950/40 border border-cyan-500/60 hover:border-cyan-400 p-2.5 rounded-lg transition-all cursor-pointer group shadow-sm shadow-cyan-500/10"
                title={`Custom Letter: ${cl.romanization} ${displayIpa} (${cl.unicodeHex})${cl.audioDataUrl ? ' [Has Recorded Audio]' : ''} - Click to play`}
              >
                <div className="text-base font-bold text-cyan-300 group-hover:scale-110 transition-transform">
                  {cl.romanization}
                </div>
                <div className="text-xs text-amber-300 mt-0.5">{displayIpa}</div>
                <div className="text-[9px] text-cyan-400 font-sans mt-0.5">
                  {cl.audioDataUrl ? 'Audio' : 'Custom'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Consonant IPA Inventory */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-semibold text-white">Consonant Inventory (IPA)</h3>
              <p className="text-xs text-slate-400">Click to toggle phonemes active in the language</p>
            </div>
            <div className="text-xs font-mono text-cyan-400">
              Active: {config.consonantInventory.length}
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {STANDARD_IPA_CONSONANTS.map((c) => {
              const isActive = config.consonantInventory.some((p) => p.romanization === c.romanization);
              return (
                <button
                  key={c.symbol + c.romanization}
                  onClick={() => toggleConsonant(c)}
                  className={`p-2 rounded-lg border text-center transition-all cursor-pointer font-mono ${
                    isActive
                      ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-600 hover:border-slate-700'
                  }`}
                  title={`${c.manner} ${c.place} [${c.symbol}] → "${c.romanization}"`}
                >
                  <div className="text-sm font-bold">{c.romanization}</div>
                  <div className="text-[10px] text-slate-400">/{c.symbol}/</div>
                </button>
              );
            })}

            {/* Custom Consonants */}
            {config.consonantInventory
              .filter((c) => c.isCustom || !STANDARD_IPA_CONSONANTS.some((sc) => sc.romanization === c.romanization))
              .map((c) => (
                <button
                  key={c.romanization + '-custom'}
                  onClick={() => toggleConsonant(c)}
                  className="p-2 rounded-lg border text-center transition-all cursor-pointer font-mono bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-400/20"
                  title={`Custom Consonant: ${c.romanization} /${c.symbol}/`}
                >
                  <div className="text-sm font-bold">{c.romanization}</div>
                  <div className="text-[10px] text-amber-300">/{c.symbol}/</div>
                  <div className="text-[8px] text-cyan-300 font-sans">Custom</div>
                </button>
              ))}
          </div>
        </div>

        {/* Vowel IPA Inventory */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-semibold text-white">Vowel System (IPA Trapezoid)</h3>
              <p className="text-xs text-slate-400">Click to toggle vowel phonemes active</p>
            </div>
            <div className="text-xs font-mono text-indigo-400">
              Active: {config.vowelInventory.length}
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {STANDARD_IPA_VOWELS.map((v) => {
              const isActive = config.vowelInventory.some((p) => p.romanization === v.romanization);
              return (
                <button
                  key={v.symbol + v.romanization}
                  onClick={() => toggleVowel(v)}
                  className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer font-mono ${
                    isActive
                      ? 'bg-indigo-950/40 border-indigo-500 text-indigo-200 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-600 hover:border-slate-700'
                  }`}
                  title={`${v.height} ${v.backness} [${v.symbol}] → "${v.romanization}"`}
                >
                  <div className="text-base font-bold">{v.romanization}</div>
                  <div className="text-[11px] text-slate-400">/{v.symbol}/</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{v.backness}</div>
                </button>
              );
            })}

            {/* Custom Vowels */}
            {config.vowelInventory
              .filter((v) => v.isCustom || !STANDARD_IPA_VOWELS.some((sv) => sv.romanization === v.romanization))
              .map((v) => (
                <button
                  key={v.romanization + '-custom'}
                  onClick={() => toggleVowel(v)}
                  className="p-2.5 rounded-lg border text-center transition-all cursor-pointer font-mono bg-indigo-950/60 border-indigo-400 text-indigo-200 shadow-sm shadow-indigo-400/20"
                  title={`Custom Vowel: ${v.romanization} /${v.symbol}/`}
                >
                  <div className="text-base font-bold">{v.romanization}</div>
                  <div className="text-[11px] text-amber-300">/{v.symbol}/</div>
                  <div className="text-[8px] text-indigo-300 font-sans">Custom</div>
                </button>
              ))}
          </div>

          <div className="pt-4 border-t border-slate-800">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Vowel Harmony Configuration
            </label>
            <select
              value={config.syllableConfig.vowelHarmony}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  syllableConfig: {
                    ...config.syllableConfig,
                    vowelHarmony: e.target.value as 'none' | 'front-back' | 'height',
                  },
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="none">None (Free vowel co-occurrence)</option>
              <option value="front-back">Front-Back Vowel Harmony (Turkic/Uralic style)</option>
              <option value="height">Height Harmony (High vs Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Syllable Structure & Sound Laws */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Phonotactic Syllable Templates */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-semibold text-white">Syllable Phonotactics & Templates</h3>
            <p className="text-xs text-slate-400">Allowable consonant-vowel syllable permutations</p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {config.syllableConfig.templates.map((tpl) => (
                <div
                  key={tpl}
                  className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-300"
                >
                  <span>{tpl}</span>
                  <button
                    onClick={() => handleRemoveTemplate(tpl)}
                    className="text-slate-500 hover:text-rose-400 text-xs font-sans"
                    title="Remove template"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newTemplate}
                onChange={(e) => setNewTemplate(e.target.value)}
                placeholder="e.g. CCVCC or CV"
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 w-36 uppercase"
              />
              <button
                type="button"
                onClick={handleAddTemplate}
                className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
              >
                Add Template
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Max Onset Consonants: {config.syllableConfig.maxOnsetConsonants}
                </label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  value={config.syllableConfig.maxOnsetConsonants}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      syllableConfig: {
                        ...config.syllableConfig,
                        maxOnsetConsonants: parseInt(e.target.value, 10),
                      },
                    })
                  }
                  className="w-full accent-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Max Coda Consonants: {config.syllableConfig.maxCodaConsonants}
                </label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  value={config.syllableConfig.maxCodaConsonants}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      syllableConfig: {
                        ...config.syllableConfig,
                        maxCodaConsonants: parseInt(e.target.value, 10),
                      },
                    })
                  }
                  className="w-full accent-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="allow-geminates"
                checked={config.syllableConfig.allowGeminates}
                onChange={(e) =>
                  onChangeConfig({
                    ...config,
                    syllableConfig: {
                      ...config.syllableConfig,
                      allowGeminates: e.target.checked,
                    },
                  })
                }
                className="accent-cyan-400 rounded"
              />
              <label htmlFor="allow-geminates" className="text-xs text-slate-300">
                Allow Geminate Consonants (e.g. kk, tt, mm)
              </label>
            </div>
          </div>
        </div>

        {/* Sound Laws & Banned Combinations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-semibold text-white">Sound Laws & Illegal Combinations</h3>
            <p className="text-xs text-slate-400">Strict transformations and prohibited phoneme n-grams</p>
          </div>

          {/* Banned Sequences */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Banned Phoneme Sequences
            </label>
            <div className="flex flex-wrap gap-2">
              {config.bannedSequences.map((seq) => (
                <div
                  key={seq}
                  className="flex items-center gap-2 bg-rose-950/40 border border-rose-900/60 px-2.5 py-1 rounded text-xs font-mono text-rose-300"
                >
                  <span>/{seq}/</span>
                  <button
                    onClick={() => handleRemoveBanned(seq)}
                    className="text-rose-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newBanned}
                onChange={(e) => setNewBanned(e.target.value)}
                placeholder="e.g. ii, uu, ks"
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 w-36"
              />
              <button
                type="button"
                onClick={handleAddBanned}
                className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
              >
                Ban Sequence
              </button>
            </div>
          </div>

          {/* Sound Laws List */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Active Sound Laws (Historical / Morphophonemic Shifts)
            </label>
            <div className="space-y-1.5">
              {config.soundLaws.map((law) => (
                <div
                  key={law.id}
                  className="flex items-center justify-between bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-xs font-mono text-slate-300"
                >
                  <div>
                    <span className="text-cyan-400">{law.pattern}</span> →{' '}
                    <span className="text-emerald-400">{law.replacement}</span>
                    <span className="text-slate-500 ml-2 font-sans">({law.description})</span>
                  </div>
                  <button
                    onClick={() => handleRemoveSoundLaw(law.id)}
                    className="text-slate-500 hover:text-rose-400 font-sans"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <input
                type="text"
                value={newSoundLawPattern}
                onChange={(e) => setNewSoundLawPattern(e.target.value)}
                placeholder="Pattern (regex)"
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                value={newSoundLawReplacement}
                onChange={(e) => setNewSoundLawReplacement(e.target.value)}
                placeholder="Replacement"
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                value={newSoundLawDesc}
                onChange={(e) => setNewSoundLawDesc(e.target.value)}
                placeholder="Rule description"
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              type="button"
              onClick={handleAddSoundLaw}
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
            >
              Add Sound Law
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
