/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ConlangWord, LanguageConfig } from '../engine/types';
import { translateSentence } from '../engine/translator';

interface DossierPanelProps {
  config: LanguageConfig;
  lexicon: ConlangWord[];
}

export const DossierPanel: React.FC<DossierPanelProps> = ({
  config,
  lexicon,
}) => {
  const [copied, setCopied] = useState(false);

  // Generate sample sentences for Section 5
  const sample1 = translateSentence('The king protects my dog', config, lexicon);
  const sample2 = translateSentence('We protect the sacred fire', config, lexicon);
  const sample3 = translateSentence('Ancient stone speaks to our heart', config, lexicon);

  // Compile full Markdown Dossier string adhering to Section 4 Output Requirements
  const generateMarkdown = (): string => {
    return `# LINGUISTIC DOSSIER: ${config.name.toUpperCase()}

> "${config.motto}"

---

## 1. LANGUAGE METADATA
* **Language Name:** ${config.name}
* **Morphological Typology:** ${config.morphologyType.toUpperCase()}
* **Syntactic Word Order:** ${config.wordOrder} (${config.headDirection})
* **Prosody & Stress Determinism:** ${config.stressRule}
* **Directionality & Linear Vector:** ${config.linearVector}
* **Geometric / Matrix Morphology:** ${config.geometricMorphology}
* **Pronoun Binding Mechanics:**
  - Noun Possessive: ${config.pronounRules.nounPossessiveAttachment.toUpperCase()} (e.g. house-MY)
  - Verbal Subject: ${config.pronounRules.verbSubjectAttachment.toUpperCase()}
  - Verbal Object: ${config.pronounRules.verbObjectAttachment.toUpperCase()}
  - Gender/Noun Class Agreement: Strict Animate (humans, animals, forces) vs Inanimate (tools, matter, concepts) dichotomy.

---

## 2. PHONOLOGY & ORTHOGRAPHY MATRIX

### Active Consonant Inventory (IPA to Slavic Diacritic Romanization)
| Romanization | IPA Symbol | Manner | Place |
| :--- | :--- | :--- | :--- |
${config.consonantInventory
  .map((c) => `| **${c.romanization}** | /${c.symbol}/ | ${c.manner || 'consonant'} | ${c.place || 'central'} |`)
  .join('\n')}

### Active Vowel System (IPA Trapezoid)
| Romanization | IPA Symbol | Height | Backness | Rounded |
| :--- | :--- | :--- | :--- | :--- |
${config.vowelInventory
  .map((v) => `| **${v.romanization}** | /${v.symbol}/ | ${v.height || 'mid'} | ${v.backness || 'central'} | ${v.rounded ? 'Yes' : 'No'} |`)
  .join('\n')}

### Slavic Orthography & Glottal Stop Conventions
* **š** denotes voiceless postalveolar fricative /ʃ/.
* **č** denotes voiceless postalveolar affricate /tʃ/.
* **ž** denotes voiced postalveolar fricative /ʒ/.
* **ć** denotes voiceless alveolo-palatal affricate /tɕ/.
* **đ** denotes voiced alveolo-palatal affricate /dʑ/.
* **ř** denotes alveolar fricative trill /r̝/.
* **ň** denotes palatal nasal /ɲ/.
* **ľ** denotes palatal lateral /ʎ/.
* **y** denotes close central unrounded vowel /ɨ/.
* **Apostrophe (')** strictly denotes glottal stop /ʔ/, ejectives, or syllable boundaries.

### Phonotactic Templates & Constraints
* **Templates:** ${config.syllableConfig.templates.join(', ')}
* **Max Onset Consonants:** ${config.syllableConfig.maxOnsetConsonants}
* **Max Coda Consonants:** ${config.syllableConfig.maxCodaConsonants}
* **Geminates Allowed:** ${config.syllableConfig.allowGeminates ? 'Yes' : 'Prohibited'}
* **Vowel Harmony:** ${config.syllableConfig.vowelHarmony}
* **Prohibited Initial Sounds:** ${config.initialConstraints.prohibitedStartingSounds.join(', ') || 'None'}

---

## 3. GRAMMAR CHEAT SHEET & GENDERED PRONOUN SYSTEMS

### Pronominal Affixation Paradigms (Animate vs. Inanimate)
| Person | Syntactic Role | Animate Affix | Inanimate Affix | Structural Agreement |
| :--- | :--- | :--- | :--- | :--- |
${config.pronounRules.paradigms
  .map(
    (p) =>
      `| **${p.person.toUpperCase()}** | ${p.role} | \`${p.animate}\` | \`${p.inanimate}\` | ${p.role === 'possessive' ? 'Noun-bound' : 'Verb-inflected'} |`
  )
  .join('\n')}

