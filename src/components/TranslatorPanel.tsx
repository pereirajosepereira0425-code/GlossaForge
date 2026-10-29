/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { ConlangWord, CustomAudioAttachment, LanguageConfig, TranslationResult } from '../engine/types';
import { translateSentence } from '../engine/translator';
import { playConlangPronunciation } from '../engine/audioSynthesizer';
import { buildNativeGlyphMap, getWordSvgGlyphs } from '../engine/scriptGenerator';
import { AudioRecorderModal } from './AudioRecorderModal';

interface TranslatorPanelProps {
  config: LanguageConfig;
  lexicon: ConlangWord[];
  audioLibrary?: Record<string, CustomAudioAttachment>;
  onSaveAudio?: (key: string, attachment: CustomAudioAttachment) => void;
  onDeleteAudio?: (key: string) => void;
}

export const TranslatorPanel: React.FC<TranslatorPanelProps> = ({
  config,
  lexicon,
  audioLibrary = {},
  onSaveAudio,
  onDeleteAudio,
}) => {
  const [inputText, setInputText] = useState('The king protects my dog');
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Compute translation
  const result: TranslationResult = translateSentence(inputText, config, lexicon);

  const glyphMap = buildNativeGlyphMap(
    config.consonantInventory,
    config.vowelInventory,
    config.scriptStyle
  );

  const translationAudioKey = `trans-${result.translatedRomanized.toLowerCase().replace(/[^a-z0-9']/g, '_')}`;
  const customAudio = audioLibrary[translationAudioKey];

  const samplePrompts = [
    'The king protects my dog',
    'We protect the sacred fire',
    'The warrior will kill the wolf',
    'Ancient stone speaks to our heart',
    'The dragon loves the golden crown',
    'I see your sword in the night',
  ];

  const handlePlayAudio = () => {
    if (isPlaying) return;

    if (customAudio && customAudio.audioBlobUrl) {
      setIsPlaying(true);
      const audio = new Audio(customAudio.audioBlobUrl);
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      audio.play().catch(() => setIsPlaying(false));
      return;
    }

    setIsPlaying(true);
    playConlangPronunciation(result.translatedRomanized, result.ipa, {
      onEnd: () => setIsPlaying(false),
    });
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  /**
   * Paste copied text into the text field at current cursor position or append to end.
   * Crucially: ADDS the copied content to the text field, NEVER replaces the existing text!
   */
  const handlePasteText = async () => {
    try {
      let clipText = '';
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        clipText = await navigator.clipboard.readText();
      }
      if (!clipText) return;

      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart ?? inputText.length;
        const end = textarea.selectionEnd ?? inputText.length;
        const before = inputText.substring(0, start);
        const after = inputText.substring(end);

        // Smart spacing: don't double space, but insert space if joining adjacent words
        const needsLeadingSpace =
          before.length > 0 &&
          !before.endsWith(' ') &&
          !before.endsWith('\n') &&
          !clipText.startsWith(' ');
        const needsTrailingSpace =
          after.length > 0 &&
          !after.startsWith(' ') &&
          !after.startsWith('\n') &&
          !clipText.endsWith(' ');

        const insertion =
          (needsLeadingSpace ? ' ' : '') + clipText + (needsTrailingSpace ? ' ' : '');
        const newText = before + insertion + after;
        setInputText(newText);

        setTimeout(() => {
          textarea.focus();
          const nextPos = start + insertion.length;
          textarea.setSelectionRange(nextPos, nextPos);
        }, 0);
      } else {
        setInputText((prev) => {
          if (!prev.trim()) return clipText;
          const separator = prev.endsWith(' ') || prev.endsWith('\n') ? '' : ' ';
          return prev + separator + clipText;
        });
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Natural Language Translation Engine</span>
            <span aria-hidden="true">·</span>
            <span>Syntactic & Morphological Resolver</span>
            <span aria-hidden="true">·</span>
            <span>Microphone & File Audio Enabled</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Bidirectional Translator & Interlinear Gloss
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Translates English text into {config.name} applying strictly enforced word order ({config.wordOrder}),
            pronominal affixation, animacy agreements, and Slavic diacritics. Record your own voice or choose audio files.
          </p>
        </div>

        {/* Preset quick test chips: Clicking ADDS to text instead of wiping it */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400">Quick Test (Click to Add):</span>
          {samplePrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                setInputText((prev) => {
                  if (!prev.trim()) return prompt;
                  const separator = prev.endsWith(' ') || prev.endsWith('\n') ? '' : ' ';
                  return prev + separator + prompt;
                });
              }}
              className="px-2.5 py-1 rounded border text-left transition-colors cursor-pointer bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-cyan-300 flex items-center gap-1"
              title={`Add "${prompt}" to text field`}
            >
              <span className="text-cyan-400 font-bold">+</span>
              <span>"{prompt}"</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Translation Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input & Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="translator-input" className="text-xs font-semibold text-slate-300">
                English Text to Translate
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePasteText}
                  className="px-2.5 py-1 text-xs bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/80 rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                  title="Paste from clipboard and add to text field (does not replace existing text)"
                >
                  <span>📋 Paste (Add)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer px-1.5 py-0.5"
                  title="Clear text field"
                >
                  Clear
                </button>
              </div>
            </div>
            <textarea
              id="translator-input"
              ref={textareaRef}
              rows={5}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or paste any word or sentence (e.g. 'The king sees my dog' or 'sword')..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans resize-y"
            />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Supports single words, compound phrases, and complex sentences.</span>
              <span className="font-mono text-cyan-400">{inputText.split(/\s+/).filter(Boolean).length} tokens</span>
            </div>
          </div>

          {/* Morphological Rules Applied in this Sentence */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 font-mono text-xs">
            <div className="text-slate-300 font-sans font-semibold border-b border-slate-800 pb-2">
              Linguistic Resolution Mechanics
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Word Order Rearrangement:</span>
              <span className="text-cyan-400 font-bold">{config.wordOrder}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Syntactic Head Direction:</span>
              <span className="text-slate-300">{config.headDirection}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Animacy Agreement:</span>
              <span className="text-emerald-400">Strict (Animate ≠ Inanimate)</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Morphological Type:</span>
              <span className="text-indigo-400 capitalize">{config.morphologyType}</span>
            </div>
          </div>
        </div>

        {/* Output & Interlinear Gloss */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <span className="text-xs font-semibold text-slate-400">
                Generated {config.name} Translation
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlayAudio}
                  disabled={isPlaying || !result.translatedRomanized}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                    customAudio
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20'
                  }`}
                >
                  <span>{isPlaying ? 'Speaking...' : customAudio ? '▶ Play Custom Voice' : '▶ Play Synth'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAudioModalOpen(true)}
                  disabled={!result.translatedRomanized}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Record in audio app or choose from files"
                >
                  <span>{customAudio ? '🎙️ Edit Audio' : '🎙️ Record / 📁 File'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(result.translatedRomanized, 'roman')}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                >
                  {copiedType === 'roman' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Custom Audio Attached Callout */}
            {customAudio && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span className="text-emerald-300 font-semibold font-sans">
                    Custom Voice Clip Attached ({customAudio.source === 'recorded' ? 'Mic Recording' : 'Uploaded File'})
                  </span>
                  {customAudio.fileName && (
                    <span className="text-slate-400 font-mono text-[11px] truncate max-w-[140px]">
                      {customAudio.fileName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePlayAudio}
                    className="text-emerald-300 hover:underline font-medium text-xs"
                  >
                    Play
                  </button>
                  <span className="text-slate-600">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onDeleteAudio) onDeleteAudio(translationAudioKey);
                    }}
                    className="text-rose-400 hover:text-rose-300 text-xs"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            {/* 1. Romanized output with Slavic Diacritics */}
            <div>
              <div className="text-xs text-slate-400 mb-1">Standard Slavic Romanization:</div>
              <div className="text-2xl font-bold font-mono text-cyan-300 tracking-wide select-all">
                {result.translatedRomanized || <span className="text-slate-600 font-sans italic">Enter text to translate</span>}
              </div>
            </div>

            {/* 2. Native Script Vector & Unicode display */}
            <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Native Script ({config.scriptStyle}):
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(result.translatedNativeScript, 'native')}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  {copiedType === 'native' ? 'Copied!' : 'Copy Unicode PUA'}
                </button>
              </div>

              {/* Render vector glyphs visually */}
              <div className="flex items-center gap-3 flex-wrap py-2 border-b border-slate-900">
                {result.translatedRomanized.split(/\s+/).map((word, wIdx) => {
                  const glyphs = getWordSvgGlyphs(word, glyphMap);
                  return (
                    <div key={wIdx} className="flex items-center gap-1 bg-slate-900/60 p-1.5 rounded border border-slate-800">
                      {glyphs.map((g, gIdx) => (
                        <svg
                          key={gIdx}
                          viewBox="0 0 40 40"
                          className="w-6 h-6 stroke-cyan-300 fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round"
                        >
                          <path d={g.svgPath} />
                        </svg>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Text representation */}
              <div className="text-lg font-mono text-slate-300 tracking-widest break-all select-all pt-1">
                {result.translatedNativeScript}
              </div>
            </div>

            {/* 3. IPA Phonetic Transcription */}
            <div className="flex items-center justify-between text-sm font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
              <div>
                <span className="text-xs text-slate-400 mr-2 font-sans">IPA Transcription:</span>
                <span className="text-amber-300 font-medium">{result.ipa}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(result.ipa, 'ipa')}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                {copiedType === 'ipa' ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* 4. Interlinear Leipzig Gloss */}
            <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-lg space-y-1 font-mono text-xs">
              <div className="text-xs text-slate-400 font-sans">Interlinear Grammatical Gloss:</div>
              <div className="text-emerald-400 font-semibold tracking-wide">
                {result.gloss}
              </div>
            </div>

            {/* 5. Phonetic Audio Guide */}
            {result.phoneticAudioGuide.pacingDescription && (
              <div className="bg-slate-950 border border-cyan-900/40 p-4 rounded-xl space-y-2 text-xs">
                <div className="text-cyan-300 font-semibold font-sans">
                  Phonetic Audio Guide & Vocal Cadence
                </div>
                <div className="text-slate-300 leading-relaxed">
                  <strong className="text-slate-400">Pacing:</strong> {result.phoneticAudioGuide.pacingDescription}
                </div>
                <div className="text-slate-300 leading-relaxed font-mono">
                  <strong className="text-slate-400 font-sans">Syllable Cadence:</strong>{' '}
                  <span className="text-cyan-200">{result.phoneticAudioGuide.syllableCadence}</span>
                </div>
                <div className="text-slate-400 leading-relaxed">
                  <strong className="text-slate-300">Stress & Articulation:</strong> {result.phoneticAudioGuide.stressContour}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Token Breakdown Cards */}
      {result.tokens.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-semibold text-white">Constituent Morpheme Breakdown</h3>
            <p className="text-xs text-slate-400">Detailed morphological derivation of each translated argument</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {result.tokens.map((token, idx) => (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2 text-xs font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-sans text-xs">{token.original}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-sans ${
                    token.animacy === 'animate'
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {token.animacy}
                  </span>
                </div>

                <div className="text-base font-bold text-cyan-300">{token.conlangFull}</div>
                <div className="text-slate-400 text-[11px]">{token.ipa}</div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-400">
                  Gloss: {token.gloss}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audio Recorder Modal for Translation */}
      {isAudioModalOpen && (
        <AudioRecorderModal
          isOpen={isAudioModalOpen}
          onClose={() => setIsAudioModalOpen(false)}
          targetWordOrPhrase={result.inputSentence}
          conlangRomanized={result.translatedRomanized}
          ipa={result.ipa}
          existingAudio={customAudio}
          onSaveAudio={(attachment) => {
            if (onSaveAudio) onSaveAudio(translationAudioKey, attachment);
            setIsAudioModalOpen(false);
          }}
          onDeleteAudio={() => {
            if (onDeleteAudio) onDeleteAudio(translationAudioKey);
            setIsAudioModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
