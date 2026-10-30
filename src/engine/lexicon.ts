/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ConlangWord,
  CustomVocabularyOverride,
  LanguageConfig,
  PartOfSpeech,
} from './types';
import {
  applyGeometricMorphology,
  applyLinearVector,
  applySoundLaws,
  assignStress,
  createRng,
  generateSyllable,
  romanToIpa,
} from './phonology';
import { inferAnimacy } from './morphology';
import { buildNativeGlyphMap, transliterateToNativeUnicode } from './scriptGenerator';

export interface BaseVocabularyConcept {
  english: string;
  pos: PartOfSpeech;
  category: string;
}

export const CORE_CONCEPTS: BaseVocabularyConcept[] = [
  // People & Beings
  { english: 'king', pos: 'n', category: 'Society' },
  { english: 'queen', pos: 'n', category: 'Society' },
  { english: 'warrior', pos: 'n', category: 'Society' },
  { english: 'hunter', pos: 'n', category: 'Society' },
  { english: 'person', pos: 'n', category: 'Beings' },
  { english: 'man', pos: 'n', category: 'Beings' },
  { english: 'woman', pos: 'n', category: 'Beings' },
  { english: 'child', pos: 'n', category: 'Beings' },
  { english: 'friend', pos: 'n', category: 'Society' },
  { english: 'enemy', pos: 'n', category: 'Society' },
  { english: 'god', pos: 'n', category: 'Spiritual' },
  { english: 'spirit', pos: 'n', category: 'Spiritual' },
  { english: 'wolf', pos: 'n', category: 'Fauna' },
  { english: 'dog', pos: 'n', category: 'Fauna' },
  { english: 'horse', pos: 'n', category: 'Fauna' },
  { english: 'bird', pos: 'n', category: 'Fauna' },
  { english: 'bear', pos: 'n', category: 'Fauna' },
  { english: 'dragon', pos: 'n', category: 'Myth' },

  // Nature & Elements
  { english: 'sun', pos: 'n', category: 'Nature' },
  { english: 'moon', pos: 'n', category: 'Nature' },
  { english: 'star', pos: 'n', category: 'Nature' },
  { english: 'sky', pos: 'n', category: 'Nature' },
  { english: 'fire', pos: 'n', category: 'Nature' },
  { english: 'water', pos: 'n', category: 'Nature' },
  { english: 'earth', pos: 'n', category: 'Nature' },
  { english: 'stone', pos: 'n', category: 'Nature' },
  { english: 'mountain', pos: 'n', category: 'Nature' },
  { english: 'river', pos: 'n', category: 'Nature' },
  { english: 'tree', pos: 'n', category: 'Flora' },
  { english: 'forest', pos: 'n', category: 'Flora' },
  { english: 'wind', pos: 'n', category: 'Nature' },
  { english: 'storm', pos: 'n', category: 'Nature' },
  { english: 'night', pos: 'n', category: 'Time' },
  { english: 'day', pos: 'n', category: 'Time' },

  // Objects & Body
  { english: 'house', pos: 'n', category: 'Objects' },
  { english: 'sword', pos: 'n', category: 'Objects' },
  { english: 'shield', pos: 'n', category: 'Objects' },
  { english: 'crown', pos: 'n', category: 'Objects' },
  { english: 'book', pos: 'n', category: 'Objects' },
  { english: 'path', pos: 'n', category: 'Objects' },
  { english: 'eye', pos: 'n', category: 'Anatomy' },
  { english: 'hand', pos: 'n', category: 'Anatomy' },
  { english: 'heart', pos: 'n', category: 'Anatomy' },
  { english: 'blood', pos: 'n', category: 'Anatomy' },

  // Actions / Verbs
  { english: 'see', pos: 'v', category: 'Perception' },
  { english: 'hear', pos: 'v', category: 'Perception' },
  { english: 'know', pos: 'v', category: 'Cognition' },
  { english: 'speak', pos: 'v', category: 'Communication' },
  { english: 'walk', pos: 'v', category: 'Motion' },
  { english: 'run', pos: 'v', category: 'Motion' },
  { english: 'stand', pos: 'v', category: 'Motion' },
  { english: 'fly', pos: 'v', category: 'Motion' },
  { english: 'eat', pos: 'v', category: 'Survival' },
  { english: 'drink', pos: 'v', category: 'Survival' },
  { english: 'sleep', pos: 'v', category: 'Survival' },
  { english: 'die', pos: 'v', category: 'Life' },
  { english: 'live', pos: 'v', category: 'Life' },
  { english: 'kill', pos: 'v', category: 'Conflict' },
  { english: 'protect', pos: 'v', category: 'Conflict' },
  { english: 'conquer', pos: 'v', category: 'Conflict' },
  { english: 'give', pos: 'v', category: 'Action' },
  { english: 'take', pos: 'v', category: 'Action' },
  { english: 'make', pos: 'v', category: 'Action' },
  { english: 'love', pos: 'v', category: 'Emotion' },

  // Qualities / Adjectives
  { english: 'great', pos: 'adj', category: 'Property' },
  { english: 'small', pos: 'adj', category: 'Property' },
  { english: 'good', pos: 'adj', category: 'Property' },
  { english: 'dark', pos: 'adj', category: 'Property' },
  { english: 'bright', pos: 'adj', category: 'Property' },
  { english: 'sacred', pos: 'adj', category: 'Spiritual' },
  { english: 'ancient', pos: 'adj', category: 'Time' },
  { english: 'new', pos: 'adj', category: 'Time' },
  { english: 'cold', pos: 'adj', category: 'Sensory' },
  { english: 'hot', pos: 'adj', category: 'Sensory' },
  { english: 'strong', pos: 'adj', category: 'Property' },
  { english: 'swift', pos: 'adj', category: 'Motion' },
  { english: 'deep', pos: 'adj', category: 'Spatial' },

  // Connectors & Grammar particles
  { english: 'in', pos: 'prep', category: 'Grammar' },
  { english: 'at', pos: 'prep', category: 'Grammar' },
  { english: 'with', pos: 'prep', category: 'Grammar' },
  { english: 'from', pos: 'prep', category: 'Grammar' },
  { english: 'to', pos: 'prep', category: 'Grammar' },
  { english: 'and', pos: 'conj', category: 'Grammar' },
  { english: 'but', pos: 'conj', category: 'Grammar' },
  { english: 'not', pos: 'adv', category: 'Grammar' },
];

