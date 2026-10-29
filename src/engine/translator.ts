/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AnimacyClass,
  ConlangWord,
  LanguageConfig,
  PartOfSpeech,
  TranslationResult,
  TranslationToken,
  WordOrder,
} from './types';
import {
  applyCase,
  applyPlural,
  attachPossessiveToNoun,
  inferAnimacy,
  inflectVerb,
} from './morphology';
import {
  applySoundLaws,
  createRng,
  generateSyllable,
  romanToIpa,
} from './phonology';
import { buildNativeGlyphMap, transliterateToNativeUnicode } from './scriptGenerator';

interface ParsedSentence {
  subject?: { text: string; person: '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl'; animacy: AnimacyClass; isPronounOnly: boolean };
  verb?: { text: string; stem: string; tense: 'present' | 'past' | 'future' | 'perfect' };
  object?: { text: string; person: '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl' | null; animacy: AnimacyClass; possessor?: '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl'; isPlural: boolean };
  modifiers: { text: string; pos: PartOfSpeech }[];
}

/**
 * Identify grammatical person from an English pronoun or noun
 */
function identifyPerson(word: string): '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl' | null {
  const w = word.toLowerCase();
  if (w === 'i' || w === 'me') return '1sg';
  if (w === 'you') return '2sg';
  if (w === 'he' || w === 'him' || w === 'she' || w === 'her' || w === 'it') return '3sg';
  if (w === 'we' || w === 'us') return '1pl';
  if (w === 'they' || w === 'them') return '3pl';
  return null;
}

/**
 * Identify possessor from words like 'my', 'your', 'his', 'her', 'our', 'their'
 */
function identifyPossessor(word: string): '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl' | null {
  const w = word.toLowerCase();
  if (w === 'my') return '1sg';
  if (w === 'your') return '2sg';
  if (w === 'his' || w === 'her' || w === 'its') return '3sg';
  if (w === 'our') return '1pl';
  if (w === 'their') return '3pl';
  return null;
}

/**
 * Look up or dynamically synthesize a Conlang word for an English concept
 */
