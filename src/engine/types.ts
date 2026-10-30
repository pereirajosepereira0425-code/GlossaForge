/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PartOfSpeech = 'n' | 'v' | 'adj' | 'adv' | 'pron' | 'prep' | 'conj' | 'num';

export type WordOrder = 'SOV' | 'SVO' | 'VSO' | 'VOS' | 'OVS' | 'OSV';

export type MorphologicalType = 'isolating' | 'agglutinative' | 'fusional' | 'polysynthetic';

export type LinearVector = 'ltr-accumulation' | 'rtl-reduction' | 'balanced-centering';

export type GeometricMorphology = 'none' | 'diagonal-matrix' | 'vertical-stack' | 'mirror-back-front';

export type StressRule = 'initial' | 'penultimate' | 'ultimate' | 'antepenultimate' | 'heavy-syllable';

export type AnimacyClass = 'animate' | 'inanimate';

export interface CustomLetter {
  id: string;
  romanization: string;
  ipaSymbol?: string;
  ipa?: string;
  symbol?: string;
  unicodeHex: string;
  category: 'consonant' | 'vowel';
  manner?: string;
  place?: string;
  height?: string;
  backness?: string;
  speechHint?: string;
  speechPronunciation?: string;
  svgPath?: string;
  imageDataUrl?: string;
  audioDataUrl?: string;
  strokeType?: string;
  createdAt?: number;
}

export interface PhonemeDef {
  symbol: string;         // IPA symbol e.g. "ʃ", "tʃ", "ʔ", "k"
  romanization: string;   // Slavic style e.g. "š", "č", "'", "k"
  category: 'consonant' | 'vowel';
  manner?: string;        // plosive, nasal, fricative, affricate, approximant, trill
  place?: string;         // bilabial, dental, alveolar, postalveolar, palatal, velar, glottal
  height?: string;        // close, mid, open
  backness?: string;      // front, central, back
  rounded?: boolean;
  isCustom?: boolean;
  customId?: string;
  unicodeHex?: string;
  customUnicode?: string;
  svgPath?: string;
  customSvgPath?: string;
  imageDataUrl?: string;
  customImageUrl?: string;
  audioDataUrl?: string;
}

export interface SoundLawRule {
  id: string;
  pattern: string;        // regex or string
  replacement: string;
  description: string;
}

export interface InitialConstraints {
  requiredStartingSounds: string[]; // sounds that can initiate root words
  prohibitedStartingSounds: string[]; // banned initial sounds
  conditionalConstraints: {
    pos: PartOfSpeech;
    requiredClass: 'plosive' | 'fricative' | 'nasal' | 'vowel' | 'any';
    description: string;
  }[];
}

export interface PronounParadigmItem {
  person: '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl';
  animate: string;        // affix for animate
  inanimate: string;      // affix for inanimate
  role: 'subject' | 'object' | 'possessive';
}

export interface PronounRules {
  attachmentType: 'prefix' | 'suffix' | 'infix';
  verbSubjectAttachment: 'prefix' | 'suffix';
  verbObjectAttachment: 'prefix' | 'suffix' | 'infix';
  nounPossessiveAttachment: 'prefix' | 'suffix';
  paradigms: PronounParadigmItem[];
}

export interface CaseMarker {
  caseName: 'nominative' | 'accusative' | 'genitive' | 'dative' | 'locative' | 'instrumental';
  suffix: string;
  description: string;
}

export interface TenseMarker {
  tense: 'present' | 'past' | 'future' | 'perfect';
  affix: string;
  position: 'prefix' | 'suffix';
}

export interface CustomVocabularyOverride {
  english: string;
  pos: PartOfSpeech;
  conlang: string;
  ipa?: string;
  gloss?: string;
  notes?: string;
}

