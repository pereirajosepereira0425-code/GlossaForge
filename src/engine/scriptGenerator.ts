/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NativeGlyph, PhonemeDef } from './types';

export type ScriptStyle = 'runic' | 'geometric-fluid' | 'celestial-featural' | 'cuneiform-matrix';

/**
 * Generate an SVG path mathematically for a given phoneme and script style
 */
export function generateGlyphSvgPath(
  char: string,
  style: ScriptStyle,
  seedIndex: number
): string {
  // Bounding box: 0 0 40 40
  const cx = 20;
  const cy = 20;
  const charCode = char.charCodeAt(0) || 65;
  const variant = (charCode + seedIndex) % 8;

  switch (style) {
    case 'runic': {
      // Angular straight lines like Elder Futhark / Khuzdul
      // Main central stave + branch strokes
      const stave = 'M20,6 L20,34';
      let branches = '';
      if (variant === 0) branches = ' M20,12 L30,6 M20,22 L30,16';
      else if (variant === 1) branches = ' M20,10 L10,18 M20,24 L30,16';
      else if (variant === 2) branches = ' M20,8 L32,18 L20,28';
      else if (variant === 3) branches = ' M10,14 L20,20 L30,14 M20,20 L20,34';
      else if (variant === 4) branches = ' M20,12 L32,20 L20,28 L8,20 Z';
      else if (variant === 5) branches = ' M20,14 L10,8 M20,20 L30,26 M20,28 L10,34';
      else if (variant === 6) branches = ' M20,8 L32,14 M20,8 L8,14 M20,26 L32,32';
      else branches = ' M12,10 L28,26 M28,10 L12,26 M20,6 L20,34';
      return stave + branches;
    }

    case 'geometric-fluid': {
      // Flowing curves, loops, ascenders, descenders like Tengwar or Georgian Asomtavruli
      if (variant === 0) return 'M12,28 C12,14 28,14 28,28 M28,10 L28,34 M20,14 A6,6 0 1,0 20,26';
      if (variant === 1) return 'M10,20 C10,10 30,10 30,20 C30,30 10,30 10,20 Z M20,6 L20,34';
      if (variant === 2) return 'M14,12 C24,8 32,16 26,26 C20,34 10,28 14,20 M26,16 L34,16';
      if (variant === 3) return 'M12,24 C14,14 26,14 28,24 C30,34 18,34 12,24 M28,8 L28,28';
      if (variant === 4) return 'M10,16 Q20,6 30,16 Q20,34 10,16 M20,10 L20,30';
      if (variant === 5) return 'M12,12 C18,20 22,20 28,12 M20,18 L20,34 A4,4 0 0,1 16,38';
      if (variant === 6) return 'M10,28 C14,16 26,16 30,28 M12,22 L28,22 M20,8 A3,3 0 1,1 20,14';
      return 'M10,20 A10,10 0 1,1 30,20 A10,10 0 1,1 10,20 M20,10 L30,30';
    }

    case 'celestial-featural': {
      // Cosmic astral sigils: circles, orbiting dots, axis lines
      if (variant === 0) return 'M20,20 m-10,0 a10,10 0 1,0 20,0 a10,10 0 1,0 -20,0 M20,6 L20,34 M10,16 L30,24';
      if (variant === 1) return 'M20,20 m-8,0 a8,8 0 1,0 16,0 a8,8 0 1,0 -16,0 M6,20 L34,20 M20,8 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0';
      if (variant === 2) return 'M8,12 L32,12 M20,12 L20,32 M20,32 m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0';
      if (variant === 3) return 'M12,10 L28,10 L20,26 Z M20,26 L20,36 M20,6 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0';
      if (variant === 4) return 'M10,20 C10,12 30,12 30,20 C30,28 10,28 10,20 M12,8 L28,32';
      if (variant === 5) return 'M20,10 L30,20 L20,30 L10,20 Z M20,6 L20,10 M20,30 L20,34';
      if (variant === 6) return 'M14,14 A8,8 0 0,1 26,26 M14,26 A8,8 0 0,1 26,14 M20,8 L20,32';
      return 'M8,20 L32,20 M20,8 L20,32 M12,12 L28,28 M28,12 L12,28';
    }

    case 'cuneiform-matrix': {
      // Ancient Mesopotamian wedges and matrix tines
      if (variant === 0) return 'M8,12 L24,12 L20,8 Z M8,12 L8,28 L12,24 Z M16,20 L32,20 L28,16 Z';
      if (variant === 1) return 'M6,10 L34,10 L30,6 Z M20,10 L20,32 L16,28 Z M20,22 L32,22 L28,18 Z';
      if (variant === 2) return 'M10,14 L22,8 L22,20 Z M22,14 L34,8 L34,20 Z M16,24 L28,24 L24,20 Z';
      if (variant === 3) return 'M8,8 L26,8 L22,4 Z M8,18 L26,18 L22,14 Z M8,28 L32,28 L28,24 Z';
      if (variant === 4) return 'M12,8 L12,30 L8,26 Z M20,12 L32,12 L28,8 Z M20,24 L32,24 L28,20 Z';
      if (variant === 5) return 'M10,10 L24,24 L18,24 Z M24,10 L10,24 L10,18 Z M17,26 L17,34 L13,30 Z';
      if (variant === 6) return 'M6,16 L34,16 L30,12 Z M14,16 L14,32 L10,28 Z M26,16 L26,32 L22,28 Z';
      return 'M10,10 L30,10 L26,6 Z M10,20 L30,20 L26,16 Z M10,30 L30,30 L26,26 Z';
    }
  }
}

