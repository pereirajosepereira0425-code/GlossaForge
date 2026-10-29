/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  romanToIpa,
  applySoundLaws,
  assignStress,
  createRng,
  generateSyllable,
} from './phonology';
import {
  inferAnimacy,
  getPronounAffix,
  attachPossessiveToNoun,
  inflectVerb,
} from './morphology';
import {
  parseCustomVocabularyOverrides,
  extractPhonologicalRulesFromOverrides,
  generateLexicon,
} from './lexicon';
import {
  buildNativeGlyphMap,
  transliterateToNativeUnicode,
} from './scriptGenerator';
import { translateSentence } from './translator';
import { PRESET_VALKYRISH, PRESET_KHORVATH, PRESET_BLANK } from './presets';
import { CustomLetter } from './types';

test('Phonology: Slavic Romanization maps accurately to IPA symbols', () => {
  const ipa = romanToIpa("rath'mor šena čar", PRESET_VALKYRISH);
  assert.match(ipa, /ʔ/, 'Glottal apostrophe should map to /ʔ/');
  assert.match(ipa, /ʃ/, 'Slavic š should map to /ʃ/');
  assert.match(ipa, /tʃ/, 'Slavic č should map to /tʃ/');
});

test('Phonology: Sound laws enforce anti-geminate and regex replacements', () => {
  const cleaned = applySoundLaws('kkkss', PRESET_VALKYRISH);
  assert.equal(cleaned.includes('kkk'), false, 'Should remove triple geminates');
});

test('Phonology: Stress assigner assigns penultimate and initial stress correctly', () => {
  const penult = assignStress(['va', 'ly', 'rish'], 'penultimate');
  assert.equal(penult.stressIndex, 1);

  const initial = assignStress(['khor', 'vat'], 'initial');
  assert.equal(initial.stressIndex, 0);
});

test('Morphology: Animacy inference correctly classifies entities', () => {
  assert.equal(inferAnimacy('king'), 'animate');
  assert.equal(inferAnimacy('hunter'), 'animate');
  assert.equal(inferAnimacy('wolf'), 'animate');
  assert.equal(inferAnimacy('stone'), 'inanimate');
  assert.equal(inferAnimacy('sword'), 'inanimate');
});

test('Morphology: Pronoun clitics differentiate between Animate and Inanimate classes', () => {
  const animPoss = getPronounAffix('3sg', 'possessive', 'animate', PRESET_VALKYRISH);
  const inanPoss = getPronounAffix('3sg', 'possessive', 'inanimate', PRESET_VALKYRISH);
  assert.notEqual(animPoss, inanPoss, 'Animate and Inanimate 3sg possessives must differ');

  // Test attachment to noun
  const animNoun = attachPossessiveToNoun('rath', '1sg', 'animate', PRESET_VALKYRISH);
  assert.ok(animNoun.fullForm.includes('ku'), 'Should attach 1sg.anim -ku');
});

test('Lexicon: Custom override parser preserves exact user strings and POS', () => {
  const input = "king : n = rath'mor\nsword : n = kret'va\nconquer : v = kret'za";
  const overrides = parseCustomVocabularyOverrides(input);
  assert.equal(overrides.length, 3);
  assert.equal(overrides[0].english, 'king');
  assert.equal(overrides[0].conlang, "rath'mor");
  assert.equal(overrides[0].pos, 'n');

  const rules = extractPhonologicalRulesFromOverrides(overrides);
  assert.ok(rules.glottalFrequency > 0, 'Should detect apostrophe glottal frequency');
});

test('Unicode Character Generator: Procedural glyph map assigns PUA and transliterates', () => {
  const glyphMap = buildNativeGlyphMap(
    PRESET_VALKYRISH.consonantInventory,
    PRESET_VALKYRISH.vowelInventory,
    'geometric-fluid'
  );

  assert.ok(glyphMap['š'], 'Should map Slavic š');
  assert.ok(glyphMap['š'].unicodeHex.startsWith('U+E'), 'Should assign Unicode Private Use Area hex');
  assert.ok(glyphMap['š'].svgPath.length > 5, 'Should generate valid SVG path');

  const nativeStr = transliterateToNativeUnicode("rath'mor", glyphMap);
  assert.ok(nativeStr.length > 0, 'Should transliterate text into native script');
});

test('Translator: Translates English sentence into conlang applying SOV word order & animacy', () => {
  const lexicon = generateLexicon(PRESET_VALKYRISH);
  const result = translateSentence('The king protects the sacred stone', PRESET_VALKYRISH, lexicon);

  assert.ok(result.translatedRomanized.length > 0, 'Should produce romanized conlang');
  assert.ok(result.translatedNativeScript.length > 0, 'Should produce native script');
  assert.ok(result.ipa.length > 0, 'Should produce IPA transcription');
  assert.ok(result.gloss.length > 0, 'Should produce interlinear gloss');
  assert.ok(result.phoneticAudioGuide.pacingDescription.length > 0, 'Should produce phonetic audio guide');
});

test('Blank Canvas: Starts unpopulated without throwing and generates baseline roots', () => {
  assert.ok(PRESET_BLANK.consonantInventory.length > 0, 'Blank preset has starter consonants');
  assert.ok(PRESET_BLANK.vowelInventory.length > 0, 'Blank preset has starter vowels');
  assert.equal(PRESET_BLANK.initialConstraints.prohibitedStartingSounds.length, 0);
  assert.equal(PRESET_BLANK.customOverrides.length, 0);

  const lexicon = generateLexicon(PRESET_BLANK);
  assert.ok(lexicon.length > 0, 'Blank language should generate baseline roots using fallback phonemes');
});

test('Custom Characters & Audio: Integrates custom drawn glyph with PUA code into engine', () => {
  const customLetter: CustomLetter = {
    id: 'test-custom-1',
    symbol: String.fromCodePoint(0xe105),
    unicodeHex: 'U+E105',
    romanization: 'x̌',
    ipa: '/χ/',
    category: 'consonant',
    manner: 'fricative',
    place: 'uvular',
    svgPath: 'M 10 10 L 30 30 M 30 10 L 10 30',
    audioDataUrl: 'data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAA...',
    createdAt: Date.now(),
  };

  const customConfig = {
    ...PRESET_VALKYRISH,
    customLetters: [customLetter],
  };

  const glyphMap = buildNativeGlyphMap(
    customConfig.consonantInventory,
    customConfig.vowelInventory,
    customConfig.scriptStyle,
    customConfig.customLetters
  );

  assert.ok(glyphMap['x̌'], 'Custom letter x̌ must be present in glyphMap');
  assert.equal(glyphMap['x̌'].unicodeHex, 'U+E105');
  assert.equal(glyphMap['x̌'].strokeType, 'custom-drawn');

  const transliterated = transliterateToNativeUnicode("x̌ar", glyphMap);
  assert.ok(transliterated.includes(String.fromCodePoint(0xe105)), 'Should render custom PUA character code point');

  const ipa = romanToIpa('x̌ar', customConfig);
  assert.match(ipa, /χ/, 'Custom romanization x̌ should map to custom IPA /χ/');
});
