/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AnimacyClass,
  LanguageConfig,
  MorphologicalType,
  PronounParadigmItem,
  PartOfSpeech,
} from './types';

/**
 * Determine if a noun or concept is typically Animate or Inanimate
 */
export function inferAnimacy(englishWord: string): AnimacyClass {
  const lower = englishWord.toLowerCase().trim();

  // Animate: humans, animals, active spiritual forces, kings, hunters, people
  const animateKeywords = [
    'man', 'woman', 'child', 'person', 'people', 'human', 'king', 'queen', 'prince', 'princess',
    'hunter', 'warrior', 'wolf', 'dog', 'cat', 'bird', 'horse', 'bear', 'dragon', 'beast',
    'god', 'spirit', 'demon', 'ancestor', 'brother', 'sister', 'mother', 'father', 'friend',
    'enemy', 'leader', 'soldier', 'stranger', 'guide', 'master', 'i', 'you', 'he', 'she',
    'we', 'they', 'who', 'someone', 'anyone', 'deer', 'fish', 'snake', 'eagle'
  ];

  if (animateKeywords.some(kw => lower === kw || lower.startsWith(kw + ' ') || lower.endsWith(' ' + kw))) {
    return 'animate';
  }

  // Check common animate endings
  if (lower.endsWith('er') || lower.endsWith('or') || lower.endsWith('ist') || lower.endsWith('ian')) {
    return 'animate';
  }

  // Default to inanimate for tools, objects, concepts, nature, places
  return 'inanimate';
}

/**
 * Retrieve the pronoun affix for a specific person, role, and animacy class
 */
export function getPronounAffix(
  person: '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl',
  role: 'subject' | 'object' | 'possessive',
  animacy: AnimacyClass,
  config: LanguageConfig
): string {
  const item = config.pronounRules.paradigms.find(
    p => p.person === person && p.role === role
  );

  if (item) {
    return animacy === 'animate' ? item.animate : item.inanimate;
  }

  // Fallback defaults
  if (role === 'possessive') {
    if (person === '1sg') return animacy === 'animate' ? '-mo' : '-ma';
    if (person === '2sg') return animacy === 'animate' ? '-te' : '-ta';
    if (person === '3sg') return animacy === 'animate' ? '-re' : '-to';
    if (person === '1pl') return animacy === 'animate' ? '-mor' : '-mar';
    if (person === '2pl') return animacy === 'animate' ? '-ten' : '-tan';
    if (person === '3pl') return animacy === 'animate' ? '-ron' : '-ton';
  }

  if (role === 'subject') {
    if (person === '1sg') return 'ku-';
    if (person === '2sg') return 'ti-';
    if (person === '3sg') return animacy === 'animate' ? 're-' : 'to-';
    if (person === '1pl') return 'kor-';
    if (person === '2pl') return 'tor-';
    if (person === '3pl') return animacy === 'animate' ? 'ren-' : 'ton-';
  }

  // Object
  if (person === '3sg') return animacy === 'animate' ? "-'or" : "-'an";
  return animacy === 'animate' ? '-e' : '-o';
}

/**
 * Attach possessive pronoun directly onto a noun
 * e.g. "rath" + "1sg.anim" => "rath-mo" or "rath'mo"
 */
