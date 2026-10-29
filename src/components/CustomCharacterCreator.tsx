/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { CustomLetter, LanguageConfig, PhonemeDef } from '../engine/types';
import { playAudioDataUrl, playConlangPronunciation } from '../engine/audioSynthesizer';

interface CustomCharacterCreatorProps {
  config: LanguageConfig;
  onChangeConfig: (newConfig: LanguageConfig) => void;
  onSelectLetterForInsert?: (letter: CustomLetter) => void;
}

export const CustomCharacterCreator: React.FC<CustomCharacterCreatorProps> = ({
  config,
  onChangeConfig,
  onSelectLetterForInsert,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [brushSize, setBrushSize] = useState<number>(5);
  const [pathsHistory, setPathsHistory] = useState<string[]>([]);
  const [currentPathPoints, setCurrentPathPoints] = useState<{ x: number; y: number }[]>([]);
  const [currentSvgPath, setCurrentSvgPath] = useState<string>('');
  const [imageDataUrl, setImageDataUrl] = useState<string>('');

  // Form Fields
  const nextPuaHex = (0xe100 + config.customLetters.length + 1).toString(16).toUpperCase();
  const [romanization, setRomanization] = useState<string>('');
  const [ipaSymbol, setIpaSymbol] = useState<string>('');
  const [unicodeHex, setUnicodeHex] = useState<string>(`U+${nextPuaHex}`);
  const [category, setCategory] = useState<'consonant' | 'vowel'>('consonant');
  const [manner, setManner] = useState<string>('fricative');
  const [place, setPlace] = useState<string>('velar');
  const [height, setHeight] = useState<string>('close');
  const [backness, setBackness] = useState<string>('front');
  const [speechHint, setSpeechHint] = useState<string>('');

  // Audio Recording State
  const [audioDataUrl, setAudioDataUrl] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Canvas setup & redraw
  useEffect(() => {
    drawGrid();
  }, []);

  const drawGrid = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dark canvas background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Reference guidelines
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Baseline (y = 200)
    ctx.strokeStyle = '#38bdf840';
    ctx.beginPath();
    ctx.moveTo(0, 200);
    ctx.lineTo(canvas.width, 200);
    ctx.stroke();

    // Meanline / x-height (y = 110)
    ctx.strokeStyle = '#818cf830';
    ctx.beginPath();
    ctx.moveTo(0, 110);
    ctx.lineTo(canvas.width, 110);
    ctx.stroke();

    // Center vertical axis (x = 140)
    ctx.strokeStyle = '#94a3b825';
    ctx.beginPath();
    ctx.moveTo(140, 0);
    ctx.lineTo(140, canvas.height);
    ctx.stroke();

    ctx.setLineDash([]);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = tool === 'pen' ? '#22d3ee' : '#090d16';
    setCurrentPathPoints([{ x, y }]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();
    setCurrentPathPoints((prev) => [...prev, { x, y }]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert drawn points to scaled SVG path string (normalized to 0 0 40 40)
    if (currentPathPoints.length > 1) {
      const scale = 40 / canvas.width;
      let pathStr = currentSvgPath;
      pathStr += ` M ${Math.round(currentPathPoints[0].x * scale * 10) / 10} ${Math.round(currentPathPoints[0].y * scale * 10) / 10}`;
      for (let i = 1; i < currentPathPoints.length; i++) {
        pathStr += ` L ${Math.round(currentPathPoints[i].x * scale * 10) / 10} ${Math.round(currentPathPoints[i].y * scale * 10) / 10}`;
      }
      setCurrentSvgPath(pathStr);
      setPathsHistory((prev) => [...prev, pathStr]);
      setImageDataUrl(canvas.toDataURL('image/png'));
    }
  };

  const handleClearCanvas = () => {
    drawGrid();
    setCurrentSvgPath('');
    setPathsHistory([]);
    setImageDataUrl('');
  };

  const handleUndoCanvas = () => {
    if (pathsHistory.length === 0) return;
    const updatedHistory = pathsHistory.slice(0, -1);
    setPathsHistory(updatedHistory);
    drawGrid();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Replay remaining SVG paths onto canvas
    const scale = canvas.width / 40;
    const newSvg = updatedHistory.join(' ');
    setCurrentSvgPath(newSvg);

    updatedHistory.forEach((pathSegment) => {
      ctx.beginPath();
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#22d3ee';

      const commands = pathSegment.trim().split(/(?=[MLZ])/);
      commands.forEach((cmd) => {
        const parts = cmd.trim().split(/\s+/);
        const op = parts[0];
        const px = parseFloat(parts[1]) * scale;
        const py = parseFloat(parts[2]) * scale;
        if (op === 'M') ctx.moveTo(px, py);
        else if (op === 'L') ctx.lineTo(px, py);
      });
      ctx.stroke();
    });

    if (canvas) setImageDataUrl(canvas.toDataURL('image/png'));
  };

  // Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        drawGrid();

        // Fit image into canvas centered
        const padding = 28;
        const maxW = canvas.width - padding * 2;
        const maxH = canvas.height - padding * 2;
        const ratio = Math.min(maxW / img.width, maxH / img.height);
        const drawW = img.width * ratio;
        const drawH = img.height * ratio;
        const dx = (canvas.width - drawW) / 2;
        const dy = (canvas.height - drawH) / 2;

        ctx.drawImage(img, dx, dy, drawW, drawH);
        setImageDataUrl(canvas.toDataURL('image/png'));

        // Generate bounding outline path
        const svgBox = `M ${Math.round((dx / canvas.width) * 40)} ${Math.round((dy / canvas.height) * 40)} L ${Math.round(((dx + drawW) / canvas.width) * 40)} ${Math.round((dy / canvas.height) * 40)} L ${Math.round(((dx + drawW) / canvas.width) * 40)} ${Math.round(((dy + drawH) / canvas.height) * 40)} L ${Math.round((dx / canvas.width) * 40)} ${Math.round(((dy + drawH) / canvas.height) * 40)} Z`;
        setCurrentSvgPath(svgBox);
        setStatusMessage('Image uploaded and processed as custom glyph!');
        setTimeout(() => setStatusMessage(''), 3000);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Audio Recording (Microphone via MediaRecorder API)
  const handleStartRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Microphone access is not supported on this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioDataUrl(reader.result as string);
          setStatusMessage('Microphone recording saved successfully!');
          setTimeout(() => setStatusMessage(''), 3000);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      const timer = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 6) {
            handleStopRecording();
            clearInterval(timer);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission or error:', err);
      alert('Unable to access microphone. You can also upload an audio file below.');
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Audio File Upload
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setAudioDataUrl(event.target?.result as string);
      setStatusMessage(`Audio file "${file.name}" attached successfully!`);
      setTimeout(() => setStatusMessage(''), 3000);
    };
    reader.readAsDataURL(file);
  };

  // Test Play audio
  const handlePlayAudio = (url: string, id: string) => {
    setPlayingId(id);
    playAudioDataUrl(url, undefined, () => setPlayingId(null));
  };

  // Save Custom Letter into Language Config
  const handleSaveCustomLetter = () => {
    if (!romanization.trim()) {
      alert('Please enter a Romanization representation for this letter (e.g. "x̌", "θ", "qʼ", or "ž").');
      return;
    }

    const cleanRom = romanization.trim();
    const cleanIpa = ipaSymbol.trim() || `/${cleanRom}/`;
    const cleanHex = unicodeHex.trim() || `U+${nextPuaHex}`;
    const codePoint = parseInt(cleanHex.replace(/^U\+/i, ''), 16) || 0xe101;
    const glyphChar = String.fromCodePoint(codePoint);

    // Fallback default SVG path if not drawn
    const finalSvg =
      currentSvgPath ||
      'M 12 12 L 28 28 M 28 12 L 12 28 M 20 6 L 20 34';

    const newLetter: CustomLetter = {
      id: `letter-${Date.now()}`,
      symbol: glyphChar,
      unicodeHex: cleanHex,
      romanization: cleanRom,
      ipa: cleanIpa,
      category,
      manner: category === 'consonant' ? manner : undefined,
      place: category === 'consonant' ? place : undefined,
      height: category === 'vowel' ? height : undefined,
      backness: category === 'vowel' ? backness : undefined,
      svgPath: finalSvg,
      imageDataUrl: imageDataUrl || undefined,
      audioDataUrl: audioDataUrl || undefined,
      speechPronunciation: speechHint.trim() || cleanRom,
      createdAt: Date.now(),
    };

    // Phoneme def to integrate directly into active inventories
    const phonemeDef: PhonemeDef = {
      symbol: cleanIpa.replace(/^\/|\/$/g, ''),
      romanization: cleanRom,
      category,
      manner: newLetter.manner,
      place: newLetter.place,
      height: newLetter.height,
      backness: newLetter.backness,
      isCustom: true,
      customId: newLetter.id,
      unicodeHex: cleanHex,
      svgPath: finalSvg,
      imageDataUrl: imageDataUrl || undefined,
      audioDataUrl: audioDataUrl || undefined,
    };

    let updatedConsonants = [...config.consonantInventory];
    let updatedVowels = [...config.vowelInventory];

    if (category === 'consonant') {
      if (!updatedConsonants.some((c) => c.romanization === cleanRom)) {
        updatedConsonants.push(phonemeDef);
      }
    } else {
      if (!updatedVowels.some((v) => v.romanization === cleanRom)) {
        updatedVowels.push(phonemeDef);
      }
    }

    onChangeConfig({
      ...config,
      customLetters: [...config.customLetters, newLetter],
      consonantInventory: updatedConsonants,
      vowelInventory: updatedVowels,
    });

    // Reset form
    setRomanization('');
    setIpaSymbol('');
    setAudioDataUrl('');
    setSpeechHint('');
    handleClearCanvas();
    setStatusMessage(`Letter "${cleanRom}" (${cleanHex}) registered into phonology and script!`);
    setTimeout(() => setStatusMessage(''), 4000);
  };

  const handleDeleteCustomLetter = (id: string, rom: string) => {
    onChangeConfig({
      ...config,
      customLetters: config.customLetters.filter((cl) => cl.id !== id),
      consonantInventory: config.consonantInventory.filter((c) => c.romanization !== rom),
      vowelInventory: config.vowelInventory.filter((v) => v.romanization !== rom),
      initialConstraints: {
        ...config.initialConstraints,
        requiredStartingSounds: config.initialConstraints.requiredStartingSounds.filter((s) => s !== rom),
        prohibitedStartingSounds: config.initialConstraints.prohibitedStartingSounds.filter((s) => s !== rom),
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Font & Character Forge</span>
            <span aria-hidden="true">·</span>
            <span>Custom Unicode Glyph & Audio Pronunciation Studio</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Custom Unicode Character & Audio Creator
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Draw custom characters or upload image glyphs, record real audio pronunciations, assign IPA/Unicode code points, and use them universally across phonotactics, initial constraints, grammar affixes, and the translator.
          </p>
        </div>

        {statusMessage && (
          <div className="bg-cyan-950/80 border border-cyan-500/60 text-cyan-200 text-xs px-4 py-2.5 rounded-lg flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage('')} className="text-cyan-400 hover:text-white">
              ×
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Drawing & Image Canvas (Left Column) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-sm font-semibold text-white">Glyph Drawing Canvas</h3>
              <p className="text-[11px] text-slate-400">Draw with mouse/touch or upload an image asset</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTool('pen')}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  tool === 'pen'
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-200 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Pen
              </button>
              <button
                type="button"
                onClick={() => setTool('eraser')}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  tool === 'eraser'
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-200 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Eraser
              </button>
              <button
                type="button"
                onClick={handleUndoCanvas}
                className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                title="Undo last stroke"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={handleClearCanvas}
                className="px-2 py-1 text-xs bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-200 rounded border border-slate-700"
                title="Clear canvas"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Canvas Box */}
          <div className="flex flex-col items-center justify-center p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <canvas
              ref={canvasRef}
              width={280}
              height={280}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="cursor-crosshair rounded-lg border border-slate-800 touch-none shadow-inner"
            />
            <div className="flex items-center justify-between w-full max-w-[280px] text-[10px] text-slate-400 mt-2 font-mono">
              <span>Guideline: Blue=Baseline, Purple=Meanline</span>
              <span>280×280 Vector Stage</span>
            </div>
          </div>

          {/* Stroke Width & Image Upload */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Stroke Thickness: {brushSize}px
              </label>
              <input
                type="range"
                min="2"
                max="14"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Or Upload Glyph Image
              </label>
              <label className="flex items-center justify-center px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer transition-colors text-center">
                <span>Select PNG / JPG / SVG</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Phonetic & Linguistic Assignment Form (Right Column) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-sm font-semibold text-white">Linguistic & Unicode Assignment</h3>
            <p className="text-[11px] text-slate-400">Specify phonetic symbols, IPA mapping, and Unicode code points</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Romanization Symbol <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={romanization}
                onChange={(e) => setRomanization(e.target.value)}
                placeholder="e.g. x̌, θ, qʼ, ŋ, zh, tl"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                How this custom letter is typed in words and sentences.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                IPA Transcription
              </label>
              <input
                type="text"
                value={ipaSymbol}
                onChange={(e) => setIpaSymbol(e.target.value)}
                placeholder="e.g. /χ/, /θ/, /qʼ/, /ŋ/"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm font-mono text-amber-300 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Standard International Phonetic Alphabet representation.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Unicode Code Point
              </label>
              <input
                type="text"
                value={unicodeHex}
                onChange={(e) => setUnicodeHex(e.target.value)}
                placeholder="e.g. U+E101"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Private Use Area (PUA) range: U+E000 to U+F8FF.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Phoneme Classification
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'consonant' | 'vowel')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="consonant">Consonant</option>
                <option value="vowel">Vowel</option>
              </select>
            </div>
          </div>

          {category === 'consonant' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Manner of Articulation</label>
                <select
                  value={manner}
                  onChange={(e) => setManner(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="plosive">Plosive Stop</option>
                  <option value="fricative">Fricative</option>
                  <option value="affricate">Affricate</option>
                  <option value="nasal">Nasal</option>
                  <option value="trill">Trill / Tap</option>
                  <option value="approximant">Approximant / Lateral</option>
                  <option value="ejective">Ejective</option>
                  <option value="click">Click</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Place of Articulation</label>
                <select
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="bilabial">Bilabial</option>
                  <option value="labiodental">Labiodental</option>
                  <option value="dental">Dental</option>
                  <option value="alveolar">Alveolar</option>
                  <option value="postalveolar">Postalveolar</option>
                  <option value="palatal">Palatal</option>
                  <option value="velar">Velar</option>
                  <option value="uvular">Uvular</option>
                  <option value="pharyngeal">Pharyngeal</option>
                  <option value="glottal">Glottal</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Vowel Height</label>
                <select
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="close">Close / High</option>
                  <option value="near-close">Near-Close</option>
                  <option value="close-mid">Close-Mid</option>
                  <option value="mid">Mid</option>
                  <option value="open-mid">Open-Mid</option>
                  <option value="open">Open / Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Vowel Backness</label>
                <select
                  value={backness}
                  onChange={(e) => setBackness(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                >
                  <option value="front">Front</option>
                  <option value="central">Central</option>
                  <option value="back">Back</option>
                </select>
              </div>
            </div>
          )}

          {/* Audio Pronunciation Assignment Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                Audio Pronunciation Assignment
              </span>
              {audioDataUrl && (
                <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded">
                  Audio Attached
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Record via mic */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 block">Record Voice Pronunciation:</span>
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-900/50 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                    <span>Record Microphone</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="w-full py-1.5 bg-rose-950 text-rose-200 border border-rose-600 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                  >
                    <span>Stop Recording ({recordingSeconds}s)</span>
                  </button>
                )}
              </div>

              {/* Upload audio file */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 block">Or Upload Audio File:</span>
                <label className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                  <span>Upload .mp3 / .wav</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Audio playback test */}
            {audioDataUrl && (
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => handlePlayAudio(audioDataUrl, 'current-test')}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>{playingId === 'current-test' ? 'Playing Audio...' : 'Listen to Recorded Audio'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAudioDataUrl('')}
                  className="text-[11px] text-slate-400 hover:text-rose-400 cursor-pointer"
                >
                  Remove Audio
                </button>
              </div>
            )}

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Phonetic Speech Engine Hint (for TTS fallback)
              </label>
              <input
                type="text"
                value={speechHint}
                onChange={(e) => setSpeechHint(e.target.value)}
                placeholder="e.g. 'kh', 'th', 'sh', 'ny'"
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 font-mono"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSaveCustomLetter}
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm shadow-cyan-600/30"
          >
            Register Custom Character & Audio into Engine
          </button>
        </div>
      </div>

      {/* Existing Custom Letters Registry */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-semibold text-white">Active Custom Letters & Audio Registry</h3>
            <p className="text-xs text-slate-400">
              Custom characters registered in {config.name}. Use them in phonotactics, constraints, and words.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            {config.customLetters.length} Custom Characters
          </span>
        </div>

        {config.customLetters.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs font-sans">
            No custom characters registered yet. Draw or upload a glyph above to create your own Unicode phoneme!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.customLetters.map((cl) => (
              <div
                key={cl.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  {/* Glyph preview */}
                  <div className="w-14 h-14 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center p-1.5 shadow-inner">
                    {cl.imageDataUrl ? (
                      <img
                        src={cl.imageDataUrl}
                        alt={cl.romanization}
                        className="w-full h-full object-contain filter invert"
                      />
                    ) : (
                      <svg viewBox="0 0 40 40" className="w-10 h-10 stroke-cyan-300 fill-none stroke-[2.2] stroke-linecap-round stroke-linejoin-round">
                        <path d={cl.svgPath || 'M10,20 L30,20'} />
                      </svg>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-cyan-300">{cl.unicodeHex}</span>
                    <div className="text-[10px] text-slate-400 capitalize">{cl.category}</div>
                  </div>
                </div>

                <div className="space-y-1 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-sans">Spelling:</span>
                    <span className="font-bold text-slate-200">{cl.romanization}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-sans">IPA:</span>
                    <span className="text-amber-300">{cl.ipa}</span>
                  </div>
                  {cl.manner && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-sans">Manner:</span>
                      <span className="text-slate-300 capitalize">{cl.manner}</span>
                    </div>
                  )}
                </div>

                {/* Actions: Audio, Insert, Delete */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {cl.audioDataUrl ? (
                      <button
                        type="button"
                        onClick={() => handlePlayAudio(cl.audioDataUrl!, cl.id)}
                        className="px-2 py-1 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded text-[11px] font-sans hover:bg-emerald-900/60 transition-colors cursor-pointer"
                      >
                        {playingId === cl.id ? 'Playing...' : 'Play Audio'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => playConlangPronunciation(cl.romanization, cl.ipa || cl.ipaSymbol || cl.romanization)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-sans transition-colors cursor-pointer"
                      >
                        TTS Voice
                      </button>
                    )}

                    {onSelectLetterForInsert && (
                      <button
                        type="button"
                        onClick={() => onSelectLetterForInsert(cl)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] font-sans transition-colors cursor-pointer"
                        title="Use this symbol in constraints or word builder"
                      >
                        Insert
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteCustomLetter(cl.id, cl.romanization)}
                    className="text-xs text-slate-500 hover:text-rose-400 font-sans transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
