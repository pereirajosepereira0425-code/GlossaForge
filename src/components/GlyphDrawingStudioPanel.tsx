/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { CustomDrawnGlyph, LanguageConfig, PhonemeDef } from '../engine/types';

interface GlyphDrawingStudioPanelProps {
  config: LanguageConfig;
  onChangeConfig: (newConfig: LanguageConfig) => void;
  onAddPhonemeToMatrix?: (phoneme: PhonemeDef) => void;
  initialTab?: 'draw' | 'image';
}

export const GlyphDrawingStudioPanel: React.FC<GlyphDrawingStudioPanelProps> = ({
  config,
  onChangeConfig,
  onAddPhonemeToMatrix,
  initialTab = 'draw',
}) => {
  // Mode: Draw or Image upload
  const [activeTab, setActiveTab] = useState<'draw' | 'image'>(initialTab);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Drawing state
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [symmetryMode, setSymmetryMode] = useState<'none' | 'vertical' | 'horizontal' | 'quad'>('vertical');
  const [showGuidelines, setShowGuidelines] = useState<boolean>(true);
  const [isErasing, setIsErasing] = useState<boolean>(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // Form metadata state
  const [glyphName, setGlyphName] = useState<string>('Solar Sigil');
  const [glyphRoman, setGlyphRoman] = useState<string>('š');
  const [glyphIpa, setGlyphIpa] = useState<string>('ʃ');
  const [glyphCategory, setGlyphCategory] = useState<'consonant' | 'vowel'>('consonant');
  const [assignedHex, setAssignedHex] = useState<string>(() => {
    const nextIdx = 0xe050 + (config.customGlyphs?.length || 0);
    return `U+${nextIdx.toString(16).toUpperCase()}`;
  });

  // Exported vector path
  const [generatedSvgPath, setGeneratedSvgPath] = useState<string>('M20,6 L20,34 M10,14 L30,14');

  // Image upload state
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Selected glyph from vault for inspection
  const [selectedVaultGlyph, setSelectedVaultGlyph] = useState<CustomDrawnGlyph | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize canvas with blank background
  useEffect(() => {
    initCanvas();
  }, []);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistoryState();
  };

  const saveHistoryState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(data);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Convert canvas to SVG path approximation
    extractSvgPathFromCanvas();
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.putImageData(history[prevIdx], 0, 0);
      setHistoryIndex(prevIdx);
      extractSvgPathFromCanvas();
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.putImageData(history[nextIdx], 0, 0);
      setHistoryIndex(nextIdx);
      extractSvgPathFromCanvas();
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistoryState();
  };

  // Convert canvas pixel center coordinates to simplified SVG stroke points
  const extractSvgPathFromCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const points: [number, number][] = [];

    // Sample active pixels mapped to 40x40 coordinate box
    const step = 8;
    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const i = (y * canvas.width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // If not dark background
        if (r > 40 || g > 40 || b > 40) {
          const mapX = Math.round((x / canvas.width) * 40);
          const mapY = Math.round((y / canvas.height) * 40);
          points.push([mapX, mapY]);
        }
      }
    }

    if (points.length === 0) {
      setGeneratedSvgPath('M20,6 L20,34 M12,14 L28,14');
      return;
    }

    // Build stroke segments
    let path = `M${points[0][0]},${points[0][1]}`;
    for (let p = 1; p < points.length; p += 2) {
      path += ` L${points[p][0]},${points[p][1]}`;
    }
    setGeneratedSvgPath(path);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e);
    drawStroke(x, y, true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoords(e);
    drawStroke(x, y, false);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveHistoryState();
    }
  };

  const drawStroke = (x: number, y: number, isStart: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = isErasing ? '#020617' : '#06b6d4';
    ctx.lineWidth = strokeWidth * (isErasing ? 3 : 1);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const renderPoint = (px: number, py: number) => {
      ctx.beginPath();
      ctx.arc(px, py, (strokeWidth / 2) * (isErasing ? 2 : 1), 0, Math.PI * 2);
      ctx.fillStyle = isErasing ? '#020617' : '#06b6d4';
      ctx.fill();
    };

    // Primary point
    renderPoint(x, y);

    // Apply symmetry transformations
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (symmetryMode === 'vertical' || symmetryMode === 'quad') {
      const mirrorX = cx + (cx - x);
      renderPoint(mirrorX, y);
    }

    if (symmetryMode === 'horizontal' || symmetryMode === 'quad') {
      const mirrorY = cy + (cy - y);
      renderPoint(x, mirrorY);
    }

    if (symmetryMode === 'quad') {
      const mirrorX = cx + (cx - x);
      const mirrorY = cy + (cy - y);
      renderPoint(mirrorX, mirrorY);
    }
  };

  // Image file handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      setUploadedImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Save new glyph to language config
  const handleSaveGlyph = () => {
    if (!glyphRoman.trim()) return;

    const hexClean = assignedHex.replace(/^U\+/i, '').trim();
    const codePoint = parseInt(hexClean, 16) || 0xe050;
    const glyphChar = String.fromCodePoint(codePoint);

    const newGlyph: CustomDrawnGlyph = {
      id: `custom-glyph-${Date.now()}`,
      name: glyphName.trim() || 'Custom Glyph',
      romanization: glyphRoman.trim(),
      phonemeSymbol: glyphIpa.trim().replace(/^\/|\/$/g, '') || glyphRoman.trim(),
      unicodeHex: `U+${hexClean.toUpperCase()}`,
      glyphChar,
      svgPath: activeTab === 'draw' ? generatedSvgPath : 'M10,10 L30,10 L30,30 L10,30 Z',
      imageUrl: activeTab === 'image' && uploadedImageUrl ? uploadedImageUrl : undefined,
      strokeType: activeTab === 'image' && uploadedImageUrl ? 'image-based' : 'custom-drawn',
      createdAt: new Date().toISOString(),
    };

    const updatedCustomList = [...(config.customGlyphs || []), newGlyph];

    // Also automatically register or link as a custom phoneme in consonant or vowel inventory
    let updatedConsonants = [...config.consonantInventory];
    let updatedVowels = [...config.vowelInventory];

    if (glyphCategory === 'consonant') {
      if (!updatedConsonants.some((c) => c.romanization === newGlyph.romanization)) {
        updatedConsonants.push({
          symbol: newGlyph.phonemeSymbol,
          romanization: newGlyph.romanization,
          category: 'consonant',
          manner: 'fricative',
          place: 'postalveolar',
          isCustom: true,
          customUnicode: newGlyph.unicodeHex,
          customSvgPath: newGlyph.svgPath,
          customImageUrl: newGlyph.imageUrl,
        });
      }
    } else {
      if (!updatedVowels.some((v) => v.romanization === newGlyph.romanization)) {
        updatedVowels.push({
          symbol: newGlyph.phonemeSymbol,
          romanization: newGlyph.romanization,
          category: 'vowel',
          height: 'mid',
          backness: 'front',
          rounded: false,
          isCustom: true,
          customUnicode: newGlyph.unicodeHex,
          customSvgPath: newGlyph.svgPath,
          customImageUrl: newGlyph.imageUrl,
        });
      }
    }

    onChangeConfig({
      ...config,
      customGlyphs: updatedCustomList,
      consonantInventory: updatedConsonants,
      vowelInventory: updatedVowels,
    });

    // Bump assigned hex for next glyph
    const nextCode = codePoint + 1;
    setAssignedHex(`U+${nextCode.toString(16).toUpperCase()}`);
    setToastMessage(`🎉 Glyph "${newGlyph.name}" [${newGlyph.romanization}] (${newGlyph.unicodeHex}) saved! Instantly active in Unicode script matrix & scratchpad.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteCustomGlyph = (id: string) => {
    const filtered = (config.customGlyphs || []).filter((g) => g.id !== id);
    onChangeConfig({
      ...config,
      customGlyphs: filtered,
    });
    if (selectedVaultGlyph?.id === id) {
      setSelectedVaultGlyph(null);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-medium shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-400 hover:text-emerald-100 cursor-pointer font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>Dedicated Visual Studio</span>
              <span aria-hidden="true">·</span>
              <span>Unicode Draw Canvas & Glyph Image Section</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Unicode Drawing Canvas & Glyph Image Studio
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Hand-draw custom runes and calligraphic vector strokes, or upload image assets, and map them deterministically to Unicode PUA code points and phonetic inventories.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-cyan-300">
              Custom Glyphs in Vault: {config.customGlyphs?.length || 0}
            </span>
          </div>
        </div>

        {/* Tab switcher: Draw Canvas vs Image Upload */}
        <div className="grid grid-cols-2 gap-3 p-1 bg-slate-950 rounded-lg border border-slate-800 max-w-md">
          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`py-2 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'draw'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>✏️ Hand-Draw Vector Canvas</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`py-2 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'image'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🖼️ Put Glyph Image / File</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Canvas or Image Workspace */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          {activeTab === 'draw' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 text-xs">
                {/* Symmetry Modes */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Symmetry:</span>
                  {(['none', 'vertical', 'horizontal', 'quad'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSymmetryMode(mode)}
                      className={`px-2.5 py-1 rounded text-[11px] capitalize transition-colors ${
                        symmetryMode === mode
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {/* Brush / Eraser & Guidelines */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsErasing(!isErasing)}
                    className={`px-2.5 py-1 rounded text-[11px] transition-colors border ${
                      isErasing
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {isErasing ? '🧹 Eraser Active' : '✏️ Pen Mode'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowGuidelines(!showGuidelines)}
                    className={`px-2.5 py-1 rounded text-[11px] transition-colors border ${
                      showGuidelines
                        ? 'bg-cyan-950 border-cyan-800 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-500'
                    }`}
                  >
                    📏 Grid
                  </button>
                </div>
              </div>

              {/* Canvas Box */}
              <div className="relative flex justify-center items-center bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={320}
                  height={320}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  onTouchCancel={stopDrawing}
                  className="rounded-xl border border-slate-800/80 cursor-crosshair touch-none shadow-2xl"
                />

                {/* Subtle Guidelines Overlay */}
                {showGuidelines && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[320px] h-[320px] relative">
                      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-cyan-500/15" />
                      <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-cyan-500/15" />
                      <div className="absolute inset-8 rounded-full border border-dashed border-cyan-500/10" />
                      <div className="absolute top-12 left-0 right-0 h-[1px] border-b border-dotted border-slate-800" />
                      <div className="absolute bottom-12 left-0 right-0 h-[1px] border-b border-dotted border-slate-800" />
                    </div>
                  </div>
                )}
              </div>

              {/* Stroke Width & History Controls */}
              <div className="flex items-center justify-between gap-4 pt-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">Weight:</span>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(parseInt(e.target.value, 10))}
                    className="w-24 accent-cyan-400"
                  />
                  <span className="font-mono text-cyan-300">{strokeWidth}px</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-xs disabled:opacity-40"
                  >
                    ↩ Undo
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-xs disabled:opacity-40"
                  >
                    ↪ Redo
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 rounded border border-rose-900 text-xs"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Image Upload Workspace */
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.svg,.png,.jpg,.jpeg,.webp"
                onChange={handleImageFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-cyan-500/60 bg-slate-950/60 p-10 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all group"
              >
                {uploadedImageUrl ? (
                  <div className="flex flex-col items-center space-y-3">
                    <img
                      src={uploadedImageUrl}
                      alt="Uploaded glyph asset"
                      className="w-32 h-32 object-contain rounded-xl border border-cyan-500/40 p-2 bg-slate-900 shadow-md"
                    />
                    <span className="text-xs text-cyan-300 font-mono">
                      {uploadedFileName || 'Image loaded successfully'}
                    </span>
                    <span className="text-[11px] text-slate-400">Click to replace image</span>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform mb-3">
                      🖼️
                    </div>
                    <div className="text-sm font-semibold text-slate-200">
                      Upload Custom Rune / Glyph Image
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Supports PNG, SVG, JPG, WebP (Ideal: high-contrast transparent icon)
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Real-time Vector Stroke Preview */}
          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 font-sans text-xs">
              <span>Mathematical SVG Path Generation:</span>
              <button
                type="button"
                onClick={() => handleCopy(generatedSvgPath, 'svg')}
                className="text-cyan-400 hover:underline"
              >
                {copiedKey === 'svg' ? 'Copied Path!' : 'Copy SVG Path'}
              </button>
            </div>
            <div className="text-[11px] text-cyan-300 truncate select-all">{generatedSvgPath}</div>
          </div>
        </div>

        {/* Right Column: Metadata & Phonetic Matrix Association Form */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-semibold text-white">Glyph Identity & Phonetics</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Assign this visual character to a Slavic Romanization and IPA phoneme
            </p>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Glyph Symbolic Name</label>
              <input
                type="text"
                value={glyphName}
                onChange={(e) => setGlyphName(e.target.value)}
                placeholder="e.g. Solar Stave, Shadow Fricative"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Slavic Romanization
                </label>
                <input
                  type="text"
                  value={glyphRoman}
                  onChange={(e) => setGlyphRoman(e.target.value)}
                  placeholder="e.g. š, č, ř, k'r"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  IPA Phoneme Symbol
                </label>
                <input
                  type="text"
                  value={glyphIpa}
                  onChange={(e) => setGlyphIpa(e.target.value)}
                  placeholder="e.g. ʃ, tʃ, q, ʔ"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Sound Category</label>
                <select
                  value={glyphCategory}
                  onChange={(e) => setGlyphCategory(e.target.value as 'consonant' | 'vowel')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="consonant">Consonant</option>
                  <option value="vowel">Vowel</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Unicode PUA Hex</label>
                <input
                  type="text"
                  value={assignedHex}
                  onChange={(e) => setAssignedHex(e.target.value)}
                  placeholder="e.g. U+E050"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Visual Preview Card */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-sans">Font Preview:</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5">{glyphName}</div>
                <div className="text-xs font-mono text-cyan-300 mt-0.5">
                  Roman: <strong>{glyphRoman}</strong> · IPA: <strong>/{glyphIpa}/</strong>
                </div>
              </div>

              <div className="w-14 h-14 rounded-lg bg-slate-900 border border-cyan-500/40 flex items-center justify-center p-1.5 shadow-inner">
                {activeTab === 'image' && uploadedImageUrl ? (
                  <img src={uploadedImageUrl} alt="preview" className="w-10 h-10 object-contain" />
                ) : (
                  <svg
                    viewBox="0 0 40 40"
                    className="w-10 h-10 stroke-cyan-300 fill-none stroke-[2.4] stroke-linecap-round stroke-linejoin-round"
                  >
                    <path d={generatedSvgPath} />
                  </svg>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveGlyph}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer mt-2"
            >
              Save to Font & Register Glyph
            </button>
          </div>
        </div>
      </div>

      {/* Custom Glyphs Vault Gallery */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-semibold text-white">Registered Custom Glyphs Vault</h3>
            <p className="text-xs text-slate-400">
              Custom-drawn vector strokes and uploaded glyph images active in your language font map
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {config.customGlyphs?.length || 0} Registered
          </span>
        </div>

        {(!config.customGlyphs || config.customGlyphs.length === 0) ? (
          <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
            No custom glyphs registered yet. Draw a rune on the canvas above or upload an image to create your first custom Unicode character!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {config.customGlyphs.map((g) => (
              <div
                key={g.id}
                onClick={() => setSelectedVaultGlyph(g)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-between text-center ${
                  selectedVaultGlyph?.id === g.id
                    ? 'bg-cyan-950/60 border-cyan-400 shadow-sm'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="w-12 h-12 flex items-center justify-center p-1">
                  {g.imageUrl ? (
                    <img src={g.imageUrl} alt={g.name} className="w-10 h-10 object-contain rounded" />
                  ) : (
                    <svg
                      viewBox="0 0 40 40"
                      className="w-10 h-10 stroke-cyan-300 fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round"
                    >
                      <path d={g.svgPath} />
                    </svg>
                  )}
                </div>

                <div className="text-xs font-bold text-slate-200 mt-2 font-mono truncate max-w-full">
                  {g.romanization}
                </div>
                <div className="text-[10px] text-amber-300 font-mono">/{g.phonemeSymbol}/</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">{g.unicodeHex}</div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCustomGlyph(g.id);
                  }}
                  className="mt-2 text-[10px] text-slate-500 hover:text-rose-400"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