export function attachPossessiveToNoun(
  nounConlang: string,
  person: '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl',
  animacy: AnimacyClass,
  config: LanguageConfig
): { fullForm: string; gloss: string } {
  const affix = getPronounAffix(person, 'possessive', animacy, config);
  const cleanAffix = affix.replace(/^[-']/, '');
  const isPrefix = config.pronounRules.nounPossessiveAttachment === 'prefix';

  let fullForm = '';
  if (config.morphologyType === 'isolating') {
    fullForm = isPrefix ? `${cleanAffix} ${nounConlang}` : `${nounConlang} ${cleanAffix}`;
  } else if (config.morphologyType === 'agglutinative') {
    fullForm = isPrefix ? `${cleanAffix}-${nounConlang}` : `${nounConlang}-${cleanAffix}`;
  } else {
    // Fusional or polysynthetic: join directly with potential apostrophe
    if (isPrefix) {
      fullForm = `${cleanAffix}'${nounConlang}`;
    } else {
      const needsApostrophe = !nounConlang.endsWith("'") && /^[aeiouy]/.test(cleanAffix);
      fullForm = needsApostrophe ? `${nounConlang}'${cleanAffix}` : `${nounConlang}${cleanAffix}`;
    }
  }

  const gloss = `${nounConlang.toUpperCase()}-${person.toUpperCase()}.${animacy === 'animate' ? 'ANIM' : 'INAN'}.POSS`;
  return { fullForm, gloss };
}

/**
 * Inflect a verb with subject and object pronouns, and tense
 */
export function inflectVerb(
  verbConlang: string,
  tense: 'present' | 'past' | 'future' | 'perfect',
  subjectPerson: '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl' | null,
  subjectAnimacy: AnimacyClass,
  objectPerson: '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl' | null,
  objectAnimacy: AnimacyClass,
  config: LanguageConfig
): { fullForm: string; glossParts: string[] } {
  let form = verbConlang;
  const glossParts = [verbConlang.toUpperCase()];

  // 1. Tense affix
  const tenseMarker = config.tenses.find(t => t.tense === tense);
  if (tenseMarker && tenseMarker.affix) {
    if (tenseMarker.position === 'prefix') {
      form = `${tenseMarker.affix}${form}`;
    } else {
      form = `${form}${tenseMarker.affix}`;
    }
    glossParts.push(tense.toUpperCase());
  }

  // 2. Object affix (if specified)
  if (objectPerson) {
    const objAffix = getPronounAffix(objectPerson, 'object', objectAnimacy, config).replace(/^-/, '');
    if (config.pronounRules.verbObjectAttachment === 'infix' && form.length > 3) {
      const mid = Math.floor(form.length / 2);
      form = `${form.slice(0, mid)}'${objAffix}'${form.slice(mid)}`;
    } else if (config.pronounRules.verbObjectAttachment === 'prefix') {
      form = `${objAffix}-${form}`;
    } else {
      form = `${form}-${objAffix}`;
    }
    glossParts.push(`${objectPerson.toUpperCase()}.${objectAnimacy === 'animate' ? 'ANIM' : 'INAN'}.OBJ`);
  }

  // 3. Subject affix (if specified)
  if (subjectPerson) {
    const subjAffix = getPronounAffix(subjectPerson, 'subject', subjectAnimacy, config).replace(/[-']$/, '');
    if (config.pronounRules.verbSubjectAttachment === 'prefix') {
      form = `${subjAffix}-${form}`;
    } else {
      form = `${form}-${subjAffix}`;
    }
    glossParts.push(`${subjectPerson.toUpperCase()}.${subjectAnimacy === 'animate' ? 'ANIM' : 'INAN'}.SUBJ`);
  }

  return { fullForm: form, glossParts };
}

/**
 * Attach case marker to noun
 */
export function applyCase(
  nounConlang: string,
  caseType: 'nominative' | 'accusative' | 'genitive' | 'dative' | 'locative' | 'instrumental',
  config: LanguageConfig
): { fullForm: string; glossTag: string } {
  if (caseType === 'nominative') {
    return { fullForm: nounConlang, glossTag: 'NOM' };
  }

  const marker = config.cases.find(c => c.caseName === caseType);
  if (!marker || !marker.suffix) {
    return { fullForm: nounConlang, glossTag: caseType.slice(0, 3).toUpperCase() };
  }

  const suffix = marker.suffix.replace(/^-/, '');
  const joined = config.morphologyType === 'agglutinative'
    ? `${nounConlang}-${suffix}`
    : `${nounConlang}${suffix}`;

  return { fullForm: joined, glossTag: caseType.slice(0, 3).toUpperCase() };
}

/**
 * Apply plural marker to noun
 */
export function applyPlural(
  nounConlang: string,
  config: LanguageConfig
): { fullForm: string; glossTag: string } {
  const { affix, position } = config.pluralAffix;
  const cleanAffix = affix.replace(/^[-']|[-']$/g, '');

  let fullForm = nounConlang;
  if (position === 'prefix') {
    fullForm = config.morphologyType === 'agglutinative'
      ? `${cleanAffix}-${nounConlang}`
      : `${cleanAffix}${nounConlang}`;
  } else {
    fullForm = config.morphologyType === 'agglutinative'
      ? `${nounConlang}-${cleanAffix}`
      : `${nounConlang}${cleanAffix}`;
  }

  return { fullForm, glossTag: 'PLUR' };
}