/**
 * Generate full native glyph inventory mapping IPA phonemes to Unicode Private Use Area (PUA)
 */
export function buildNativeGlyphMap(
  consonants: PhonemeDef[],
  vowels: PhonemeDef[],
  style: ScriptStyle,
  customLetters?: import('./types').CustomLetter[],
  customGlyphs?: import('./types').CustomDrawnGlyph[]
): Record<string, NativeGlyph> {
  const glyphMap: Record<string, NativeGlyph> = {};
  let puaIndex = 0xe001; // Start at U+E001

  // 1. Map consonants
  consonants.forEach((c, idx) => {
    const rawHex = c.customUnicode || c.unicodeHex;
    const hex = rawHex?.replace(/^U\+/i, '') || puaIndex.toString(16).toUpperCase();
    const glyphCodePoint = parseInt(hex, 16) || puaIndex;
    const glyphChar = String.fromCodePoint(glyphCodePoint);
    const svgPath = c.customSvgPath || c.svgPath || generateGlyphSvgPath(c.romanization, style, idx);

    glyphMap[c.romanization] = {
      phoneme: c.symbol,
      romanization: c.romanization,
      unicodeHex: `U+${hex}`,
      glyphChar,
      svgPath,
      strokeType: c.customSvgPath || c.svgPath ? 'custom-drawn' : style,
      imageDataUrl: c.customImageUrl || c.imageDataUrl,
      audioDataUrl: c.audioDataUrl,
      isCustom: c.isCustom,
    };
    puaIndex++;
  });

  // 2. Map vowels
  vowels.forEach((v, idx) => {
    const rawHex = v.customUnicode || v.unicodeHex;
    const hex = rawHex?.replace(/^U\+/i, '') || puaIndex.toString(16).toUpperCase();
    const glyphCodePoint = parseInt(hex, 16) || puaIndex;
    const glyphChar = String.fromCodePoint(glyphCodePoint);
    const svgPath = v.customSvgPath || v.svgPath || generateGlyphSvgPath(v.romanization, style, idx + 50);

    glyphMap[v.romanization] = {
      phoneme: v.symbol,
      romanization: v.romanization,
      unicodeHex: `U+${hex}`,
      glyphChar,
      svgPath,
      strokeType: v.customSvgPath || v.svgPath ? 'custom-drawn' : style,
      imageDataUrl: v.customImageUrl || v.imageDataUrl,
      audioDataUrl: v.audioDataUrl,
      isCustom: v.isCustom,
    };
    puaIndex++;
  });

  // 3. Map glottal stop / apostrophe boundary
  const apostropheHex = puaIndex.toString(16).toUpperCase();
  glyphMap["'"] = {
    phoneme: 'ʔ',
    romanization: "'",
    unicodeHex: `U+${apostropheHex}`,
    glyphChar: String.fromCodePoint(puaIndex),
    svgPath: 'M20,10 L20,24 M20,20 L26,16 M20,26 m-1.5,0 a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0',
    strokeType: style,
  };

  // 4. Map any additional custom letters
  if (customLetters && customLetters.length > 0) {
    customLetters.forEach((cl, idx) => {
      const hex = cl.unicodeHex.replace(/^U\+/i, '');
      const codePoint = parseInt(hex, 16) || (0xe100 + idx);
      const glyphChar = String.fromCodePoint(codePoint);
      const svgPath = cl.svgPath || generateGlyphSvgPath(cl.romanization, style, idx + 100);

      const ipaStr = (cl.ipa || cl.ipaSymbol || cl.romanization).replace(/^\/|\/$/g, '');
      glyphMap[cl.romanization] = {
        phoneme: ipaStr,
        romanization: cl.romanization,
        unicodeHex: `U+${hex}`,
        glyphChar,
        svgPath,
        strokeType: cl.svgPath ? 'custom-drawn' : style,
        imageDataUrl: cl.imageDataUrl,
        audioDataUrl: cl.audioDataUrl,
        isCustom: true,
      };
    });
  }

  // 5. Map any custom drawn or image-based glyphs from Glyph Drawing & Image Studio
  if (customGlyphs && customGlyphs.length > 0) {
    customGlyphs.forEach((cg, idx) => {
      const hex = cg.unicodeHex.replace(/^U\+/i, '');
      const codePoint = parseInt(hex, 16) || (0xe050 + idx);
      const glyphChar = cg.glyphChar || String.fromCodePoint(codePoint);

      glyphMap[cg.romanization] = {
        phoneme: cg.phonemeSymbol,
        romanization: cg.romanization,
        unicodeHex: `U+${hex}`,
        glyphChar,
        svgPath: cg.svgPath || 'M10,10 L30,10 L30,30 L10,30 Z',
        strokeType: (cg.strokeType as any) || 'custom-drawn',
        imageDataUrl: cg.imageUrl,
        isCustom: true,
      };
    });
  }

  return glyphMap;
}

