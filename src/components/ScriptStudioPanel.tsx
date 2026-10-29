/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { LanguageConfig, NativeGlyph } from '../engine/types';
import {
  buildNativeGlyphMap,
  getWordSvgGlyphs,
  ScriptStyle,
  transliterateToNativeUnicode,
} from '../engine/scriptGenerator';
import { GlyphDrawingStudioPanel } from './GlyphDrawingStudioPanel';

interface ScriptStudioPanelProps {
  config: LanguageConfig;
  onChangeConfig: (newConfig: LanguageConfig) => void;
}

export const ScriptStudioPanel: React.FC<ScriptStudioPanelProps> = ({
  config,
  onChangeConfig,
}) => {
  // Studio sub-navigation: 'overview' | 'draw' | 'image'
  const [studioMode, setStudioMode] = useState<'overview' | 'draw' | 'image'>('overview');
  const [scratchText, setScratchText] = useState("rath'mor kret'va vel're");
  const [selectedGlyph, setSelectedGlyph] = useState<NativeGlyph | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const glyphMap = buildNativeGlyphMap(
    config.consonantInventory,
    config.vowelInventory,
    config.scriptStyle,
    config.customLetters,
    config.customGlyphs
  );

  const glyphList = Object.values(glyphMap);
  const transliteratedUnicode = transliterateToNativeUnicode(scratchText, glyphMap);
  const activeWordGlyphs = scratchText
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => ({
      word: w,
      glyphs: getWordSvgGlyphs(w, glyphMap),
    }));

  const handleStyleChange = (style: ScriptStyle) => {
    onChangeConfig({
      ...config,
      scriptStyle: style,
    });
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  /**
   * Paste copied text into the scratchpad at current cursor position or append to end.
   * ADDS to the text field without replacing!
   */
  const handlePasteScratch = async () => {
    try {
      let clipText = '';
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        clipText = await navigator.clipboard.readText();
      }
      if (!clipText) return;

      const input = inputRef.current;
      if (input) {
        const start = input.selectionStart ?? scratchText.length;
        const end = input.selectionEnd ?? scratchText.length;
        const before = scratchText.substring(0, start);
        const after = scratchText.substring(end);

        const needsLeadingSpace =
          before.length > 0 && !before.endsWith(' ') && !clipText.startsWith(' ');
        const needsTrailingSpace =
          after.length > 0 && !after.startsWith(' ') && !clipText.endsWith(' ');

        const insertion =
          (needsLeadingSpace ? ' ' : '') + clipText + (needsTrailingSpace ? ' ' : '');
        const newText = before + insertion + after;
        setScratchText(newText);

        setTimeout(() => {
          input.focus();
          const nextPos = start + insertion.length;
          input.setSelectionRange(nextPos, nextPos);
        }, 0);
      } else {
        setScratchText((prev) => {
          if (!prev) return clipText;
          const separator = prev.endsWith(' ') ? '' : ' ';
          return prev + separator + clipText;
        });
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  const handleExportGlyphMapJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(glyphMap, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${config.id}-unicode-glyphs-${config.scriptStyle}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8">
      {/* Studio Mode Selector Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStudioMode('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              studioMode === 'overview'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>📜 Script Styles & Scratchpad</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
              {glyphList.length} Glyphs
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStudioMode('draw')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              studioMode === 'draw'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>✏️ Hand-Draw Custom Glyphs</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
              Canvas
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStudioMode('image')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              studioMode === 'image'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>🖼️ Put Glyph Image / File</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300">
              Upload
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {config.customGlyphs && config.customGlyphs.length > 0 && (
            <span className="text-xs text-slate-400 hidden sm:flex items-center gap-1.5 font-mono bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{config.customGlyphs.length} Custom Glyphs in Vault</span>
            </span>
          )}

          <button
            onClick={handleExportGlyphMapJson}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono transition-colors cursor-pointer"
          >
            Export PUA Map JSON
          </button>
        </div>
      </div>

      {/* When in Drawing Canvas mode or Image Upload mode, render the complete visual studio */}
      {studioMode === 'draw' && (
        <GlyphDrawingStudioPanel
          config={config}
          onChangeConfig={onChangeConfig}
          initialTab="draw"
        />
      )}

      {studioMode === 'image' && (
        <GlyphDrawingStudioPanel
          config={config}
          onChangeConfig={onChangeConfig}
          initialTab="image"
        />
      )}

      {/* When in Script Overview mode, render the styles, scratchpad, word projection, and font chart */}
      {studioMode === 'overview' && (
        <>
          {/* Top Banner with Quick Jump Buttons */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <span>Script Engine & Orthographic Synthesis</span>
                  <span aria-hidden="true">·</span>
                  <span>Procedural Unicode PUA Architecture</span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  Unicode Character Generator & Native Script Studio
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Procedurally generates unique native vector glyphs mapped deterministically to the Unicode Private Use Area (PUA)
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setStudioMode('draw')}
                  className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                >
                  <span>✏️ Hand-Draw Glyph</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStudioMode('image')}
                  className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
                >
                  <span>🖼️ Put Image</span>
                </button>
              </div>
            </div>

            {/* Script Style Switcher */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Procedural Glyph Calligraphy Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    id: 'geometric-fluid',
                    label: 'Geometric Fluid',
                    desc: 'Tengwar & Georgian curves with sweeping ascenders',
                  },
                  {
                    id: 'runic',
                    label: 'Elder Runic',
                    desc: 'Khuzdul & Futhark angular straight staves and branches',
                  },
                  {
                    id: 'celestial-featural',
                    label: 'Celestial Featural',
                    desc: 'Astral circles, planetary vertices, and solar matrices',
                  },
                  {
                    id: 'cuneiform-matrix',
                    label: 'Cuneiform Matrix',
                    desc: 'Mesopotamian wedge vertices and matrix coordinate tines',
                  },
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => handleStyleChange(style.id as ScriptStyle)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      config.scriptStyle === style.id
                        ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-semibold">{style.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dedicated Artisan Callout Banner */}
          <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-amber-950/30 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                <span>🎨 Interactive Custom Glyph Studio Available</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px]">Active</span>
              </div>
              <p className="text-xs text-slate-300">
                Draw custom vector runes with symmetrical brush strokes or upload images/PNGs to assign unique Unicode PUA code points and integrate them into your language.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setStudioMode('draw')}
                className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-95"
              >
                <span>✏️ Open Drawing Canvas</span>
              </button>
              <button
                type="button"
                onClick={() => setStudioMode('image')}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-95"
              >
                <span>🖼️ Put Glyph Image</span>
              </button>
            </div>
          </div>

          {/* Interactive Live Scratchpad */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-semibold text-white">Live Native Calligraphy Scratchpad</h3>
              <span className="text-xs font-mono text-cyan-400">
                {glyphList.length} Glyphs in Active Font Map
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Type Romanized Words or Phrases
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePasteScratch}
                      className="px-2 py-0.5 text-xs bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/80 rounded font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-xs active:scale-95"
                      title="Paste from clipboard and add to text field without replacing"
                    >
                      <span>📋 Paste (Add)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setScratchText('')}
                      className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer px-1 py-0.5"
                      title="Clear scratchpad"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={scratchText}
                  onChange={(e) => setScratchText(e.target.value)}
                  placeholder="e.g. rath'mor vel're kran..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  Typing updates both vector stroke rendering and Unicode PUA characters instantaneously.
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Unicode PUA Character Stream:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(transliteratedUnicode, 'stream')}
                    className="text-cyan-400 hover:underline"
                  >
                    {copiedKey === 'stream' ? 'Copied!' : 'Copy Unicode String'}
                  </button>
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-sm tracking-widest break-all select-all min-h-[42px]">
                  {transliteratedUnicode || <span className="text-slate-600 font-sans italic">Type text to see Unicode characters</span>}
                </div>
              </div>
            </div>

            {/* Vector & Image Rendering Canvas */}
            <div className="mt-4 p-6 bg-slate-950 border border-slate-800/80 rounded-xl space-y-3">
              <div className="text-xs text-slate-400">Visual Script Projection ({config.scriptStyle}):</div>
              <div className="flex items-center gap-4 flex-wrap py-3 min-h-[70px]">
                {activeWordGlyphs.length === 0 ? (
                  <span className="text-slate-600 italic text-xs">No text entered</span>
                ) : (
                  activeWordGlyphs.map((item, wIdx) => (
                    <div
                      key={wIdx}
                      className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-800"
                    >
                      {item.glyphs.map((g, gIdx) => (
                        <div key={gIdx} className="inline-flex items-center">
                          {g.imageDataUrl ? (
                            <img
                              src={g.imageDataUrl}
                              alt={g.romanization}
                              title={`${g.romanization} (${g.unicodeHex})`}
                              className="w-8 h-8 object-contain rounded bg-slate-900 border border-cyan-800/80 p-0.5 hover:border-amber-400 transition-colors"
                            />
                          ) : (
                            <svg
                              viewBox="0 0 40 40"
                              className="w-8 h-8 stroke-cyan-300 fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round hover:stroke-amber-300 transition-colors"
                            >
                              <title>{`${g.romanization} (${g.unicodeHex})`}</title>
                              <path d={g.svgPath} />
                            </svg>
                          )}
                        </div>
                      ))}
                      <span className="text-[10px] text-slate-500 font-mono ml-1 border-l border-slate-800 pl-2">
                        {item.word}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Full Unicode Glyph Map Matrix & Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Glyph Matrix */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-semibold text-white">Unicode PUA Glyph Chart</h3>
                  <p className="text-xs text-slate-400">
                    Click any character to inspect its vector geometry, image asset, and copy its Unicode code point
                  </p>
                </div>
                <span className="text-xs text-cyan-400 font-mono">
                  {glyphList.length} Glyphs
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
                {glyphList.map((g) => (
                  <button
                    key={g.romanization}
                    onClick={() => setSelectedGlyph(g)}
                    className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-between relative ${
                      selectedGlyph?.romanization === g.romanization
                        ? 'bg-cyan-950/60 border-cyan-400 shadow-sm shadow-cyan-400/20'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {g.isCustom && (
                      <span
                        className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"
                        title="Custom Artisan Glyph"
                      />
                    )}
                    {g.imageDataUrl ? (
                      <img
                        src={g.imageDataUrl}
                        alt={g.romanization}
                        className="w-8 h-8 object-contain rounded bg-slate-900 border border-slate-700 p-0.5"
                      />
                    ) : (
                      <svg
                        viewBox="0 0 40 40"
                        className="w-8 h-8 stroke-cyan-300 fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round"
                      >
                        <path d={g.svgPath} />
                      </svg>
                    )}
                    <div className="text-xs font-bold text-slate-200 mt-1 font-mono">
                      {g.romanization}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">{g.unicodeHex}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Glyph Inspector */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-semibold text-white">Glyph Inspector</h3>
                <p className="text-xs text-slate-400">Vector geometry & Unicode specification</p>
              </div>

              {selectedGlyph ? (
                <div className="space-y-4 font-mono text-xs">
                  {/* Enlarged Vector or Image View */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center">
                    {selectedGlyph.imageDataUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <img
                          src={selectedGlyph.imageDataUrl}
                          alt={selectedGlyph.romanization}
                          className="w-24 h-24 object-contain rounded-xl border border-cyan-500/50 bg-slate-900 p-2 shadow-md"
                        />
                        <span className="text-[11px] text-amber-300 font-mono">Custom Image-Based Glyph Asset</span>
                      </div>
                    ) : (
                      <svg
                        viewBox="0 0 40 40"
                        className="w-28 h-28 stroke-cyan-300 fill-none stroke-[2] stroke-linecap-round stroke-linejoin-round shadow-inner"
                      >
                        <path d={selectedGlyph.svgPath} />
                      </svg>
                    )}
                    <span className="text-slate-400 text-xs mt-2 font-sans">
                      Style: {selectedGlyph.strokeType}
                    </span>
                  </div>

                  <div className="space-y-2 bg-slate-950 border border-slate-800 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans">Romanization:</span>
                      <span className="text-cyan-300 font-bold">{selectedGlyph.romanization}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans">IPA Symbol:</span>
                      <span className="text-amber-300 font-bold">/{selectedGlyph.phoneme}/</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans">Unicode Hex:</span>
                      <span className="text-slate-200">{selectedGlyph.unicodeHex}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans">Unicode Character:</span>
                      <span className="text-xl text-slate-100">{selectedGlyph.glyphChar}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 font-sans">SVG Vector Path Data:</span>
                    <textarea
                      readOnly
                      rows={3}
                      value={selectedGlyph.svgPath}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-[10px] text-slate-300 resize-none font-mono"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setScratchText((prev) => {
                        if (!prev.trim()) return selectedGlyph.romanization;
                        const separator = prev.endsWith(' ') ? '' : ' ';
                        return prev + separator + selectedGlyph.romanization;
                      });
                    }}
                    className="w-full py-1.5 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/80 rounded text-xs font-sans font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    title="Append this glyph's romanization to the scratchpad (does not replace existing text)"
                  >
                    <span>➕ Add to Scratchpad</span>
                  </button>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedGlyph.unicodeHex, 'hex')}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors cursor-pointer"
                    >
                      {copiedKey === 'hex' ? 'Copied Hex!' : 'Copy Hex'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedGlyph.glyphChar, 'char')}
                      className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs transition-colors cursor-pointer"
                    >
                      {copiedKey === 'char' ? 'Copied Char!' : 'Copy Character'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-8 text-center text-slate-500 text-xs">
                  Select any glyph from the chart to view its detailed vector specification, PUA hex, and geometry.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
