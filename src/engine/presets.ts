/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LanguageConfig } from './types';
import { STANDARD_IPA_CONSONANTS, STANDARD_IPA_VOWELS } from './phonology';

export const PRESET_BLANK: LanguageConfig = {
  id: 'blank-canvas',
  name: '',
  motto: '',
  description: '',
  morphologyType: 'agglutinative',
  wordOrder: 'SVO',
  headDirection: 'head-initial',
  linearVector: 'ltr-accumulation',
  geometricMorphology: 'none',
  stressRule: 'initial',
  initialConstraints: {
    requiredStartingSounds: [],
    prohibitedStartingSounds: [],
    conditionalConstraints: [],
  },
  syllableConfig: {
    templates: [],
    maxOnsetConsonants: 0,
    maxCodaConsonants: 0,
    allowGeminates: false,
    vowelHarmony: 'none',
  },
  consonantInventory: [...STANDARD_IPA_CONSONANTS.slice(0, 8)],
  vowelInventory: [...STANDARD_IPA_VOWELS.slice(0, 5)],
  bannedSequences: [],
  soundLaws: [],
  pronounRules: {
    attachmentType: 'prefix',
    verbSubjectAttachment: 'prefix',
    verbObjectAttachment: 'suffix',
    nounPossessiveAttachment: 'suffix',
    paradigms: [],
  },
  cases: [],
  tenses: [],
  pluralAffix: { affix: '', position: 'suffix' },
  customOverrides: [],
  customLetters: [],
  scriptStyle: 'geometric-fluid',
};

