/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PhonemeDef,
  LanguageConfig,
  PartOfSpeech,
  StressRule,
  LinearVector,
  GeometricMorphology,
} from './types';

export const STANDARD_IPA_CONSONANTS: PhonemeDef[] = [
  // Plosives
  { symbol: 'p', romanization: 'p', category: 'consonant', manner: 'plosive', place: 'bilabial' },
  { symbol: 'b', romanization: 'b', category: 'consonant', manner: 'plosive', place: 'bilabial' },
  { symbol: 't', romanization: 't', category: 'consonant', manner: 'plosive', place: 'alveolar' },
  { symbol: 'd', romanization: 'd', category: 'consonant', manner: 'plosive', place: 'alveolar' },
  { symbol: 'k', romanization: 'k', category: 'consonant', manner: 'plosive', place: 'velar' },
  { symbol: 'ɡ', romanization: 'g', category: 'consonant', manner: 'plosive', place: 'velar' },
  { symbol: 'ʔ', romanization: "'", category: 'consonant', manner: 'plosive', place: 'glottal' },
  // Nasals
  { symbol: 'm', romanization: 'm', category: 'consonant', manner: 'nasal', place: 'bilabial' },
  { symbol: 'n', romanization: 'n', category: 'consonant', manner: 'nasal', place: 'alveolar' },
  { symbol: 'ɲ', romanization: 'ň', category: 'consonant', manner: 'nasal', place: 'palatal' },
  { symbol: 'ŋ', romanization: 'ng', category: 'consonant', manner: 'nasal', place: 'velar' },
  // Trills & Taps
  { symbol: 'r', romanization: 'r', category: 'consonant', manner: 'trill', place: 'alveolar' },
  { symbol: 'r̝', romanization: 'ř', category: 'consonant', manner: 'trill', place: 'alveolar' },
  // Fricatives
  { symbol: 'f', romanization: 'f', category: 'consonant', manner: 'fricative', place: 'labiodental' },
  { symbol: 'v', romanization: 'v', category: 'consonant', manner: 'fricative', place: 'labiodental' },
  { symbol: 's', romanization: 's', category: 'consonant', manner: 'fricative', place: 'alveolar' },
  { symbol: 'z', romanization: 'z', category: 'consonant', manner: 'fricative', place: 'alveolar' },
  { symbol: 'ʃ', romanization: 'š', category: 'consonant', manner: 'fricative', place: 'postalveolar' },
  { symbol: 'ʒ', romanization: 'ž', category: 'consonant', manner: 'fricative', place: 'postalveolar' },
  { symbol: 'x', romanization: 'x', category: 'consonant', manner: 'fricative', place: 'velar' },
  { symbol: 'h', romanization: 'h', category: 'consonant', manner: 'fricative', place: 'glottal' },
  // Affricates
  { symbol: 'ts', romanization: 'c', category: 'consonant', manner: 'affricate', place: 'alveolar' },
  { symbol: 'tʃ', romanization: 'č', category: 'consonant', manner: 'affricate', place: 'postalveolar' },
  { symbol: 'tɕ', romanization: 'ć', category: 'consonant', manner: 'affricate', place: 'palatal' },
  { symbol: 'dʑ', romanization: 'đ', category: 'consonant', manner: 'affricate', place: 'palatal' },
  // Approximants
  { symbol: 'l', romanization: 'l', category: 'consonant', manner: 'approximant', place: 'alveolar' },
  { symbol: 'ʎ', romanization: 'ľ', category: 'consonant', manner: 'approximant', place: 'palatal' },
  { symbol: 'j', romanization: 'j', category: 'consonant', manner: 'approximant', place: 'palatal' },
  { symbol: 'w', romanization: 'w', category: 'consonant', manner: 'approximant', place: 'velar' },
];

