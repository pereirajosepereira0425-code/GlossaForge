/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CustomLetter } from './types';

/**
 * Phonetically map Slavic-Romanized conlang text into phonetic English approximation
 * for standard text-to-speech engines
 */
export function romanizedToSpeechText(text: string, customLetters?: CustomLetter[]): string {
  let s = text.toLowerCase();

  // If custom letters have phonetic replacements or speech hints, apply them first
  if (customLetters && customLetters.length > 0) {
    for (const cl of customLetters) {
      if (cl.speechPronunciation) {
        const escaped = cl.romanization.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        s = s.replace(new RegExp(escaped, 'gi'), cl.speechPronunciation);
      }
    }
  }

  s = s.replace(/š/g, 'sh');
  s = s.replace(/č/g, 'ch');
  s = s.replace(/ž/g, 'zh');
  s = s.replace(/ć/g, 'ch');
  s = s.replace(/đ/g, 'dj');
  s = s.replace(/ř/g, 'rzh');
  s = s.replace(/ň/g, 'ny');
  s = s.replace(/ľ/g, 'ly');
  s = s.replace(/c/g, 'ts');
  s = s.replace(/'/g, ' '); // pause for glottal stop
  s = s.replace(/y/g, 'ih');
  s = s.replace(/ü/g, 'ue');
  s = s.replace(/ö/g, 'oe');
  s = s.replace(/ě/g, 'yeh');
  s = s.replace(/x/g, 'kh');
  return s;
}

/**
 * Play recorded or uploaded audio dataURL directly via HTML5 Audio
 */
export function playAudioDataUrl(
  dataUrl: string,
  onStart?: () => void,
  onEnd?: () => void
): HTMLAudioElement | null {
  if (typeof window === 'undefined' || !dataUrl) return null;
  try {
    const audio = new Audio(dataUrl);
    if (onStart) onStart();
    audio.onended = () => {
      if (onEnd) onEnd();
    };
    audio.onerror = (e) => {
      console.warn('Custom audio playback error:', e);
      if (onEnd) onEnd();
    };
    audio.play().catch((err) => {
      console.warn('Playback permission blocked or failed:', err);
      if (onEnd) onEnd();
    });
    return audio;
  } catch (err) {
    console.warn('Could not initialize Audio element:', err);
    if (onEnd) onEnd();
    return null;
  }
}

/**
 * Play pronunciation using custom recorded audio if available,
 * or Web Speech API / Web Audio formant generator
 */
export function playConlangPronunciation(
  romanized: string,
  ipa: string,
  options?: {
    pitch?: number;
    rate?: number;
    customAudioUrl?: string;
    customLetters?: CustomLetter[];
    onStart?: () => void;
    onEnd?: () => void;
  }
) {
  if (typeof window === 'undefined') return;

  // 1. Direct custom audio takes highest priority (e.g. for custom letters or words with recorded audio)
  if (options?.customAudioUrl) {
    playAudioDataUrl(options.customAudioUrl, options.onStart, options.onEnd);
    return;
  }

  // 2. Check if the exact single letter or word matches a custom letter with audio
  if (options?.customLetters && options.customLetters.length > 0) {
    const matchingLetter = options.customLetters.find(
      (cl) => cl.romanization.toLowerCase() === romanized.toLowerCase() && cl.audioDataUrl
    );
    if (matchingLetter && matchingLetter.audioDataUrl) {
      playAudioDataUrl(matchingLetter.audioDataUrl, options.onStart, options.onEnd);
      return;
    }
  }

  // 3. Fall back to Web Speech API
  const phoneticText = romanizedToSpeechText(romanized, options?.customLetters);

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(phoneticText);
    utterance.pitch = options?.pitch ?? 0.95;
    utterance.rate = options?.rate ?? 0.88;
    utterance.lang = 'en-US';

    if (options?.onStart) utterance.onstart = options.onStart;
    if (options?.onEnd) utterance.onend = options.onEnd;

    // Search for clear natural voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') || v.name.includes('Daniel') || v.name.includes('Google'))
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  } else {
    // 4. Acoustic formant synthesizer fallback
    playWebAudioAcousticFallback(romanized, options?.onStart, options?.onEnd);
  }
}

/**
 * Web Audio API Acoustic Formant Synthesizer Fallback
 */
export function playWebAudioAcousticFallback(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (onStart) onStart();

    const syllables = text.split(/['\s\-]/).filter(Boolean);
    const baseFreq = 160;
    const now = ctx.currentTime;
    let timeOffset = 0;

    syllables.forEach((syl, i) => {
      const duration = 0.22;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      if (/[aeiouy]/.test(syl)) {
        if (syl.includes('a')) filter.frequency.value = 850;
        else if (syl.includes('i') || syl.includes('y')) filter.frequency.value = 280;
        else if (syl.includes('u') || syl.includes('o')) filter.frequency.value = 450;
        else filter.frequency.value = 600;
        filter.Q.value = 4;
      }

      osc.type = 'sawtooth';
      const pitchStep = i % 2 === 0 ? baseFreq : baseFreq * 1.15;
      osc.frequency.setValueAtTime(pitchStep, now + timeOffset);

      gain.gain.setValueAtTime(0.0001, now + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.18, now + timeOffset + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + duration);

      timeOffset += duration + (text.includes("'") ? 0.08 : 0.04);
    });

    setTimeout(() => {
      if (onEnd) onEnd();
      ctx.close();
    }, (timeOffset + 0.2) * 1000);
  } catch (err) {
    console.warn('Web Audio synthesis error:', err);
    if (onEnd) onEnd();
  }
}
