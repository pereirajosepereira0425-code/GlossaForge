/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimacyClass, LanguageConfig } from '../engine/types';
import { attachPossessiveToNoun, inflectVerb } from '../engine/morphology';
import { romanToIpa } from '../engine/phonology';
import { playConlangPronunciation } from '../engine/audioSynthesizer';

interface MorphologyPanelProps {
  config: LanguageConfig;
  onChangeConfig: (newConfig: LanguageConfig) => void;
}

export const MorphologyPanel: React.FC<MorphologyPanelProps> = ({
  config,
  onChangeConfig,
}) => {
  // Interactive Live Clitic Tester state
  const [testNoun, setTestNoun] = useState("rath'mor");
  const [testAnimacy, setTestAnimacy] = useState<AnimacyClass>('animate');
  const [testPerson, setTestPerson] = useState<'1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl'>('1sg');

  const [testVerb, setTestVerb] = useState('kran');
  const [testTense, setTestTense] = useState<'present' | 'past' | 'future' | 'perfect'>('past');
  const [testSubjPerson, setTestSubjPerson] = useState<'1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl'>('3sg');
  const [testObjPerson, setTestObjPerson] = useState<'1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl' | 'none'>('3sg');
  const [testObjAnimacy, setTestObjAnimacy] = useState<AnimacyClass>('inanimate');

  // Compute test noun attachment
  const nounTestResult = attachPossessiveToNoun(testNoun, testPerson, testAnimacy, config);
  const nounIpa = romanToIpa(nounTestResult.fullForm, config);

  // Compute test verb inflection
  const verbTestResult = inflectVerb(
    testVerb,
    testTense,
    testSubjPerson,
    'animate',
    testObjPerson === 'none' ? null : testObjPerson,
    testObjAnimacy,
    config
  );
  const verbIpa = romanToIpa(verbTestResult.fullForm, config);

  const handleUpdateParadigm = (
    person: '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl',
    role: 'subject' | 'object' | 'possessive',
    key: 'animate' | 'inanimate',
    value: string
  ) => {
    const updated = config.pronounRules.paradigms.map((p) => {
      if (p.person === person && p.role === role) {
        return { ...p, [key]: value };
      }
      return p;
    });
    onChangeConfig({
      ...config,
      pronounRules: {
        ...config.pronounRules,
        paradigms: updated,
      },
    });
  };

  const handleUpdateCase = (caseName: string, suffix: string) => {
    const updated = config.cases.map((c) =>
      c.caseName === caseName ? { ...c, suffix } : c
    );
    onChangeConfig({
      ...config,
      cases: updated,
    });
  };

  const handleUpdateTense = (tense: string, affix: string, position: 'prefix' | 'suffix') => {
    const updated = config.tenses.map((t) =>
      t.tense === tense ? { ...t, affix, position } : t
    );
    onChangeConfig({
      ...config,
      tenses: updated,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Morphology & Grammar</span>
            <span aria-hidden="true">·</span>
            <span>Gender & Animacy Agreement Engine</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Pronominal Affixation & Dynamic Animacy Systems
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enforce grammatical agreement where bound pronoun clitics dynamically alter based on Animate vs Inanimate noun classes
          </p>
        </div>

        {/* Attachment configuration controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
            <span className="text-slate-400 block mb-1">Noun Possessive Binding</span>
            <select
              value={config.pronounRules.nounPossessiveAttachment}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  pronounRules: {
                    ...config.pronounRules,
                    nounPossessiveAttachment: e.target.value as 'prefix' | 'suffix',
                  },
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
            >
              <option value="suffix">Suffix (house-MY)</option>
              <option value="prefix">Prefix (MY-house)</option>
            </select>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
            <span className="text-slate-400 block mb-1">Verbal Subject Binding</span>
            <select
              value={config.pronounRules.verbSubjectAttachment}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  pronounRules: {
                    ...config.pronounRules,
                    verbSubjectAttachment: e.target.value as 'prefix' | 'suffix',
                  },
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
            >
              <option value="prefix">Prefix (I-see)</option>
              <option value="suffix">Suffix (see-I)</option>
            </select>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
            <span className="text-slate-400 block mb-1">Verbal Object Binding</span>
            <select
              value={config.pronounRules.verbObjectAttachment}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  pronounRules: {
                    ...config.pronounRules,
                    verbObjectAttachment: e.target.value as 'prefix' | 'suffix' | 'infix',
                  },
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
            >
              <option value="suffix">Suffix (see-THEM)</option>
              <option value="prefix">Prefix (THEM-see)</option>
              <option value="infix">Infix (s-THEM-ee)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Live Interactive Agreement Inspector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="border-b border-slate-800 pb-2">
          <h3 className="text-base font-semibold text-white">Live Agreement Simulator</h3>
          <p className="text-xs text-slate-400">
            Witness how animacy classes and binding parameters dynamically shift the resultant morphology
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Noun Possessive Attachment Test */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-300 font-sans">
              1. Noun Possessive Clitic Binding
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Base Noun</label>
                <input
                  type="text"
                  value={testNoun}
                  onChange={(e) => setTestNoun(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Noun Animacy</label>
                <select
                  value={testAnimacy}
                  onChange={(e) => setTestAnimacy(e.target.value as AnimacyClass)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                >
                  <option value="animate">Animate (Being/Force)</option>
                  <option value="inanimate">Inanimate (Tool/Matter)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Possessor</label>
                <select
                  value={testPerson}
                  onChange={(e) => setTestPerson(e.target.value as '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl')}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                >
                  <option value="1sg">1SG (My)</option>
                  <option value="2sg">2SG (Your)</option>
                  <option value="3sg">3SG (His/Her/Its)</option>
                  <option value="1pl">1PL (Our)</option>
                  <option value="2pl">2PL (Your pl)</option>
                  <option value="3pl">3PL (Their)</option>
                </select>
              </div>
            </div>

            {/* Result display */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Synthesized Form:</div>
                <div className="text-base font-bold font-mono text-cyan-300">
                  {nounTestResult.fullForm}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  {nounIpa} · <span className="text-emerald-400">{nounTestResult.gloss}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => playConlangPronunciation(nounTestResult.fullForm, nounIpa)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors cursor-pointer"
              >
                Listen
              </button>
            </div>
          </div>

          {/* Verb Inflection Test */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-300 font-sans">
              2. Verbal Clitic & Tense Inflection
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Verb Stem</label>
                <input
                  type="text"
                  value={testVerb}
                  onChange={(e) => setTestVerb(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tense</label>
                <select
                  value={testTense}
                  onChange={(e) => setTestTense(e.target.value as 'present' | 'past' | 'future' | 'perfect')}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                >
                  <option value="present">Present</option>
                  <option value="past">Past</option>
                  <option value="future">Future</option>
                  <option value="perfect">Perfect</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Subject</label>
                <select
                  value={testSubjPerson}
                  onChange={(e) => setTestSubjPerson(e.target.value as '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl')}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                >
                  <option value="1sg">1SG</option>
                  <option value="2sg">2SG</option>
                  <option value="3sg">3SG</option>
                  <option value="1pl">1PL</option>
                  <option value="3pl">3PL</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Object Target</label>
                <select
                  value={testObjPerson}
                  onChange={(e) => setTestObjPerson(e.target.value as '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl' | 'none')}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                >
                  <option value="none">None</option>
                  <option value="3sg">3SG Obj</option>
                  <option value="1sg">1SG Obj</option>
                </select>
              </div>
            </div>

            {/* Verb result */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Inflected Verbal Complex:</div>
                <div className="text-base font-bold font-mono text-cyan-300">
                  {verbTestResult.fullForm}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  {verbIpa} · <span className="text-emerald-400">{verbTestResult.glossParts.join('-')}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => playConlangPronunciation(verbTestResult.fullForm, verbIpa)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors cursor-pointer"
              >
                Listen
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Paradigm Matrix Tables */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-base font-semibold text-white">
            Gendered Pronoun Paradigms (Animate vs Inanimate)
          </h3>
          <p className="text-xs text-slate-400">
            Edit the exact affix strings bound to nouns and verbs across grammatical persons
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 px-3 font-medium">Person</th>
                <th className="py-2 px-3 font-medium">Role</th>
                <th className="py-2 px-3 font-medium text-cyan-300">Animate Affix</th>
                <th className="py-2 px-3 font-medium text-amber-300">Inanimate Affix</th>
                <th className="py-2 px-3 font-medium">Semantic Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {config.pronounRules.paradigms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                    <div className="text-slate-300 font-medium">No pronoun paradigms defined yet</div>
                    <p className="text-xs text-slate-500 mt-1">All paradigms are off in Blank mode. You can create your own or initialize standard 6-person paradigms.</p>
                    <button
                      type="button"
                      onClick={() => {
                        onChangeConfig({
                          ...config,
                          pronounRules: {
                            ...config.pronounRules,
                            paradigms: [
                              { person: '1sg', animate: '-mo', inanimate: '-ma', role: 'possessive' },
                              { person: '2sg', animate: '-te', inanimate: '-ta', role: 'possessive' },
                              { person: '3sg', animate: '-re', inanimate: '-to', role: 'possessive' },
                              { person: '1pl', animate: '-mor', inanimate: '-mar', role: 'possessive' },
                              { person: '2pl', animate: '-ten', inanimate: '-tan', role: 'possessive' },
                              { person: '3pl', animate: '-ron', inanimate: '-ton', role: 'possessive' },
                              { person: '1sg', animate: 'ku-', inanimate: 'ka-', role: 'subject' },
                              { person: '2sg', animate: 'ti-', inanimate: 'to-', role: 'subject' },
                              { person: '3sg', animate: 're-', inanimate: 'to-', role: 'subject' },
                              { person: '1pl', animate: 'kor-', inanimate: 'kar-', role: 'subject' },
                              { person: '2pl', animate: 'tor-', inanimate: 'tar-', role: 'subject' },
                              { person: '3pl', animate: 'ren-', inanimate: 'ton-', role: 'subject' },
                            ],
                          },
                        });
                      }}
                      className="mt-3 px-3 py-1.5 bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      ➕ Initialize Standard 6-Person Paradigms
                    </button>
                  </td>
                </tr>
              ) : (
                config.pronounRules.paradigms.map((p, idx) => (
                  <tr key={`${p.person}-${p.role}-${idx}`} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-bold text-slate-200">{p.person.toUpperCase()}</td>
                    <td className="py-2 px-3 text-slate-400 capitalize">{p.role}</td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={p.animate}
                        onChange={(e) => handleUpdateParadigm(p.person, p.role, 'animate', e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-cyan-300 w-28 font-mono text-xs focus:border-cyan-500"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={p.inanimate}
                        onChange={(e) => handleUpdateParadigm(p.person, p.role, 'inanimate', e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-300 w-28 font-mono text-xs focus:border-amber-500"
                      />
                    </td>
                    <td className="py-2 px-3 text-slate-400 font-sans text-[11px]">
                      {p.role === 'possessive' ? 'Attached to noun root' : 'Inflected on verbal stem'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cases and Tenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Case Declensions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Case Declension System</h3>
              <p className="text-xs text-slate-400">Nominal case affixes applied to direct and indirect arguments</p>
            </div>
            {config.cases.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  onChangeConfig({
                    ...config,
                    cases: [
                      { caseName: 'nominative', suffix: '', description: 'Base / Subject' },
                      { caseName: 'accusative', suffix: '-n', description: 'Direct Object' },
                      { caseName: 'genitive', suffix: '-is', description: 'Possession / Origin' },
                      { caseName: 'dative', suffix: '-ov', description: 'Indirect Object' },
                      { caseName: 'locative', suffix: '-e', description: 'Location' },
                      { caseName: 'instrumental', suffix: '-om', description: 'Tool / Means' },
                    ],
                  });
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs rounded border border-slate-700 cursor-pointer"
              >
                ➕ Init Cases
              </button>
            )}
          </div>

          <div className="space-y-2">
            {config.cases.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs font-sans">
                No case declensions active. (Uninflected word-order based)
              </div>
            ) : (
              config.cases.map((c) => (
                <div
                  key={c.caseName}
                  className="flex items-center justify-between bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-200 capitalize font-sans">{c.caseName}</span>
                    <span className="text-slate-500 ml-2 font-sans text-[11px]">({c.description})</span>
                  </div>
                  <input
                    type="text"
                    value={c.suffix}
                    onChange={(e) => handleUpdateCase(c.caseName, e.target.value)}
                    placeholder="e.g. -n or none"
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-cyan-300 w-24 text-right"
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tense System */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Tense & Aspect Markers</h3>
              <p className="text-xs text-slate-400">Verbal temporal prefixes or suffixes</p>
            </div>
            {config.tenses.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  onChangeConfig({
                    ...config,
                    tenses: [
                      { tense: 'present', affix: '', position: 'suffix' },
                      { tense: 'past', affix: '-il', position: 'suffix' },
                      { tense: 'future', affix: '-va', position: 'suffix' },
                      { tense: 'perfect', affix: 'k-', position: 'prefix' },
                    ],
                  });
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs rounded border border-slate-700 cursor-pointer"
              >
                ➕ Init Tenses
              </button>
            )}
          </div>

          <div className="space-y-2">
            {config.tenses.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs font-sans">
                No tense markers active. (Tenseless / contextual)
              </div>
            ) : (
              config.tenses.map((t) => (
                <div
                  key={t.tense}
                  className="flex items-center justify-between bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs"
                >
                  <span className="font-bold text-slate-200 capitalize font-sans">{t.tense}</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={t.position}
                      onChange={(e) => handleUpdateTense(t.tense, t.affix, e.target.value as 'prefix' | 'suffix')}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 text-xs"
                    >
                      <option value="suffix">Suffix</option>
                      <option value="prefix">Prefix</option>
                    </select>
                    <input
                      type="text"
                      value={t.affix}
                      onChange={(e) => handleUpdateTense(t.tense, e.target.value, t.position)}
                      placeholder="e.g. -il"
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-cyan-300 w-20 text-right"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