/**
 * Transliterate Romanized Conlang word/text into Native Script Unicode string
 */
export function transliterateToNativeUnicode(
  text: string,
  glyphMap: Record<string, NativeGlyph>
): string {
  let result = '';
  let i = 0;

  // Multi-character romanization tokens to match first (e.g. 'ng', 'dz', 'ts')
  const keys = Object.keys(glyphMap).sort((a, b) => b.length - a.length);

  while (i < text.length) {
    const remaining = text.slice(i);
    let matched = false;

    for (const key of keys) {
      if (remaining.toLowerCase().startsWith(key.toLowerCase())) {
        result += glyphMap[key].glyphChar;
        i += key.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Punctuation, spaces, hyphens
      const char = text[i];
      if (char === ' ') result += '   '; // Wider word gap in native script
      else if (char === '-') result += '·';
      else if (char === '.') result += ' ⸫ ';
      else if (char === ',') result += ' ⸴ ';
      else result += char;
      i++;
    }
  }

  return result;
}

/**
 * Get SVG glyph elements for a word
 */
export function getWordSvgGlyphs(
  word: string,
  glyphMap: Record<string, NativeGlyph>
): NativeGlyph[] {
  const glyphs: NativeGlyph[] = [];
  let i = 0;
  const keys = Object.keys(glyphMap).sort((a, b) => b.length - a.length);

  while (i < word.length) {
    const remaining = word.slice(i);
    let matched = false;

    for (const key of keys) {
      if (remaining.toLowerCase().startsWith(key.toLowerCase())) {
        glyphs.push(glyphMap[key]);
        i += key.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      i++;
    }
  }

  return glyphs;
}