### Nominal Cases & Declensions
| Case | Suffix / Marker | Function |
| :--- | :--- | :--- |
${config.cases.map((c) => `| **${c.caseName.toUpperCase()}** | \`${c.suffix || 'Ø (unmarked)'}\` | ${c.description} |`).join('\n')}

### Verbal Tense & Aspect
| Tense | Position & Affix |
| :--- | :--- |
${config.tenses.map((t) => `| **${t.tense.toUpperCase()}** | ${t.position.toUpperCase()}: \`${t.affix || 'Ø'}\` |`).join('\n')}

---

## 4. DICTIONARY / LEXICON (${lexicon.length} Roots)

| Conlang Word | IPA Pronunciation | Part of Speech | English Meaning | Animacy Class |
| :--- | :--- | :--- | :--- | :--- |
${lexicon
  .map(
    (w) =>
      `| **${w.conlang}** | ${w.ipa} | ${w.pos.toUpperCase()} | ${w.english} | ${w.animacy || 'inanimate'} |`
  )
  .join('\n')}

---

## 5. SAMPLE TRANSLATIONS & AUDIO PHONETIC GUIDE

### Sample Sentence 1
* **English:** "${sample1.inputSentence}"
* **Conlang Translation:** ${sample1.translatedRomanized}
* **Native Unicode Script:** \`${sample1.translatedNativeScript}\`
* **IPA Transcription:** ${sample1.ipa}
* **Interlinear Gloss:** \`${sample1.gloss}\`
* **Phonetic Audio Guide:**
  - *Pacing:* ${sample1.phoneticAudioGuide.pacingDescription}
  - *Syllable Cadence:* ${sample1.phoneticAudioGuide.syllableCadence}
  - *Stress & Contour:* ${sample1.phoneticAudioGuide.stressContour}
  - *Speech Engine Directive:* "${sample1.phoneticAudioGuide.speechPrompt}"

### Sample Sentence 2
* **English:** "${sample2.inputSentence}"
* **Conlang Translation:** ${sample2.translatedRomanized}
* **Native Unicode Script:** \`${sample2.translatedNativeScript}\`
* **IPA Transcription:** ${sample2.ipa}
* **Interlinear Gloss:** \`${sample2.gloss}\`
* **Phonetic Audio Guide:**
  - *Pacing:* ${sample2.phoneticAudioGuide.pacingDescription}
  - *Syllable Cadence:* ${sample2.phoneticAudioGuide.syllableCadence}
  - *Stress & Contour:* ${sample2.phoneticAudioGuide.stressContour}

### Sample Sentence 3
* **English:** "${sample3.inputSentence}"
* **Conlang Translation:** ${sample3.translatedRomanized}
* **Native Unicode Script:** \`${sample3.translatedNativeScript}\`
* **IPA Transcription:** ${sample3.ipa}
* **Interlinear Gloss:** \`${sample3.gloss}\`
* **Phonetic Audio Guide:**
  - *Pacing:* ${sample3.phoneticAudioGuide.pacingDescription}
  - *Syllable Cadence:* ${sample3.phoneticAudioGuide.syllableCadence}
  - *Stress & Contour:* ${sample3.phoneticAudioGuide.stressContour}
`;
  };

  const markdownContent = generateMarkdown();

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${config.id}-linguistic-dossier.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>Section 4 Documentation Specification</span>
              <span aria-hidden="true">·</span>
              <span>Complete Linguistic Dossier</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Exportable Markdown Grammar & Dictionary
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Full formatted document containing Metadata, Phonology Matrix, Grammar Cheat Sheet, Lexicon, and Sample Translations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyMarkdown}
              className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-sm shadow-cyan-600/20"
            >
              {copied ? 'Copied Dossier!' : 'Copy Full Markdown'}
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono transition-colors cursor-pointer"
            >
              Download .md File
            </button>
          </div>
        </div>
      </div>

      {/* Raw Markdown Preview with Tabular Styling */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 overflow-hidden">
        <div className="border-b border-slate-800 pb-2 mb-4 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            Preview: {config.name}_dossier.md ({markdownContent.length.toLocaleString()} characters)
          </span>
          <span className="text-xs text-cyan-400 font-mono">Sections 1–5 Complete</span>
        </div>

        <pre className="w-full bg-slate-950 border border-slate-800/90 rounded-lg p-5 text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto max-h-[750px] select-all whitespace-pre-wrap">
          {markdownContent}
        </pre>
      </div>
    </div>
  );
};