export const PRESET_VALKYRISH: LanguageConfig = {
  id: 'valkyrish',
  name: "Val'kyriš",
  motto: 'Mora vel-re kran’an — The eternal spirit endures',
  description: 'An agglutinative northern highland tongue utilizing rich Slavic postalveolar diacritics, diagonal matrix vowel alternation, and strict animate/inanimate clitic distinction.',
  morphologyType: 'agglutinative',
  wordOrder: 'SOV',
  headDirection: 'head-final',
  linearVector: 'ltr-accumulation',
  geometricMorphology: 'diagonal-matrix',
  stressRule: 'penultimate',
  initialConstraints: {
    requiredStartingSounds: [],
    prohibitedStartingSounds: ['ng'],
    conditionalConstraints: [
      {
        pos: 'v',
        requiredClass: 'plosive',
        description: 'Verbs must initiate with a plosive stop [p, b, t, d, k, g, ʔ]',
      },
    ],
  },
  syllableConfig: {
    templates: ['CV', 'CVC', 'CCV', 'CCVCC'],
    maxOnsetConsonants: 2,
    maxCodaConsonants: 2,
    allowGeminates: false,
    vowelHarmony: 'front-back',
    customSyllables: [
      {
        id: 'syl-kra',
        romanization: 'kra',
        ipa: 'kɾa',
        structure: 'CCV',
        meaningOrLore: 'Sacred spirit root, used for vitality and eternal endurance',
        weight: 3,
        isMandatoryRoot: true,
      },
      {
        id: 'syl-vel',
        romanization: 'vel',
        ipa: 'vɛl',
        structure: 'CVC',
        meaningOrLore: 'Flowing highland wind or breath',
        weight: 2,
        isMandatoryRoot: false,
      },
      {
        id: 'syl-mor',
        romanization: 'mor',
        ipa: 'mɔr',
        structure: 'CVC',
        meaningOrLore: 'Mountain stone or deep foundation',
        weight: 2,
        isMandatoryRoot: false,
      },
    ],
  },
  consonantInventory: STANDARD_IPA_CONSONANTS.filter(c =>
    ['p', 'b', 't', 'd', 'k', 'g', "'", 'm', 'n', 'ň', 'r', 'ř', 's', 'z', 'š', 'ž', 'č', 'ć', 'l', 'ľ', 'j'].includes(c.romanization)
  ),
  vowelInventory: STANDARD_IPA_VOWELS.filter(v =>
    ['a', 'e', 'i', 'o', 'u', 'y', 'ě'].includes(v.romanization)
  ),
  bannedSequences: ['ii', 'uu', 'yy', "''"],
  soundLaws: [
    {
      id: 'sl-1',
      pattern: '([kpt])s',
      replacement: '$1c',
      description: 'Plosive + sibilant shifts to affricate',
    },
    {
      id: 'sl-2',
      pattern: '([aeiouy])([aeiouy])',
      replacement: "$1'$2",
      description: 'Vowel hiatus resolved with glottal stop apostrophe',
    },
  ],
  pronounRules: {
    attachmentType: 'suffix',
    verbSubjectAttachment: 'prefix',
    verbObjectAttachment: 'suffix',
    nounPossessiveAttachment: 'suffix',
    paradigms: [
      { person: '1sg', animate: '-ku', inanimate: '-ka', role: 'possessive' },
      { person: '2sg', animate: '-va', inanimate: '-vo', role: 'possessive' },
      { person: '3sg', animate: '-re', inanimate: '-to', role: 'possessive' },
      { person: '1pl', animate: '-mor', inanimate: '-mar', role: 'possessive' },
      { person: '2pl', animate: '-ven', inanimate: '-von', role: 'possessive' },
      { person: '3pl', animate: '-ron', inanimate: '-tan', role: 'possessive' },

      { person: '1sg', animate: 'ku-', inanimate: 'ka-', role: 'subject' },
      { person: '2sg', animate: 'ti-', inanimate: 'to-', role: 'subject' },
      { person: '3sg', animate: 're-', inanimate: 'to-', role: 'subject' },
      { person: '1pl', animate: 'kor-', inanimate: 'kar-', role: 'subject' },
      { person: '2pl', animate: 'tor-', inanimate: 'tar-', role: 'subject' },
      { person: '3pl', animate: 'ren-', inanimate: 'ton-', role: 'subject' },

      { person: '1sg', animate: "-'ak", inanimate: "-'ak", role: 'object' },
      { person: '2sg', animate: "-'at", inanimate: "-'ot", role: 'object' },
      { person: '3sg', animate: "-'or", inanimate: "-'an", role: 'object' },
      { person: '1pl', animate: "-'am", inanimate: "-'am", role: 'object' },
      { person: '2pl', animate: "-'ev", inanimate: "-'ov", role: 'object' },
      { person: '3pl', animate: "-'ir", inanimate: "-'in", role: 'object' },
    ],
  },
  cases: [
    { caseName: 'nominative', suffix: '', description: 'Subject of finite verb' },
    { caseName: 'accusative', suffix: '-n', description: 'Direct object' },
    { caseName: 'genitive', suffix: '-is', description: 'Possession or origin' },
    { caseName: 'dative', suffix: '-ov', description: 'Indirect object / beneficiary' },
    { caseName: 'locative', suffix: '-eš', description: 'Spatial or temporal location' },
    { caseName: 'instrumental', suffix: '-om', description: 'Means or tool used' },
  ],
  tenses: [
    { tense: 'present', affix: '', position: 'suffix' },
    { tense: 'past', affix: '-il', position: 'suffix' },
    { tense: 'future', affix: '-va', position: 'suffix' },
    { tense: 'perfect', affix: 'k-', position: 'prefix' },
  ],
  pluralAffix: { affix: '-i', position: 'suffix' },
  customOverrides: [
    { english: 'king', pos: 'n', conlang: "rath'mor", ipa: "/raθ'mor/", notes: 'Supreme monarch' },
    { english: 'sword', pos: 'n', conlang: "kret'va", ipa: "/kret'va/", notes: 'Ceremonial blade' },
    { english: 'protect', pos: 'v', conlang: "kran'an", ipa: "/kran'an/", notes: 'Guard or shield' },
  ],
  customLetters: [],
  scriptStyle: 'geometric-fluid',
};