export function getOrDeriveWord(
  english: string,
  pos: PartOfSpeech,
  lexicon: ConlangWord[],
  config: LanguageConfig
): ConlangWord {
  const cleanEnglish = english.toLowerCase().replace(/[^a-z']/g, '');

  // 1. Direct lexicon lookup
  const match = lexicon.find(
    w => w.english.toLowerCase() === cleanEnglish || (w.english.toLowerCase() === cleanEnglish && w.pos === pos)
  );
  if (match) return match;

  // 2. Fallback procedural derivation respecting the language's phonotactics
  const rng = createRng(`derive-${config.id}-${cleanEnglish}`);
  const templates = config.syllableConfig.templates;
  const template = templates[Math.floor(rng() * templates.length)] || 'CVC';
  const syl = generateSyllable(template, config, rng);

  let form = syl.romanization;
  form = applySoundLaws(form, config);

  const glyphMap = buildNativeGlyphMap(
    config.consonantInventory,
    config.vowelInventory,
    config.scriptStyle,
    config.customLetters
  );
  const nativeScript = transliterateToNativeUnicode(form, glyphMap);
  const ipa = romanToIpa(form, config);

  return {
    id: `derived-${cleanEnglish}`,
    conlang: form,
    nativeScript,
    ipa,
    english: cleanEnglish,
    pos,
    animacy: inferAnimacy(cleanEnglish),
    syllables: [form],
    stressIndex: 0,
    isCustomOverride: false,
  };
}

/**
 * Generate a descriptive phonetic audio guide for the sentence
 */
export function generatePhoneticAudioGuide(
  conlangPhrase: string,
  ipa: string,
  config: LanguageConfig
): {
  pacingDescription: string;
  syllableCadence: string;
  stressContour: string;
  speechPrompt: string;
} {
  const words = conlangPhrase.split(/\s+/);
  const hasGlottals = conlangPhrase.includes("'");
  const hasDiacritics = /[ščžćđřňľ]/.test(conlangPhrase);

  let pacing = 'Moderate, rhythmic cadence';
  if (config.morphologyType === 'agglutinative') {
    pacing = 'Staccato, evenly-metered mora-timed pacing with distinct affix transitions';
  } else if (config.morphologyType === 'fusional') {
    pacing = 'Fluid, stress-timed cadence with prominent tonic syllables';
  } else if (config.morphologyType === 'polysynthetic') {
    pacing = 'Sustained, continuous vocal arc with high structural tension';
  }

  const cadence = words
    .map(w => {
      const parts = w.split(/['\-]/).filter(Boolean);
      return parts.length > 1 ? `[${parts.join(' · ')}]` : `[${w}]`;
    })
    .join('  —  ');

  const stressContour = `Stress deterministically placed on ${config.stressRule} syllable. ${
    hasGlottals ? 'Glottal apostrophes (ʔ) require a distinct, sharp vocal closure.' : ''
  } ${hasDiacritics ? 'Slavic postalveolars and palatals voiced with crisp coronal friction.' : ''}`;

  const speechPrompt = `Speak in a disciplined, resonant tone matching ${config.name} (${config.morphologyType}): ${conlangPhrase} (${ipa})`;

  return {
    pacingDescription: pacing,
    syllableCadence: cadence,
    stressContour,
    speechPrompt,
  };
}

/**
 * Translate English sentence into Conlang with full grammar & phonetics
 */
export function translateSentence(
  inputSentence: string,
  config: LanguageConfig,
  lexicon: ConlangWord[]
): TranslationResult {
  const cleanInput = inputSentence.trim();
  if (!cleanInput) {
    return {
      inputSentence: '',
      translatedRomanized: '',
      translatedNativeScript: '',
      ipa: '',
      gloss: '',
      reorderedStructure: '',
      tokens: [],
      phoneticAudioGuide: {
        pacingDescription: '',
        syllableCadence: '',
        stressContour: '',
        speechPrompt: '',
      },
    };
  }

  const rawTokens = cleanInput.split(/\s+/);
  const glyphMap = buildNativeGlyphMap(
    config.consonantInventory,
    config.vowelInventory,
    config.scriptStyle,
    config.customLetters
  );

  // Single word translation mode
  if (rawTokens.length === 1) {
    const rawWord = rawTokens[0].toLowerCase().replace(/[^a-z']/g, '');
    const wordEntry = getOrDeriveWord(rawWord, 'n', lexicon, config);
    const audioGuide = generatePhoneticAudioGuide(wordEntry.conlang, wordEntry.ipa, config);

    const token: TranslationToken = {
      original: rawTokens[0],
      stem: wordEntry.english,
      pos: wordEntry.pos,
      conlangStem: wordEntry.conlang,
      conlangFull: wordEntry.conlang,
      nativeScript: wordEntry.nativeScript,
      ipa: wordEntry.ipa,
      animacy: wordEntry.animacy || inferAnimacy(wordEntry.english),
      grammaticalTags: ['ROOT'],
      gloss: wordEntry.english.toUpperCase(),
    };

    return {
      inputSentence: cleanInput,
      translatedRomanized: wordEntry.conlang,
      translatedNativeScript: wordEntry.nativeScript,
      ipa: wordEntry.ipa,
      gloss: wordEntry.english.toUpperCase(),
      reorderedStructure: 'Single Word',
      tokens: [token],
      phoneticAudioGuide: audioGuide,
    };
  }

  // Multi-word sentence parsing
  let subjectToken: TranslationToken | null = null;
  let verbToken: TranslationToken | null = null;
  let objectToken: TranslationToken | null = null;
  const modifierTokens: TranslationToken[] = [];
  const allParsedTokens: TranslationToken[] = [];

  let pendingPossessor: '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl' | null = null;
  let pastTense = false;
  let futureTense = false;

  for (let i = 0; i < rawTokens.length; i++) {
    const raw = rawTokens[i];
    const clean = raw.toLowerCase().replace(/[^a-z']/g, '');

    // Check auxiliary tense words
    if (clean === 'will' || clean === 'shall') {
      futureTense = true;
      continue;
    }
    if (clean === 'did' || clean === 'had') {
      pastTense = true;
      continue;
    }
    if (clean === 'the' || clean === 'a' || clean === 'an') {
      // Articles can be dropped or handled
      continue;
    }

    // Check possessor
    const poss = identifyPossessor(clean);
    if (poss) {
      pendingPossessor = poss;
      continue;
    }

    // Check pronoun
    const person = identifyPerson(clean);
    if (person && !verbToken) {
      // Subject pronoun
      const animacy: AnimacyClass = person === '3sg' && clean === 'it' ? 'inanimate' : 'animate';
      const wordEntry = getOrDeriveWord(clean, 'pron', lexicon, config);
      subjectToken = {
        original: raw,
        stem: clean,
        pos: 'pron',
        conlangStem: wordEntry.conlang,
        conlangFull: wordEntry.conlang,
        nativeScript: wordEntry.nativeScript,
        ipa: wordEntry.ipa,
        animacy,
        grammaticalTags: [person.toUpperCase(), 'SUBJ', animacy.toUpperCase()],
        gloss: `${person.toUpperCase()}.${animacy === 'animate' ? 'ANIM' : 'INAN'}`,
      };
      allParsedTokens.push(subjectToken);
      continue;
    }

    // Disambiguate verb vs noun accurately
    const exactNoun = lexicon.find(w => w.english.toLowerCase() === clean && w.pos === 'n');
    let isVerb = false;
    let verbStem = clean;
    let detectedTense: 'present' | 'past' | 'future' = pastTense ? 'past' : futureTense ? 'future' : 'present';

    const directVerb = lexicon.find(w => w.english.toLowerCase() === clean && w.pos === 'v');
    if (directVerb && !exactNoun) {
      isVerb = true;
      verbStem = directVerb.english;
    } else if (clean.endsWith('s') && clean.length > 3) {
      const stemWithoutS = clean.slice(0, -1);
      const vMatch = lexicon.find(w => w.english.toLowerCase() === stemWithoutS && w.pos === 'v');
      if (vMatch) {
        isVerb = true;
        verbStem = vMatch.english;
      }
    } else if (clean.endsWith('ed') && clean.length > 4) {
      const stemWithoutEd = clean.replace(/ed$/, '');
      const vMatch = lexicon.find(w => w.english.toLowerCase() === stemWithoutEd && w.pos === 'v') ||
                     lexicon.find(w => w.english.toLowerCase() === (stemWithoutEd + 'e') && w.pos === 'v');
      isVerb = true;
      detectedTense = 'past';
      verbStem = vMatch ? vMatch.english : stemWithoutEd;
    }

    if (!verbToken && isVerb) {
      const verbEntry = getOrDeriveWord(verbStem, 'v', lexicon, config);

      // Determine subject agreement person
      const subjPerson = subjectToken ? identifyPerson(subjectToken.stem) || '3sg' : '3sg';
      const subjAnimacy = subjectToken ? subjectToken.animacy : 'animate';

      // Inflect verb with tense and pronominal affixes
      const { fullForm, glossParts } = inflectVerb(
        verbEntry.conlang,
        detectedTense,
        subjPerson,
        subjAnimacy,
        null,
        'animate',
        config
      );

      const nativeScript = transliterateToNativeUnicode(fullForm, glyphMap);
      const ipa = romanToIpa(fullForm, config);

      verbToken = {
        original: raw,
        stem: verbEntry.english,
        pos: 'v',
        conlangStem: verbEntry.conlang,
        conlangFull: fullForm,
        nativeScript,
        ipa,
        animacy: 'inanimate',
        grammaticalTags: glossParts,
        gloss: glossParts.join('-'),
      };
      allParsedTokens.push(verbToken);
      continue;
    }

    // Noun / Object handling
    let nounStem = clean;
    let isPlural = false;
    if (clean.endsWith('s') && !clean.endsWith('ss') && clean.length > 3) {
      nounStem = clean.slice(0, -1);
      isPlural = true;
    }

    const nounEntry = getOrDeriveWord(nounStem, 'n', lexicon, config);
    const animacy = inferAnimacy(nounStem);
    let conlangForm = nounEntry.conlang;
    const glossTags = [nounStem.toUpperCase()];

    // Apply possessive suffix if pending (e.g. "my dog" -> "dog-1SG.ANIM.POSS")
    if (pendingPossessor) {
      const possResult = attachPossessiveToNoun(conlangForm, pendingPossessor, animacy, config);
      conlangForm = possResult.fullForm;
      glossTags.push(`${pendingPossessor.toUpperCase()}.${animacy === 'animate' ? 'ANIM' : 'INAN'}.POSS`);
      pendingPossessor = null;
    }

    // Apply plural
    if (isPlural) {
      const plurResult = applyPlural(conlangForm, config);
      conlangForm = plurResult.fullForm;
      glossTags.push('PLUR');
    }

    // If we already have a subject and verb, this noun is the Object!
    if (subjectToken && verbToken && !objectToken) {
      // Direct object: apply Accusative case marker if language has cases
      const caseResult = applyCase(conlangForm, 'accusative', config);
      conlangForm = caseResult.fullForm;
      glossTags.push(caseResult.glossTag);
    } else if (!subjectToken && !verbToken) {
      // First noun is Subject
      const caseResult = applyCase(conlangForm, 'nominative', config);
      conlangForm = caseResult.fullForm;
      glossTags.push(caseResult.glossTag);
    }

    const nativeScript = transliterateToNativeUnicode(conlangForm, glyphMap);
    const ipa = romanToIpa(conlangForm, config);

    const token: TranslationToken = {
      original: raw,
      stem: nounStem,
      pos: 'n',
      conlangStem: nounEntry.conlang,
      conlangFull: conlangForm,
      nativeScript,
      ipa,
      animacy,
      grammaticalTags: glossTags,
      gloss: glossTags.join('-'),
    };

    if (!subjectToken && !verbToken) {
      subjectToken = token;
    } else if (verbToken && !objectToken) {
      objectToken = token;
    } else {
      modifierTokens.push(token);
    }

    allParsedTokens.push(token);
  }

  // Order tokens strictly according to Word Order Typology (SOV, SVO, VSO, VOS, OVS, OSV)
  const orderedTokens: TranslationToken[] = [];
  const order = config.wordOrder;

  const pushComponent = (comp: 'S' | 'V' | 'O') => {
    if (comp === 'S' && subjectToken) orderedTokens.push(subjectToken);
    if (comp === 'V' && verbToken) orderedTokens.push(verbToken);
    if (comp === 'O' && objectToken) orderedTokens.push(objectToken);
  };

  for (let i = 0; i < order.length; i++) {
    pushComponent(order[i] as 'S' | 'V' | 'O');
  }

  // Append any lingering modifiers (adjectives, adverbs, prepositions)
  for (const mod of modifierTokens) {
    if (!orderedTokens.includes(mod)) {
      if (config.headDirection === 'head-initial') {
        orderedTokens.push(mod);
      } else {
        orderedTokens.unshift(mod);
      }
    }
  }

  // If no grammar structure detected, fall back to sequential tokens
  const finalTokens = orderedTokens.length > 0 ? orderedTokens : allParsedTokens;
  const translatedRomanized = finalTokens.map(t => t.conlangFull).join(' ');
  const translatedNativeScript = finalTokens.map(t => t.nativeScript).join('   ');
  const fullIpa = finalTokens.map(t => t.ipa.replace(/^\/|\/$/g, '')).join(' ');
  const fullGloss = finalTokens.map(t => t.gloss).join(' ');

  const audioGuide = generatePhoneticAudioGuide(translatedRomanized, `/${fullIpa}/`, config);

  return {
    inputSentence: cleanInput,
    translatedRomanized,
    translatedNativeScript,
    ipa: `/${fullIpa}/`,
    gloss: fullGloss,
    reorderedStructure: `${config.wordOrder} (${config.headDirection})`,
    tokens: finalTokens,
    phoneticAudioGuide: audioGuide,
  };
}