export interface CustomSyllableDefinition {
  id: string;
  romanization: string;       // e.g. "kra", "vel", "mor" or custom syllable with custom characters
  ipa?: string;               // e.g. "kɾa", "vɛl"
  nativeScript?: string;      // Unicode/PUA representation with custom glyphs
  structure?: string;         // e.g. "CCV", "CVC"
  meaningOrLore?: string;     // e.g. "Sacred spirit syllable", "Prefix root"
  characterIds?: string[];    // IDs of custom letters or glyphs used
  weight?: number;            // Selection frequency probability (1–5)
  isMandatoryRoot?: boolean;  // If true, generator regularly injects this into root words
  createdAt?: string;
}

export interface SyllableTemplateConfig {
  templates: string[];        // e.g. ["CV", "CVC", "CCV", "CCVCC"]
  maxOnsetConsonants: number; // e.g. 2
  maxCodaConsonants: number;  // e.g. 2
  allowGeminates: boolean;
  vowelHarmony: 'none' | 'front-back' | 'height';
  customSyllables?: CustomSyllableDefinition[]; // User's own defined syllables with custom characters
}

export interface NativeGlyph {
  phoneme: string;
  romanization: string;
  unicodeHex: string;       // e.g. "E001"
  glyphChar: string;        // Character code for display
  svgPath: string;          // Mathematical vector path for rendering
  strokeType: 'runic' | 'geometric-fluid' | 'celestial-featural' | 'cuneiform-matrix' | 'custom-drawn';
  imageDataUrl?: string;
  audioDataUrl?: string;
  isCustom?: boolean;
}

export interface CustomAudioAttachment {
  id: string;
  wordOrPhrase: string;
  source: 'recorded' | 'file-upload';
  audioBlobUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType: string;
  durationSeconds?: number;
  recordedAt: string;
}

export interface ConlangWord {
  id: string;
  conlang: string;          // Slavic romanized
  nativeScript: string;     // Procedural Unicode/PUA string
  ipa: string;              // Full IPA transcription
  english: string;
  pos: PartOfSpeech;
  animacy?: AnimacyClass;
  etymology?: string;
  syllables: string[];
  stressIndex: number;
  isCustomOverride?: boolean;
  customAudio?: CustomAudioAttachment;
}

export interface CustomDrawnGlyph {
  id: string;
  name: string;
  romanization: string;
  phonemeSymbol: string;
  unicodeHex: string;
  glyphChar: string;
  svgPath: string;
  imageUrl?: string;
  strokeType: 'custom-drawn' | 'image-based' | string;
  createdAt: string;
}

export interface LanguageConfig {
  id: string;
  name: string;
  motto: string;
  description: string;
  morphologyType: MorphologicalType;
  wordOrder: WordOrder;
  headDirection: 'head-initial' | 'head-final';
  linearVector: LinearVector;
  geometricMorphology: GeometricMorphology;
  stressRule: StressRule;
  initialConstraints: InitialConstraints;
  syllableConfig: SyllableTemplateConfig;
  consonantInventory: PhonemeDef[];
  vowelInventory: PhonemeDef[];
  bannedSequences: string[];
  soundLaws: SoundLawRule[];
  pronounRules: PronounRules;
  cases: CaseMarker[];
  tenses: TenseMarker[];
  pluralAffix: { affix: string; position: 'prefix' | 'suffix' };
  customOverrides: CustomVocabularyOverride[];
  customLetters: CustomLetter[];
  customGlyphs?: CustomDrawnGlyph[];
  scriptStyle: 'runic' | 'geometric-fluid' | 'celestial-featural' | 'cuneiform-matrix';
}

export interface TranslationToken {
  original: string;
  stem: string;
  pos: PartOfSpeech;
  conlangStem: string;
  conlangFull: string;
  nativeScript: string;
  ipa: string;
  animacy: AnimacyClass;
  grammaticalTags: string[];
  gloss: string;
}

export interface TranslationResult {
  inputSentence: string;
  translatedRomanized: string;
  translatedNativeScript: string;
  ipa: string;
  gloss: string;
  reorderedStructure: string;
  tokens: TranslationToken[];
  phoneticAudioGuide: {
    pacingDescription: string;
    syllableCadence: string;
    stressContour: string;
    speechPrompt: string;
  };
  customAudio?: CustomAudioAttachment;
}