export const STANDARD_IPA_VOWELS: PhonemeDef[] = [
  { symbol: 'i', romanization: 'i', category: 'vowel', height: 'close', backness: 'front', rounded: false },
  { symbol: 'e', romanization: 'e', category: 'vowel', height: 'close-mid', backness: 'front', rounded: false },
  { symbol: 'ɛ', romanization: 'ě', category: 'vowel', height: 'open-mid', backness: 'front', rounded: false },
  { symbol: 'a', romanization: 'a', category: 'vowel', height: 'open', backness: 'central', rounded: false },
  { symbol: 'o', romanization: 'o', category: 'vowel', height: 'close-mid', backness: 'back', rounded: true },
  { symbol: 'u', romanization: 'u', category: 'vowel', height: 'close', backness: 'back', rounded: true },
  { symbol: 'ɨ', romanization: 'y', category: 'vowel', height: 'close', backness: 'central', rounded: false },
  { symbol: 'y', romanization: 'ü', category: 'vowel', height: 'close', backness: 'front', rounded: true },
  { symbol: 'ø', romanization: 'ö', category: 'vowel', height: 'close-mid', backness: 'front', rounded: true },
];

/**
 * Deterministic pseudo-random generator seeded with a string or number
 */
export function createRng(seedString: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedString.length; i++) {
    h = Math.imul(h ^ seedString.charCodeAt(i), 16777619);
  }
  return function nextFloat(): number {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    return (h >>> 0) / 4294967296;
  };
}

/**
 * Check if a sound is a plosive
 */
export function isPlosive(phoneme: PhonemeDef): boolean {
  return phoneme.manner === 'plosive';
}

/**
 * Check if a sound is a fricative
 */
export function isFricative(phoneme: PhonemeDef): boolean {
  return phoneme.manner === 'fricative';
}

/**
 * Check if a sound is a nasal
 */
export function isNasal(phoneme: PhonemeDef): boolean {
  return phoneme.manner === 'nasal';
}

/**
 * Pick an item from an array using RNG
 */
export function pick<T>(arr: T[], rng: () => number): T {
  if (arr.length === 0) throw new Error('Cannot pick from empty array');
  const index = Math.floor(rng() * arr.length);
  return arr[index];
}

/**
 * Generate a single syllable based on template and phoneme inventories
 */
export function generateSyllable(
  template: string, // e.g. "CV", "CVC", "CCV", "CCVCC"
  config: LanguageConfig,
  rng: () => number,
  options?: {
    forcedOnsetManner?: 'plosive' | 'fricative' | 'nasal' | 'vowel' | 'any';
    forcedInitialPhonemes?: string[];
    bannedInitialPhonemes?: string[];
    forcedVowel?: PhonemeDef;
  }
): { romanization: string; ipa: string; onsetCount: number; codaCount: number } {
  let romanResult = '';
  let ipaResult = '';
  let onsetCount = 0;
  let codaCount = 0;
  let inCoda = false;

  const fallbackConsonants: PhonemeDef[] = [
    { symbol: 'k', romanization: 'k', category: 'consonant', manner: 'plosive', place: 'velar' },
    { symbol: 't', romanization: 't', category: 'consonant', manner: 'plosive', place: 'alveolar' },
    { symbol: 'm', romanization: 'm', category: 'consonant', manner: 'nasal', place: 'bilabial' },
    { symbol: 's', romanization: 's', category: 'consonant', manner: 'fricative', place: 'alveolar' },
  ];
  const fallbackVowels: PhonemeDef[] = [
    { symbol: 'a', romanization: 'a', category: 'vowel', height: 'open', backness: 'central' },
    { symbol: 'i', romanization: 'i', category: 'vowel', height: 'close', backness: 'front' },
    { symbol: 'u', romanization: 'u', category: 'vowel', height: 'close', backness: 'back' },
  ];

  const consonants = config.consonantInventory.length > 0 ? config.consonantInventory : fallbackConsonants;
  const vowels = config.vowelInventory.length > 0 ? config.vowelInventory : fallbackVowels;

  for (let i = 0; i < template.length; i++) {
    const char = template[i];
    if (char === 'C') {
      let pool = consonants;

      // Check initial constraint on first onset
      if (i === 0) {
        if (options?.forcedInitialPhonemes && options.forcedInitialPhonemes.length > 0) {
          const matchPool = pool.filter(p => options.forcedInitialPhonemes?.includes(p.romanization));
          if (matchPool.length > 0) pool = matchPool;
        }

        if (options?.bannedInitialPhonemes && options.bannedInitialPhonemes.length > 0) {
          const filterPool = pool.filter(p => !options.bannedInitialPhonemes?.includes(p.romanization));
          if (filterPool.length > 0) pool = filterPool;
        }

        if (options?.forcedOnsetManner && options.forcedOnsetManner !== 'any') {
          if (options.forcedOnsetManner === 'plosive') {
            const plosives = pool.filter(isPlosive);
            if (plosives.length > 0) pool = plosives;
          } else if (options.forcedOnsetManner === 'fricative') {
            const fricatives = pool.filter(isFricative);
            if (fricatives.length > 0) pool = fricatives;
          } else if (options.forcedOnsetManner === 'nasal') {
            const nasals = pool.filter(isNasal);
            if (nasals.length > 0) pool = nasals;
          }
        }
      }

      const picked = pick(pool, rng);
      romanResult += picked.romanization;
      ipaResult += picked.symbol;

      if (!inCoda) onsetCount++;
      else codaCount++;
    } else if (char === 'V') {
      inCoda = true; // After vowel, next consonants are codas
      const pickedVowel = options?.forcedVowel || pick(vowels, rng);
      romanResult += pickedVowel.romanization;
      ipaResult += pickedVowel.symbol;
    }
  }

  return { romanization: romanResult, ipa: ipaResult, onsetCount, codaCount };
}

