/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ConlangWord, CustomAudioAttachment, LanguageConfig } from '../engine/types';
import { playConlangPronunciation } from '../engine/audioSynthesizer';
import { AudioRecorderModal } from './AudioRecorderModal';

interface AudioVaultPanelProps {
  config: LanguageConfig;
  lexicon: ConlangWord[];
  audioLibrary: Record<string, CustomAudioAttachment>;
  onSaveAudio: (wordId: string, attachment: CustomAudioAttachment) => void;
  onDeleteAudio: (wordId: string) => void;
}

export const AudioVaultPanel: React.FC<AudioVaultPanelProps> = ({
  config,
  lexicon,
  audioLibrary,
  onSaveAudio,
  onDeleteAudio,
}) => {
  const [activeModalWord, setActiveModalWord] = useState<ConlangWord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'has-audio' | 'needs-audio'>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);

  const attachedCount = Object.keys(audioLibrary).length;

  const filteredWords = lexicon.filter((w) => {
    const hasAudio = !!audioLibrary[w.id];
    if (filterMode === 'has-audio' && !hasAudio) return false;
    if (filterMode === 'needs-audio' && hasAudio) return false;

    const matchesSearch =
      w.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.conlang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.ipa.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handlePlaySynthetic = (word: ConlangWord) => {
    setPlayingId(`synth-${word.id}`);
    playConlangPronunciation(word.conlang, word.ipa, {
      onEnd: () => setPlayingId(null),
    });
  };

  const handlePlayCustomAudio = (wordId: string, url: string) => {
    setPlayingId(`custom-${wordId}`);
    const audio = new Audio(url);
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => setPlayingId(null));
  };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>Voice Recording & Audio Vault</span>
              <span aria-hidden="true">·</span>
              <span>Acoustic Phonetics Laboratory</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Conlang Audio Studio & Files Hub
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Record spoken pronunciations using your microphone or select audio files directly from your device Files app.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
              <span className="text-slate-400">Attached Audio:</span>{' '}
              <span className="text-cyan-400 font-bold">{attachedCount}</span> / {lexicon.length}
            </div>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vocabulary to record or attach audio..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as 'all' | 'has-audio' | 'needs-audio')}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Words ({lexicon.length})</option>
              <option value="has-audio">Attached Audio ({attachedCount})</option>
              <option value="needs-audio">Needs Audio ({lexicon.length - attachedCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Audio Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWords.map((word) => {
          const customAudio = audioLibrary[word.id];

          return (
            <div
              key={word.id}
              className={`p-4 rounded-xl border transition-all ${
                customAudio
                  ? 'bg-slate-900 border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-base font-bold text-cyan-300 font-mono">{word.conlang}</span>
                  <span className="text-xs text-slate-400 ml-2 font-sans font-medium capitalize">
                    {word.english}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-sans text-slate-500 px-1.5 py-0.5 rounded bg-slate-800">
                  {word.pos}
                </span>
              </div>

              <div className="text-xs font-mono text-amber-300/80 mt-1">{word.ipa}</div>

              {/* Custom Audio Attached Pill or Empty State */}
              <div className="mt-3 py-2 px-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs flex items-center justify-between">
                {customAudio ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span className="text-emerald-300 font-medium font-sans">
                      {customAudio.source === 'recorded' ? '🎙️ Mic Recording' : '📁 Uploaded File'}
                    </span>
                    {customAudio.fileName && (
                      <span className="text-[10px] text-slate-500 truncate max-w-[100px]">
                        {customAudio.fileName}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-500 font-sans text-[11px]">No custom voice clip</span>
                )}

                {customAudio && (
                  <button
                    type="button"
                    onClick={() => handlePlayCustomAudio(word.id, customAudio.audioBlobUrl)}
                    disabled={playingId === `custom-${word.id}`}
                    className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 rounded text-xs transition-colors cursor-pointer"
                  >
                    {playingId === `custom-${word.id}` ? 'Playing...' : '▶ Listen Voice'}
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/60 gap-2">
                <button
                  type="button"
                  onClick={() => handlePlaySynthetic(word)}
                  disabled={playingId === `synth-${word.id}`}
                  className="px-2.5 py-1 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer flex items-center gap-1"
                  title="Listen to synthetic phonetics"
                >
                  <span>🔊 {playingId === `synth-${word.id}` ? 'Voicing...' : 'Synth'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveModalWord(word)}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>{customAudio ? '🎙️ Edit Audio' : '🎙️ Record / 📁 Upload'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal instance */}
      {activeModalWord && (
        <AudioRecorderModal
          isOpen={!!activeModalWord}
          onClose={() => setActiveModalWord(null)}
          targetWordOrPhrase={activeModalWord.english}
          conlangRomanized={activeModalWord.conlang}
          ipa={activeModalWord.ipa}
          existingAudio={audioLibrary[activeModalWord.id]}
          onSaveAudio={(attachment) => {
            onSaveAudio(activeModalWord.id, attachment);
            setActiveModalWord(null);
          }}
          onDeleteAudio={() => {
            onDeleteAudio(activeModalWord.id);
            setActiveModalWord(null);
          }}
        />
      )}
    </div>
  );
};