export const PRESET_KHORVATH: LanguageConfig = {
  id: 'khorvath',
  name: "Khor'vať",
  motto: "K'tan tork'el voř — Stone speaks to the iron blood",
  description: 'A fusional, guttural warrior tongue featuring high glottal stop density, VSO word order, and cuneiform matrix writing.',
  morphologyType: 'fusional',
  wordOrder: 'VSO',
  headDirection: 'head-initial',
  linearVector: 'balanced-centering',
  geometricMorphology: 'mirror-back-front',
  stressRule: 'initial',
  initialConstraints: {
    requiredStartingSounds: [],
    prohibitedStartingSounds: ['ng', 'v', 'j'],
    conditionalConstraints: [
      {
        pos: 'v',
        requiredClass: 'plosive',
        description: 'All verbal roots must begin with plosives [p, t, k, b, d, g]',
      },
    ],
  },
  syllableConfig: {
    templates: ['CVC', 'CCVC', 'CVCC'],
    maxOnsetConsonants: 2,
    maxCodaConsonants: 2,
    allowGeminates: false,
    vowelHarmony: 'none',
  },
  consonantInventory: STANDARD_IPA_CONSONANTS.filter(c =>
    ['p', 'b', 't', 'd', 'k', 'g', "'", 'm', 'n', 'r', 'ř', 's', 'z', 'x', 'h', 'č', 'c', 'tɕ'].includes(c.romanization)
  ),
  vowelInventory: STANDARD_IPA_VOWELS.filter(v =>
    ['a', 'o', 'u', 'y'].includes(v.romanization)
  ),
  bannedSequences: ['ee', 'oo', 'aa'],
  soundLaws: [
    {
      id: 'sl-kh1',
      pattern: '([kpt])h',
      replacement: '$1x',
      description: 'Aspirated stops fortify to velar fricatives',
    },
  ],
  pronounRules: {
    attachmentType: 'suffix',
    verbSubjectAttachment: 'suffix',
    verbObjectAttachment: 'infix',
    nounPossessiveAttachment: 'prefix',
    paradigms: [
      { person: '1sg', animate: "k'a-", inanimate: "k'u-", role: 'possessive' },
      { person: '2sg', animate: "t'o-", inanimate: "t'u-", role: 'possessive' },
      { person: '3sg', animate: "ř'a-", inanimate: "x'u-", role: 'possessive' },
      { person: '1pl', animate: "m'or-", inanimate: "m'ar-", role: 'possessive' },
      { person: '2pl', animate: "t'or-", inanimate: "t'ar-", role: 'possessive' },
      { person: '3pl', animate: "r'an-", inanimate: "x'an-", role: 'possessive' },

      { person: '1sg', animate: "-'ak", inanimate: "-'ak", role: 'subject' },
      { person: '2sg', animate: "-'ot", inanimate: "-'ut", role: 'subject' },
      { person: '3sg', animate: "-'or", inanimate: "-'ox", role: 'subject' },
      { person: '1pl', animate: "-'om", inanimate: "-'um", role: 'subject' },
      { person: '2pl', animate: "-'oř", inanimate: "-'uř", role: 'subject' },
      { person: '3pl', animate: "-'an", inanimate: "-'un", role: 'subject' },

      { person: '1sg', animate: "-k", inanimate: "-k", role: 'object' },
      { person: '2sg', animate: "-t", inanimate: "-t", role: 'object' },
      { person: '3sg', animate: "-r", inanimate: "-x", role: 'object' },
      { person: '1pl', animate: "-m", inanimate: "-m", role: 'object' },
      { person: '2pl', animate: "-ř", inanimate: "-ř", role: 'object' },
      { person: '3pl', animate: "-n", inanimate: "-n", role: 'object' },
    ],
  },
  cases: [
    { caseName: 'nominative', suffix: '', description: 'Unmarked base' },
    { caseName: 'accusative', suffix: "-'a", description: 'Objective target' },
    { caseName: 'genitive', suffix: "-'ux", description: 'Origin and ownership' },
    { caseName: 'dative', suffix: "-'od", description: 'Recipient' },
    { caseName: 'locative', suffix: "-'ak", description: 'Territory' },
    { caseName: 'instrumental', suffix: "-'oř", description: 'Weapon or tool' },
  ],
  tenses: [
    { tense: 'present', affix: '', position: 'suffix' },
    { tense: 'past', affix: "-'ox", position: 'suffix' },
    { tense: 'future', affix: "-'ak", position: 'suffix' },
    { tense: 'perfect', affix: "k'-", position: 'prefix' },
  ],
  pluralAffix: { affix: '-or', position: 'suffix' },
  customOverrides: [
    { english: 'warrior', pos: 'n', conlang: "tork'el", ipa: "/tork'el/", notes: 'Sworn soldier' },
    { english: 'kill', pos: 'v', conlang: "k'rak", ipa: "/k'rak/", notes: 'Slaughter or fell' },
    { english: 'blood', pos: 'n', conlang: "voř", ipa: "/vor̝/", notes: 'Vital essence' },
  ],
  customLetters: [],
  scriptStyle: 'cuneiform-matrix',
};