/**
 * Parse custom override lines formatted as:
 * "English word : POS = Custom Conlang Word"
 * e.g. "king : n = rath'mor"
 */
export function parseCustomVocabularyOverrides(text: string): CustomVocabularyOverride[] {
  const overrides: CustomVocabularyOverride[] = [];
  const lines = text.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;

    // Pattern: english : pos = conlang
    const match = line.match(/^([^:=]+)(?::\s*([a-z]+))?\s*=\s*(.+)$/i);
    if (match) {
      const english = match[1].trim().toLowerCase();
      const pos = (match[2]?.trim().toLowerCase() as PartOfSpeech) || 'n';
      const conlang = match[3].trim().toLowerCase();
      overrides.push({
        english,
        pos,
        conlang,
      });
    }
  }

  return overrides;
}

/**
 * Extract underlying phonological rules from custom words to organically inform generator
 */
export function extractPhonologicalRulesFromOverrides(
  overrides: CustomVocabularyOverride[]
): {
  frequentOnsets: string[];
  frequentVowels: string[];
  frequentCodas: string[];
  glottalFrequency: number;
} {
  const onsets: Record<string, number> = {};
  const vowels: Record<string, number> = {};
  const codas: Record<string, number> = {};
  let totalWords = overrides.length;
  let glottalCount = 0;

  for (const item of overrides) {
    const word = item.conlang;
    if (word.includes("'")) glottalCount++;

    // Initial character / cluster
    const initMatch = word.match(/^[b-df-hj-np-tv-zščžćđřňľ']+/i);
    if (initMatch) {
      const init = initMatch[0].toLowerCase();
      onsets[init] = (onsets[init] || 0) + 1;
    }

    // Vowels
    const vowelMatches = word.match(/[aeiouyäöüě]+/gi);
    if (vowelMatches) {
      for (const v of vowelMatches) {
        const vlow = v.toLowerCase();
        vowels[vlow] = (vowels[vlow] || 0) + 1;
      }
    }

    // Final coda
    const codaMatch = word.match(/[b-df-hj-np-tv-zščžćđřňľ']+$/i);
    if (codaMatch) {
      const coda = codaMatch[0].toLowerCase();
      codas[coda] = (codas[coda] || 0) + 1;
    }
  }

  const sortTop = (dict: Record<string, number>, top = 3) =>
    Object.entries(dict)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, top);

  return {
    frequentOnsets: sortTop(onsets),
    frequentVowels: sortTop(vowels),
    frequentCodas: sortTop(codas),
    glottalFrequency: totalWords > 0 ? glottalCount / totalWords : 0,
  };
}

/**
 * Generate a complete dictionary for the language configuration
 */
export function generateLexicon(config: LanguageConfig): ConlangWord[] {
  // If the language is a pristine blank canvas with no phonemes and no overrides yet,
  // return an empty lexicon waiting for user input.
  if (
    config.consonantInventory.length === 0 &&
    config.vowelInventory.length === 0 &&
    config.customOverrides.length === 0
  ) {
    return [];
  }

  const words: ConlangWord[] = [];
  const glyphMap = buildNativeGlyphMap(
    config.consonantInventory,
    config.vowelInventory,
    config.scriptStyle,
    config.customLetters
  );

  // Extract rules from any custom overrides
  const extracted = extractPhonologicalRulesFromOverrides(config.customOverrides);

  // 1. Process custom overrides first (preserves exact user strings)
  const customMap = new Map<string, CustomVocabularyOverride>();
  for (const override of config.customOverrides) {
    customMap.set(override.english.toLowerCase(), override);
  }

  // 2. Generate words for all core concepts + overrides
  const allConcepts = [...CORE_CONCEPTS];
  for (const override of config.customOverrides) {
    if (!allConcepts.some(c => c.english.toLowerCase() === override.english.toLowerCase())) {
      allConcepts.push({
        english: override.english,
        pos: override.pos,
        category: 'Custom',
      });
    }
  }

  for (const concept of allConcepts) {
    const override = customMap.get(concept.english.toLowerCase());

    if (override) {
      // Use exact custom conlang word
      const syllables = override.conlang.split(/['\-]/).filter(Boolean);
      const stress = assignStress(syllables, config.stressRule);
      const ipa = override.ipa || romanToIpa(override.conlang, config);
      const nativeScript = transliterateToNativeUnicode(override.conlang, glyphMap);

      words.push({
        id: `word-${concept.english}`,
        conlang: override.conlang,
        nativeScript,
        ipa,
        english: concept.english,
        pos: concept.pos,
        animacy: inferAnimacy(concept.english),
        syllables: syllables.length > 0 ? syllables : [override.conlang],
        stressIndex: stress.stressIndex,
        isCustomOverride: true,
      });
      continue;
    }

    // Procedural generation using deterministic seed for the word
    const rng = createRng(`${config.id}-${concept.english}-${concept.pos}`);
    const templates = config.syllableConfig.templates.length > 0 ? config.syllableConfig.templates : ['CV'];

    // Check conditional constraints for POS
    let forcedOnsetManner: 'plosive' | 'fricative' | 'nasal' | 'vowel' | 'any' = 'any';
    for (const rule of config.initialConstraints.conditionalConstraints) {
      if (rule.pos === concept.pos) {
        forcedOnsetManner = rule.requiredClass;
        break;
      }
    }

    // Number of syllables based on POS
    let numSyllables = 1;
    if (concept.pos === 'v' || concept.pos === 'n') {
      numSyllables = rng() > 0.45 ? 2 : 1;
      if (concept.pos === 'v' && rng() > 0.85) numSyllables = 3;
    } else if (concept.pos === 'adj') {
      numSyllables = rng() > 0.4 ? 2 : 1;
    }

    const customSyllablesList = config.syllableConfig.customSyllables || [];
    const syllables: string[] = [];
    for (let s = 0; s < numSyllables; s++) {
      // If user has defined custom syllables, give high opportunity to use them
      const canUseCustom = customSyllablesList.length > 0 && (rng() > 0.4 || customSyllablesList.some(cs => cs.isMandatoryRoot));
      if (canUseCustom) {
        // Weighted selection of user custom syllable
        const chosenCustom = customSyllablesList[Math.floor(rng() * customSyllablesList.length)];
        if (chosenCustom && chosenCustom.romanization) {
          syllables.push(chosenCustom.romanization);
          continue;
        }
      }

      const template = templates[Math.floor(rng() * templates.length)] || 'CVC';
      const isInitial = s === 0;

      const syl = generateSyllable(template, config, rng, {
        forcedOnsetManner: isInitial ? forcedOnsetManner : 'any',
        forcedInitialPhonemes: isInitial && config.initialConstraints.requiredStartingSounds.length > 0
          ? config.initialConstraints.requiredStartingSounds
          : undefined,
        bannedInitialPhonemes: isInitial && config.initialConstraints.prohibitedStartingSounds.length > 0
          ? config.initialConstraints.prohibitedStartingSounds
          : undefined,
      });

      syllables.push(syl.romanization);
    }

    // Apply linear vector accumulation / centering
    let vectorSyllables = applyLinearVector(syllables, config.linearVector, rng);

    // Apply geometric morphology
    const geomResult = applyGeometricMorphology(vectorSyllables, config.geometricMorphology);
    vectorSyllables = geomResult.syllables;

    // Join and apply sound laws
    let joined = vectorSyllables.join('');
    joined = applySoundLaws(joined, config);

    // Assign deterministic stress
    const stress = assignStress(vectorSyllables, config.stressRule);
    const ipa = romanToIpa(joined, config);
    const nativeScript = transliterateToNativeUnicode(joined, glyphMap);

    words.push({
      id: `word-${concept.english}`,
      conlang: joined,
      nativeScript,
      ipa,
      english: concept.english,
      pos: concept.pos,
      animacy: inferAnimacy(concept.english),
      syllables: vectorSyllables,
      stressIndex: stress.stressIndex,
      isCustomOverride: false,
    });
  }

  // Sort alphabetically by English translation
  return words.sort((a, b) => a.english.localeCompare(b.english));
}
