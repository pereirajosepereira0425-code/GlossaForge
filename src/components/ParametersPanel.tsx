/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  GeometricMorphology,
  LanguageConfig,
  LinearVector,
  MorphologicalType,
  PartOfSpeech,
  StressRule,
  WordOrder,
} from '../engine/types';
import {
  extractPhonologicalRulesFromOverrides,
  parseCustomVocabularyOverrides,
} from '../engine/lexicon';
import { GeometricVisualizer } from './GeometricVisualizer';

interface ParametersPanelProps {
  config: LanguageConfig;
  onChangeConfig: (newConfig: LanguageConfig) => void;
  sampleWord?: string;
  sampleSyllables?: string[];
  onOpenPresetsSlide?: () => void;
  onCreateBlankPreset?: () => void;
}

export const ParametersPanel: React.FC<ParametersPanelProps> = ({
  config,
  onChangeConfig,
  sampleWord = "rath'mor",
  sampleSyllables = ['rath', 'mor'],
  onOpenPresetsSlide,
  onCreateBlankPreset,
}) => {
  const [overrideText, setOverrideText] = useState<string>(() =>
    config.customOverrides
      .map((o) => `${o.english} : ${o.pos} = ${o.conlang}`)
      .join('\n')
  );

  const [conditionalPos, setConditionalPos] = useState<PartOfSpeech>('v');
  const [conditionalClass, setConditionalClass] = useState<'plosive' | 'fricative' | 'nasal' | 'vowel' | 'any'>('plosive');
  const [prohibitedInput, setProhibitedInput] = useState<string>(
    config.initialConstraints.prohibitedStartingSounds.join(', ')
  );
  const [requiredInput, setRequiredInput] = useState<string>(
    config.initialConstraints.requiredStartingSounds.join(', ')
  );

  // Extracted rules preview
  const extractedRules = extractPhonologicalRulesFromOverrides(config.customOverrides);

  const handleUpdateOverrides = (text: string) => {
    setOverrideText(text);
    const parsed = parseCustomVocabularyOverrides(text);
    onChangeConfig({
      ...config,
      customOverrides: parsed,
    });
  };

  /**
   * Paste copied overrides from clipboard and ADD to existing overrides list (never replace)
   */
  const handlePasteOverrides = async () => {
    try {
      let clipText = '';
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        clipText = await navigator.clipboard.readText();
      }
      if (!clipText.trim()) return;

      const next = overrideText.trim()
        ? `${overrideText.trim()}\n${clipText.trim()}`
        : clipText.trim();
      handleUpdateOverrides(next);
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  const handleUpdateProhibited = (val: string) => {
    setProhibitedInput(val);
    const list = val.split(',').map((s) => s.trim()).filter(Boolean);
    onChangeConfig({
      ...config,
      initialConstraints: {
        ...config.initialConstraints,
        prohibitedStartingSounds: list,
      },
    });
  };

  const handleUpdateRequired = (val: string) => {
    setRequiredInput(val);
    const list = val.split(',').map((s) => s.trim()).filter(Boolean);
    onChangeConfig({
      ...config,
      initialConstraints: {
        ...config.initialConstraints,
        requiredStartingSounds: list,
      },
    });
  };

  const handleAddConditionalConstraint = () => {
    const newConstraint = {
      pos: conditionalPos,
      requiredClass: conditionalClass,
      description: `Words with POS [${conditionalPos}] must begin with a ${conditionalClass}`,
    };
    onChangeConfig({
      ...config,
      initialConstraints: {
        ...config.initialConstraints,
        conditionalConstraints: [
          ...config.initialConstraints.conditionalConstraints.filter(
            (c) => c.pos !== conditionalPos
          ),
          newConstraint,
        ],
      },
    });
  };

  const handleRemoveConditional = (pos: PartOfSpeech) => {
    onChangeConfig({
      ...config,
      initialConstraints: {
        ...config.initialConstraints,
        conditionalConstraints: config.initialConstraints.conditionalConstraints.filter(
          (c) => c.pos !== pos
        ),
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Title & Metadata Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>Linguistic Engine Configuration</span>
              <span aria-hidden="true">·</span>
              <span>Architecture v2.6</span>
              <span aria-hidden="true">·</span>
              <span className="text-cyan-400 font-mono">{config.morphologyType}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                {config.name}
              </h1>
              {config.id === 'blank-canvas' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Blank Canvas Mode
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1 italic">{config.motto}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
            {onCreateBlankPreset && (
              <button
                type="button"
                onClick={onCreateBlankPreset}
                className="px-3 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-cyan-400/20"
                title="Create an unpopulated blank language template"
              >
                <span>➕ Create New Blank Preset</span>
              </button>
            )}
            {onOpenPresetsSlide && (
              <button
                type="button"
                onClick={onOpenPresetsSlide}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open presets slide drawer"
              >
                <span>🏛️ Presets Slide</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-300 mt-4 leading-relaxed">
          {config.description}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: Word Origins & Initial Constraints */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-semibold text-white">
              01. Word Origins & Initial Constraints
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict mathematical boundaries dictating which sounds initiate root words
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Prohibited Starting Tokens (Comma-separated)
              </label>
              <input
                type="text"
                value={prohibitedInput}
                onChange={(e) => handleUpdateProhibited(e.target.value)}
                placeholder="e.g. ng, v, j, ʔ"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              {config.customLetters.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-400">Insert Custom:</span>
                  {config.customLetters.map((cl) => (
                    <button
                      key={cl.id}
                      type="button"
                      onClick={() => {
                        const next = prohibitedInput ? `${prohibitedInput}, ${cl.romanization}` : cl.romanization;
                        handleUpdateProhibited(next);
                      }}
                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[10px] font-mono border border-slate-700 transition-colors"
                      title={`Add ${cl.romanization} to prohibited starting sounds`}
                    >
                      +{cl.romanization}
                    </button>
                  ))}
                </div>
              )}
              <span className="text-[11px] text-slate-500 mt-1 block">
                Words generated by the engine are strictly forbidden from initiating with these sounds.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Required / Mandated Starting Onsets (Optional)
              </label>
              <input
                type="text"
                value={requiredInput}
                onChange={(e) => handleUpdateRequired(e.target.value)}
                placeholder="Leave empty for unconstrained, or specify e.g. p, t, k, r"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              {config.customLetters.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-400">Insert Custom:</span>
                  {config.customLetters.map((cl) => (
                    <button
                      key={cl.id}
                      type="button"
                      onClick={() => {
                        const next = requiredInput ? `${requiredInput}, ${cl.romanization}` : cl.romanization;
                        handleUpdateRequired(next);
                      }}
                      className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[10px] font-mono border border-slate-700 transition-colors"
                      title={`Add ${cl.romanization} to required starting onsets`}
                    >
                      +{cl.romanization}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Conditional Constraints */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Conditional Constraint: Part of Speech Sound Class Mandate
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">If POS is</span>
                <select
                  value={conditionalPos}
                  onChange={(e) => setConditionalPos(e.target.value as PartOfSpeech)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded px-2 py-1"
                >
                  <option value="v">Verb (v)</option>
                  <option value="n">Noun (n)</option>
                  <option value="adj">Adjective (adj)</option>
                </select>
                <span className="text-xs text-slate-400">must start with</span>
                <select
                  value={conditionalClass}
                  onChange={(e) =>
                    setConditionalClass(
                      e.target.value as 'plosive' | 'fricative' | 'nasal' | 'vowel' | 'any'
                    )
                  }
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded px-2 py-1"
                >
                  <option value="plosive">Plosive Stop [p, t, k, b, d, g, ʔ]</option>
                  <option value="fricative">Fricative [s, z, š, ž, x, h]</option>
                  <option value="nasal">Nasal [m, n, ň]</option>
                  <option value="vowel">Vowel [a, e, i, o, u, y]</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddConditionalConstraint}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded transition-colors"
                >
                  Set Rule
                </button>
              </div>

              {/* Active list */}
              <div className="mt-3 space-y-1.5">
                {config.initialConstraints.conditionalConstraints.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded text-xs text-slate-300 font-mono"
                  >
                    <span>
                      POS <strong className="text-cyan-400">[{c.pos}]</strong> → starts with{' '}
                      <strong className="text-emerald-400">{c.requiredClass}</strong>
                    </span>
                    <button
                      onClick={() => handleRemoveConditional(c.pos)}
                      className="text-slate-500 hover:text-rose-400 transition-colors text-xs font-sans"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Directionality & Geometric Word Construction */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-semibold text-white">
              02. Directionality & Geometric Word Construction
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Vector weight accumulation and diagonal matrix phoneme mapping
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Linear Vector Trajectory
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'ltr-accumulation', label: 'LTR Accumulation', desc: 'Weight builds to right coda' },
                  { id: 'rtl-reduction', label: 'RTL Reduction', desc: 'Softens toward coda ending' },
                  { id: 'balanced-centering', label: 'Balanced Centering', desc: 'Central nucleus peak' },
                ].map((vec) => (
                  <button
                    key={vec.id}
                    type="button"
                    onClick={() =>
                      onChangeConfig({
                        ...config,
                        linearVector: vec.id as LinearVector,
                      })
                    }
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      config.linearVector === vec.id
                        ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-medium">{vec.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{vec.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Diagonal / Geometric Morphology Matrix
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'none', label: 'Standard Linear', desc: 'Standard syllable chaining' },
                  { id: 'diagonal-matrix', label: 'Diagonal Matrix', desc: 'Vowels step diagonally across C-matrix' },
                  { id: 'mirror-back-front', label: 'Mirror Back-Front', desc: 'Mirrored codas & affixes' },
                ].map((geom) => (
                  <button
                    key={geom.id}
                    type="button"
                    onClick={() =>
                      onChangeConfig({
                        ...config,
                        geometricMorphology: geom.id as GeometricMorphology,
                      })
                    }
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      config.geometricMorphology === geom.id
                        ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-medium">{geom.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{geom.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Interactive Geometric Matrix Display */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Matrix Topology Inspector
              </label>
              <GeometricVisualizer
                sampleWord={sampleWord}
                syllables={sampleSyllables}
                geometricMorphology={config.geometricMorphology}
                linearVector={config.linearVector}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Custom Vocabulary & Direct Overrides */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-semibold text-white">
              03. Custom Vocabulary Overrides & Organic Rule Extraction
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Preserve exact custom conlang words and extract phonological rules to organically shape generator
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Active Overrides: <span className="text-cyan-400 font-bold">{config.customOverrides.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-300">
                Custom Overrides Editor (Format: <code className="text-cyan-400">English : POS = Conlang</code>)
              </label>
              <button
                type="button"
                onClick={handlePasteOverrides}
                className="px-2 py-0.5 text-xs bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/80 rounded font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-xs active:scale-95"
                title="Paste from clipboard and add to custom overrides without replacing"
              >
                <span>📋 Paste (Add)</span>
              </button>
            </div>
            <textarea
              rows={6}
              value={overrideText}
              onChange={(e) => handleUpdateOverrides(e.target.value)}
              placeholder="king : n = rath'mor&#10;sword : n = kret'va&#10;conquer : v = kret'za"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed resize-y"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Example: <code className="text-slate-400">king : n = rath'mor</code></span>
              <span>Diacritics: š, č, ž, ć, đ, ř, ň, ľ, apostrophe '</span>
            </div>
          </div>

          {/* Extracted Phonological Rules Inspector */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3 font-mono text-xs">
            <div className="text-slate-300 font-semibold font-sans text-xs border-b border-slate-800 pb-2">
              Extracted Phonological Patterns
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">Frequent Onset Clusters:</div>
              <div className="text-cyan-300 font-bold mt-0.5">
                {extractedRules.frequentOnsets.length > 0
                  ? extractedRules.frequentOnsets.join(', ')
                  : 'Derived from global inventory'}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">Dominant Vowel Qualities:</div>
              <div className="text-indigo-300 font-bold mt-0.5">
                {extractedRules.frequentVowels.length > 0
                  ? extractedRules.frequentVowels.join(', ')
                  : 'Balanced harmonic'}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">Glottal Apostrophe Density:</div>
              <div className="text-amber-300 font-bold mt-0.5">
                {(extractedRules.glottalFrequency * 100).toFixed(1)}% of overrides
              </div>
            </div>
            <div className="text-[11px] text-slate-400 font-sans pt-1">
              The generator applies these extracted patterns to weight procedural roots for stylistic consistency.
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Typological Mechanics & Syntax */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-semibold text-white">
            04. Typology & Syntactic Architecture
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure universal sentence structure, word order, and morphological classification
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Morphological Type
            </label>
            <select
              value={config.morphologyType}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  morphologyType: e.target.value as MorphologicalType,
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
            >
              <option value="agglutinative">Agglutinative (Bound discrete affixes)</option>
              <option value="fusional">Fusional (Portmanteau inflections)</option>
              <option value="polysynthetic">Polysynthetic (Sentence-words)</option>
              <option value="isolating">Isolating (Free particle morphemes)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Word Order Typology
            </label>
            <select
              value={config.wordOrder}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  wordOrder: e.target.value as WordOrder,
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="SOV">SOV (Subject-Object-Verb)</option>
              <option value="SVO">SVO (Subject-Verb-Object)</option>
              <option value="VSO">VSO (Verb-Subject-Object)</option>
              <option value="VOS">VOS (Verb-Object-Subject)</option>
              <option value="OVS">OVS (Object-Verb-Subject)</option>
              <option value="OSV">OSV (Object-Subject-Verb)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Modifier Direction
            </label>
            <select
              value={config.headDirection}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  headDirection: e.target.value as 'head-initial' | 'head-final',
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
            >
              <option value="head-final">Head-Final (Adjective precedes Noun)</option>
              <option value="head-initial">Head-Initial (Noun precedes Adjective)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Prosody & Stress Rule
            </label>
            <select
              value={config.stressRule}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  stressRule: e.target.value as StressRule,
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
            >
              <option value="penultimate">Penultimate (2nd to last syllable)</option>
              <option value="initial">Initial (First syllable)</option>
              <option value="ultimate">Ultimate (Final syllable)</option>
              <option value="antepenultimate">Antepenultimate (3rd to last)</option>
              <option value="heavy-syllable">Heavy-Syllable Foot (Coda / Glottal)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