export const PRESET_SOLARIAN: LanguageConfig = {
  id: 'solarian',
  name: 'Sōla’riěn',
  motto: 'Ael’iö tura šena — Golden light weaves the stars',
  description: 'An ethereal polysynthetic language with front-back vowel harmony, celestial featural runes, and OSV syntactic focus.',
  morphologyType: 'polysynthetic',
  wordOrder: 'OSV',
  headDirection: 'head-final',
  linearVector: 'balanced-centering',
  geometricMorphology: 'diagonal-matrix',
  stressRule: 'antepenultimate',
  initialConstraints: {
    requiredStartingSounds: [],
    prohibitedStartingSounds: ['k', 'g', 'x'],
    conditionalConstraints: [
      {
        pos: 'v',
        requiredClass: 'fricative',
        description: 'Verbs favor soft fricatives and approximants [s, z, š, l, j, v]',
      },
    ],
  },
  syllableConfig: {
    templates: ['CV', 'CCV', 'V', 'CVC'],
    maxOnsetConsonants: 2,
    maxCodaConsonants: 1,
    allowGeminates: false,
    vowelHarmony: 'front-back',
  },
  consonantInventory: STANDARD_IPA_CONSONANTS.filter(c =>
    ['t', 'd', "'", 'm', 'n', 'ň', 'r', 's', 'z', 'š', 'ž', 'l', 'ľ', 'j', 'w', 'v'].includes(c.romanization)
  ),
  vowelInventory: STANDARD_IPA_VOWELS.filter(v =>
    ['a', 'e', 'i', 'o', 'u', 'ö', 'ü', 'ě'].includes(v.romanization)
  ),
  bannedSequences: ['kk', 'tt', 'pp'],
  soundLaws: [
    {
      id: 'sl-sol1',
      pattern: 'ti',
      replacement: 'ći',
      description: 'Coronal palatalization before high front vowel',
    },
  ],
  pronounRules: {
    attachmentType: 'prefix',
    verbSubjectAttachment: 'prefix',
    verbObjectAttachment: 'prefix',
    nounPossessiveAttachment: 'prefix',
    paradigms: [
      { person: '1sg', animate: 'ael-', inanimate: 'öl-', role: 'possessive' },
      { person: '2sg', animate: 'vel-', inanimate: 'vul-', role: 'possessive' },
      { person: '3sg', animate: 'sye-', inanimate: 'sen-', role: 'possessive' },
      { person: '1pl', animate: 'lye-', inanimate: 'lan-', role: 'possessive' },
      { person: '2pl', animate: 'mye-', inanimate: 'man-', role: 'possessive' },
      { person: '3pl', animate: 'nye-', inanimate: 'non-', role: 'possessive' },

      { person: '1sg', animate: 'ae-', inanimate: 'ö-', role: 'subject' },
      { person: '2sg', animate: 've-', inanimate: 'vu-', role: 'subject' },
      { person: '3sg', animate: 'še-', inanimate: 'so-', role: 'subject' },
      { person: '1pl', animate: 'le-', inanimate: 'la-', role: 'subject' },
      { person: '2pl', animate: 'me-', inanimate: 'ma-', role: 'subject' },
      { person: '3pl', animate: 'ne-', inanimate: 'no-', role: 'subject' },

      { person: '1sg', animate: '-iö', inanimate: '-iö', role: 'object' },
      { person: '2sg', animate: '-uö', inanimate: '-uö', role: 'object' },
      { person: '3sg', animate: '-ë', inanimate: '-ö', role: 'object' },
      { person: '1pl', animate: '-ia', inanimate: '-ia', role: 'object' },
      { person: '2pl', animate: '-ua', inanimate: '-ua', role: 'object' },
      { person: '3pl', animate: '-ěn', inanimate: '-ön', role: 'object' },
    ],
  },
  cases: [
    { caseName: 'nominative', suffix: '', description: 'Radiant focus' },
    { caseName: 'accusative', suffix: '-a', description: 'Patient' },
    { caseName: 'genitive', suffix: '-is', description: 'Origin' },
    { caseName: 'dative', suffix: '-el', description: 'Harmonic recipient' },
    { caseName: 'locative', suffix: '-in', description: 'Cosmic position' },
    { caseName: 'instrumental', suffix: '-we', description: 'Conduit' },
  ],
  tenses: [
    { tense: 'present', affix: '', position: 'suffix' },
    { tense: 'past', affix: '-ura', position: 'suffix' },
    { tense: 'future', affix: '-ena', position: 'suffix' },
    { tense: 'perfect', affix: 'ö-', position: 'prefix' },
  ],
  pluralAffix: { affix: '-en', position: 'suffix' },
  customOverrides: [
    { english: 'star', pos: 'n', conlang: 'šena', ipa: '/ʃena/', notes: 'Celestial lantern' },
    { english: 'light', pos: 'n', conlang: 'ael', ipa: '/ael/', notes: 'Luminance' },
    { english: 'weave', pos: 'v', conlang: 'tura', ipa: '/tura/', notes: 'Thread fates' },
  ],
  customLetters: [],
  scriptStyle: 'celestial-featural',
};

export const ALL_PRESETS: LanguageConfig[] = [
  PRESET_VALKYRISH,
  PRESET_KHORVATH,
  PRESET_SOLARIAN,
  PRESET_BLANK,
];
