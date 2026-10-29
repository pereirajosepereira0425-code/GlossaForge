/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ConlangWord, CustomAudioAttachment, LanguageConfig } from '../engine/types';
import { playConlangPronunciation } from '../engine/audioSynthesizer';
import { buildNativeGlyphMap, getWordSvgGlyphs } from '../engine/scriptGenerator';
import { AudioRecorderModal } from './AudioRecorderModal';

interface DictionaryPanelProps {
  config: LanguageConfig;
  lexicon: ConlangWord[];
  audioLibrary?: Record<string, CustomAudioAttachment>;
  onSaveAudio?: (wordId: string, attachment: CustomAudioAttachment) => void;
  onDeleteAudio?: (wordId: string) => void;
}

export const DictionaryPanel: React.FC<DictionaryPanelProps> = ({
  config,
  lexicon,
  audioLibrary = {},
  onSaveAudio,
  onDeleteAudio,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPos, setFilterPos] = useState<string>('all');
  const [filterAnimacy, setFilterAnimacy] = useState<string>('all');
  const [filterAudio, setFilterAudio] = useState<string>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeModalWord, setActiveModalWord] = useState<ConlangWord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyWord = (word: ConlangWord) => {
    navigator.clipboard.writeText(word.conlang);
    setCopiedId(word.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const glyphMap = buildNativeGlyphMap(
    config.consonantInventory,
    config.vowelInventory,
    config.scriptStyle
  );

  const filteredWords = lexicon.filter((w) => {
    const hasAudio = !!audioLibrary[w.id];
    if (filterAudio === 'with-audio' && !hasAudio) return false;
    if (filterAudio === 'no-audio' && hasAudio) return false;

    const matchesSearch =
      w.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.conlang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.ipa.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPos = filterPos === 'all' || w.pos === filterPos;
    const matchesAnimacy =
      filterAnimacy === 'all' ||
      (filterAnimacy === 'animate' && w.animacy === 'animate') ||
      (filterAnimacy === 'inanimate' && w.animacy === 'inanimate');

    return matchesSearch && matchesPos && matchesAnimacy;
  });

  const handlePlay = (word: ConlangWord) => {
    const customAudio = audioLibrary[word.id];
    if (customAudio && customAudio.audioBlobUrl) {
      setPlayingId(word.id);
      const audio = new Audio(customAudio.audioBlobUrl);
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => setPlayingId(null);
      audio.play().catch(() => setPlayingId(null));
      return;
    }

    setPlayingId(word.id);
    playConlangPronunciation(word.conlang, word.ipa, {
      onEnd: () => setPlayingId(null),
    });
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>Lexical Repository</span>
              <span aria-hidden="true">·</span>
              <span>Alphabetical Dictionary</span>
              <span aria-hidden="true">·</span>
              <span>Audio Vault Enabled</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {config.name} Lexicon ({lexicon.length} Roots)
            </h2>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Showing <span className="text-cyan-400 font-bold">{filteredWords.length}</span> of {lexicon.length} words
          </div>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by English, Conlang, or IPA..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={filterPos}
              onChange={(e) => setFilterPos(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-sans"
            >
              <option value="all">All Parts of Speech</option>
              <option value="n">Nouns (n)</option>
              <option value="v">Verbs (v)</option>
              <option value="adj">Adjectives (adj)</option>
              <option value="adv">Adverbs (adv)</option>
              <option value="prep">Prepositions (prep)</option>
              <option value="conj">Conjunctions (conj)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={filterAnimacy}
              onChange={(e) => setFilterAnimacy(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-sans"
            >
              <option value="all">All Animacy</option>
              <option value="animate">Animate</option>
              <option value="inanimate">Inanimate</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={filterAudio}
              onChange={(e) => setFilterAudio(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-sans"
            >
              <option value="all">All Audio</option>
              <option value="with-audio">🎙️ Custom Voice</option>
              <option value="no-audio">No Custom Voice</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lexicon Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                <th className="py-3 px-4 font-medium">Conlang Word</th>
                <th className="py-3 px-4 font-medium">Native Script</th>
                <th className="py-3 px-4 font-medium">IPA Pronunciation</th>
                <th className="py-3 px-4 font-medium font-sans">English Meaning</th>
                <th className="py-3 px-4 font-medium">POS</th>
                <th className="py-3 px-4 font-medium">Animacy</th>
                <th className="py-3 px-4 font-medium text-right font-sans">Audio & Voice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredWords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans text-xs">
                    No words matched your search query.
                  </td>
                </tr>
              ) : (
                filteredWords.map((word) => {
                  const svgGlyphs = getWordSvgGlyphs(word.conlang, glyphMap);
                  const customAudio = audioLibrary[word.id];

                  return (
                    <tr key={word.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-cyan-300">{word.conlang}</span>
                          {word.isCustomOverride && (
                            <span className="text-[10px] bg-amber-950/60 border border-amber-800/80 text-amber-300 px-1.5 py-0.5 rounded font-sans">
                              Override
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-0.5">
                          {svgGlyphs.map((g, gIdx) => (
                            <svg
                              key={gIdx}
                              viewBox="0 0 40 40"
                              className="w-5 h-5 stroke-slate-300 fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round"
                            >
                              <path d={g.svgPath} />
                            </svg>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-amber-300/90">{word.ipa}</td>
                      <td className="py-3 px-4 font-sans text-slate-200 capitalize font-medium">
                        {word.english}
                      </td>
                      <td className="py-3 px-4 text-slate-400 uppercase font-sans text-[11px]">
                        {word.pos}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] uppercase font-sans px-2 py-0.5 rounded ${
                            word.animacy === 'animate'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/60'
                              : 'bg-slate-800/80 text-slate-400 border border-slate-700/60'
                          }`}
                        >
                          {word.animacy}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-sans">
                          {/* Play button: plays custom recorded/uploaded audio if present, or synth */}
                          <button
                            type="button"
                            onClick={() => handlePlay(word)}
                            disabled={playingId === word.id}
                            className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                              customAudio
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                            }`}
                            title={customAudio ? 'Play user recorded/uploaded audio' : 'Play synthesized phonetics'}
                          >
                            <span>{playingId === word.id ? 'Playing...' : customAudio ? '▶ Custom' : '▶ Synth'}</span>
                          </button>

                          {/* Copy Romanized Conlang word */}
                          <button
                            type="button"
                            onClick={() => handleCopyWord(word)}
                            className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer border ${
                              copiedId === word.id
                                ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                                : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-750'
                            }`}
                            title={`Copy "${word.conlang}" to clipboard`}
                          >
                            {copiedId === word.id ? 'Copied!' : '📋 Copy'}
                          </button>

                          {/* Record or Choose File Modal Trigger */}
                          <button
                            type="button"
                            onClick={() => setActiveModalWord(word)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors cursor-pointer"
                            title="Record in audio app or choose from files"
                          >
                            {customAudio ? '🎙️ Edit' : '🎙️ Record/📁 File'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audio Recorder / File Chooser Modal */}
      {activeModalWord && (
        <AudioRecorderModal
          isOpen={!!activeModalWord}
          onClose={() => setActiveModalWord(null)}
          targetWordOrPhrase={activeModalWord.english}
          conlangRomanized={activeModalWord.conlang}
          ipa={activeModalWord.ipa}
          existingAudio={audioLibrary[activeModalWord.id]}
          onSaveAudio={(attachment) => {
            if (onSaveAudio) onSaveAudio(activeModalWord.id, attachment);
            setActiveModalWord(null);
          }}
          onDeleteAudio={() => {
            if (onDeleteAudio) onDeleteAudio(activeModalWord.id);
            setActiveModalWord(null);
          }}
        />
      )}
    </div>
  );
};