/**
 * Apply sound law replacements and sanitize illegal sequences
 */
export function applySoundLaws(word: string, config: LanguageConfig): string {
  let cleaned = word;

  // 1. Check geminate ban if configured
  if (!config.syllableConfig.allowGeminates) {
    cleaned = cleaned.replace(/([b-df-hj-np-tv-zščžćđřňľ'])\1+/gi, '$1');
  }

  // 2. Prohibit double glottal stops
  cleaned = cleaned.replace(/''+/g, "'");

  // 3. Apply custom sound laws
  for (const law of config.soundLaws) {
    try {
      const reg = new RegExp(law.pattern, 'g');
      cleaned = cleaned.replace(reg, law.replacement);
    } catch {
      // Ignore invalid regex
    }
  }

  // 4. Ban explicit banned sequences
  for (const banned of config.bannedSequences) {
    if (banned && cleaned.includes(banned)) {
      // soften or break up banned sequence
      cleaned = cleaned.split(banned).join(banned[0] + 'a' + (banned[1] || ''));
    }
  }

  return cleaned;
}

/**
 * Apply stress deterministically
 */
export function assignStress(
  syllables: string[],
  rule: StressRule
): { syllables: string[]; stressIndex: number } {
  const n = syllables.length;
  if (n === 0) return { syllables: [], stressIndex: 0 };
  if (n === 1) return { syllables: [syllables[0]], stressIndex: 0 };

  let stressIndex = 0;

  switch (rule) {
    case 'initial':
      stressIndex = 0;
      break;
    case 'penultimate':
      stressIndex = Math.max(0, n - 2);
      break;
    case 'ultimate':
      stressIndex = n - 1;
      break;
    case 'antepenultimate':
      stressIndex = Math.max(0, n - 3);
      break;
    case 'heavy-syllable':
      // Look for syllable with coda consonant or apostrophe
      const heavyIdx = syllables.findIndex(s => s.length > 2 || s.includes("'"));
      stressIndex = heavyIdx >= 0 ? heavyIdx : Math.max(0, n - 2);
      break;
  }

  return { syllables, stressIndex };
}

/**
 * Format Romanized word with stress accent or indicator
 */
export function formatStressedWord(
  syllables: string[],
  stressIndex: number,
  romanized: string
): string {
  if (syllables.length <= 1) return romanized;
  // Use clean Slavic Romanization
  return syllables.join('');
}

export function romanToIpa(roman: string, config: LanguageConfig): string {
  let result = roman;

  // Custom letters IPA conversion (multi-char first)
  if (config.customLetters && config.customLetters.length > 0) {
    const sorted = [...config.customLetters].sort((a, b) => b.romanization.length - a.romanization.length);
    for (const cl of sorted) {
      if (cl.romanization && cl.ipa) {
        const cleanIpa = cl.ipa.replace(/^\/|\/$/g, '');
        const escaped = cl.romanization.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        result = result.replace(new RegExp(escaped, 'g'), cleanIpa);
      }
    }
  }

  // Slavic conversions
  result = result.replace(/š/g, 'ʃ');
  result = result.replace(/č/g, 'tʃ');
  result = result.replace(/ž/g, 'ʒ');
  result = result.replace(/ć/g, 'tɕ');
  result = result.replace(/đ/g, 'dʑ');
  result = result.replace(/ř/g, 'r̝');
  result = result.replace(/ň/g, 'ɲ');
  result = result.replace(/ľ/g, 'ʎ');
  result = result.replace(/c/g, 'ts');
  result = result.replace(/'/g, 'ʔ');
  result = result.replace(/y/g, 'ɨ');
  result = result.replace(/ü/g, 'y');
  result = result.replace(/ö/g, 'ø');
  result = result.replace(/ě/g, 'i̯ɛ');
  result = result.replace(/x/g, 'x');

  return `/${result}/`;
}

/**
 * Apply linear vector weight accumulation/reduction/centering
 */
export function applyLinearVector(
  syllables: string[],
  vector: LinearVector,
  rng: () => number
): string[] {
  if (syllables.length <= 1) return syllables;

  switch (vector) {
    case 'ltr-accumulation':
      // Words accumulate syllable complexity from left to right (e.g. coda added to final syllable)
      return syllables.map((syl, idx) => {
        if (idx === syllables.length - 1 && !syl.endsWith('k') && !syl.endsWith('n') && !syl.endsWith('r')) {
          const codas = ['r', 'k', 'n', 'š', 't'];
          return syl + codas[Math.floor(rng() * codas.length)];
        }
        return syl;
      });

    case 'rtl-reduction':
      // Syllables reduce toward right (lighter codas, simpler phonotactics at the end)
      return syllables.map((syl, idx) => {
        if (idx === syllables.length - 1 && syl.length > 2) {
          // Soften/open the ending
          return syl.replace(/[ptk]/g, '');
        }
        return syl;
      });

    case 'balanced-centering':
      // Centered nucleus: heaviest syllable in the center, lighter on the flanks
      if (syllables.length >= 3) {
        const mid = Math.floor(syllables.length / 2);
        const copy = [...syllables];
        if (!copy[mid].includes("'")) {
          copy[mid] = copy[mid].slice(0, 1) + "'" + copy[mid].slice(1);
        }
        return copy;
      }
      return syllables;

    default:
      return syllables;
  }
}

/**
 * Apply geometric or diagonal morphology
 */
export function applyGeometricMorphology(
  syllables: string[],
  morphology: GeometricMorphology
): { syllables: string[]; matrixVisual?: string[][] } {
  if (morphology === 'none' || syllables.length === 0) {
    return { syllables };
  }

  if (morphology === 'diagonal-matrix') {
    // Vowels step diagonally across consonant matrices:
    // Grid: C1 V1 | C2 V2
    // If we have 2+ syllables, we alternate consonant onset and mirror vowel step
    const result: string[] = [];
    for (let i = 0; i < syllables.length; i++) {
      let syl = syllables[i];
      if (i % 2 === 1) {
        // Diagonal step: swap coda/onset position or insert apostrophe boundary
        syl = syl.includes("'") ? syl : syl.slice(0, 1) + "'" + syl.slice(1);
      }
      result.push(syl);
    }
    return { syllables: result };
  }

  if (morphology === 'mirror-back-front') {
    // Alternating prefix/suffix patterns that mirror back-to-front
    if (syllables.length >= 2) {
      const first = syllables[0];
      const last = syllables[syllables.length - 1];
      const mirroredLast = last.split('').reverse().join('').replace(/''/g, "'");
      const res = [...syllables];
      res[res.length - 1] = mirroredLast;
      return { syllables: res };
    }
  }

  return { syllables };
}
