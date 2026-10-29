/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { CustomAudioAttachment } from '../engine/types';
import { playConlangPronunciation } from '../engine/audioSynthesizer';

interface AudioRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetWordOrPhrase: string;
  conlangRomanized: string;
  ipa: string;
  existingAudio?: CustomAudioAttachment;
  onSaveAudio: (attachment: CustomAudioAttachment) => void;
  onDeleteAudio?: () => void;
}

export const AudioRecorderModal: React.FC<AudioRecorderModalProps> = ({
  isOpen,
  onClose,
  targetWordOrPhrase,
  conlangRomanized,
  ipa,
  existingAudio,
  onSaveAudio,
  onDeleteAudio,
}) => {
  const [activeMode, setActiveMode] = useState<'record' | 'upload'>('record');
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(existingAudio?.audioBlobUrl || null);
  const [recordedMimeType, setRecordedMimeType] = useState<string>(existingAudio?.mimeType || 'audio/webm');
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedBlobUrl, setUploadedBlobUrl] = useState<string | null>(
    existingAudio?.source === 'file-upload' ? existingAudio.audioBlobUrl : null
  );

  // Playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // Synth ref
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Refs for Web Audio API & MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (existingAudio) {
      if (existingAudio.source === 'file-upload') {
        setActiveMode('upload');
        setUploadedBlobUrl(existingAudio.audioBlobUrl);
      } else {
        setActiveMode('record');
        setRecordedBlobUrl(existingAudio.audioBlobUrl);
      }
    } else {
      setRecordedBlobUrl(null);
      setUploadedBlobUrl(null);
      setUploadedFile(null);
    }
  }, [existingAudio, isOpen]);

  // Clean up timer and media streams on unmount or close
  useEffect(() => {
    return () => {
      stopRecordingCleanup();
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    };
  }, []);

  if (!isOpen) return null;

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup audio analyzer for canvas visualization
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      drawWaveform();

      // Determine supported mime type
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      let chosenMime = 'audio/webm';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          chosenMime = m;
          break;
        }
      }
      setRecordedMimeType(chosenMime);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: chosenMime });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: chosenMime });
        const url = URL.createObjectURL(audioBlob);
        setRecordedBlobUrl(url);
        stopRecordingCleanup();
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);
      setRecordDuration(0);

      // Start timer
      const startTime = Date.now();
      timerIntervalRef.current = window.setInterval(() => {
        setRecordDuration((Date.now() - startTime) / 1000);
      }, 100);
    } catch (err) {
      console.error('Failed to access microphone:', err);
      alert('Microphone access could not be acquired. You can choose an audio file from your device files instead.');
      setActiveMode('upload');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
  };

  const stopRecordingCleanup = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  // Canvas visualizer rendering loop
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.9;

        // Gradient from cyan to amber
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(1, '#f59e0b');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };
    render();
  };

  // Handle file chooser input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setUploadedBlobUrl(url);
  };

  // Play preview audio
  const togglePlayAudio = (url: string) => {
    if (!previewAudioRef.current) {
      const audio = new Audio(url);
      previewAudioRef.current = audio;

      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration);
      };

      audio.ontimeupdate = () => {
        setAudioProgress(audio.currentTime);
      };

      audio.onended = () => {
        setIsPlayingAudio(false);
        setAudioProgress(0);
      };
    }

    if (isPlayingAudio) {
      previewAudioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      if (previewAudioRef.current.src !== url) {
        previewAudioRef.current.src = url;
      }
      previewAudioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch((e) => console.error(e));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setAudioProgress(time);
    if (previewAudioRef.current) {
      previewAudioRef.current.currentTime = time;
    }
  };

  const handlePlaySynthReference = () => {
    if (isSynthesizing) return;
    setIsSynthesizing(true);
    playConlangPronunciation(conlangRomanized, ipa, {
      onEnd: () => setIsSynthesizing(false),
    });
  };

  const handleSave = () => {
    const activeUrl = activeMode === 'record' ? recordedBlobUrl : uploadedBlobUrl;
    if (!activeUrl) return;

    const attachment: CustomAudioAttachment = {
      id: `audio-${Date.now()}`,
      wordOrPhrase: targetWordOrPhrase,
      source: activeMode === 'record' ? 'recorded' : 'file-upload',
      audioBlobUrl: activeUrl,
      fileName: uploadedFile?.name || `${conlangRomanized.replace(/[^a-z0-9']/gi, '_')}_recording.webm`,
      fileSize: uploadedFile?.size || 0,
      mimeType: activeMode === 'record' ? recordedMimeType : (uploadedFile?.type || 'audio/mpeg'),
      durationSeconds: audioDuration || recordDuration,
      recordedAt: new Date().toISOString(),
    };

    onSaveAudio(attachment);
    onClose();
  };

  const activeAudioUrl = activeMode === 'record' ? recordedBlobUrl : uploadedBlobUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>🎙️ Voice & Audio Recorder</span>
              <span aria-hidden="true">·</span>
              <span>Conlang Audio Attachment</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-0.5">
              {conlangRomanized}{' '}
              <span className="text-sm font-normal text-slate-400">({targetWordOrPhrase})</span>
            </h2>
            <div className="text-xs font-mono text-amber-300/90 mt-0.5">{ipa}</div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg text-lg leading-none"
            title="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Tab mode selection: Record with mic vs Choose from Files */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveMode('record')}
            className={`py-2 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              activeMode === 'record'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🎙️ Record in Audio App</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('upload')}
            className={`py-2 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              activeMode === 'upload'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📁 Choose from Files App</span>
          </button>
        </div>

        {/* Synthetic Pronunciation Prompt Reference */}
        <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
          <div className="text-xs">
            <span className="text-slate-400">Need pronunciation guide?</span>
            <span className="text-slate-300 ml-1.5 font-mono text-[11px]">{conlangRomanized}</span>
          </div>
          <button
            type="button"
            onClick={handlePlaySynthReference}
            disabled={isSynthesizing}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>🔊 {isSynthesizing ? 'Voicing...' : 'Hear Synthesizer'}</span>
          </button>
        </div>

        {/* Mode 1: Voice Recorder with Live Waveform */}
        {activeMode === 'record' && (
          <div className="space-y-4">
            <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-4 flex flex-col items-center justify-center min-h-[160px]">
              {/* Visualizer Canvas */}
              <canvas
                ref={canvasRef}
                width={400}
                height={90}
                className={`w-full h-24 rounded-lg ${isRecording ? 'opacity-100' : 'opacity-25'}`}
              />

              {/* Status & Timer */}
              <div className="mt-3 flex items-center gap-3">
                {isRecording ? (
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-semibold animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span>{isPaused ? 'PAUSED' : 'RECORDING'}</span>
                    <span className="text-white ml-2 text-sm">
                      {Math.floor(recordDuration / 60)}:
                      {Math.floor(recordDuration % 60).toString().padStart(2, '0')}.
                      {Math.floor((recordDuration * 10) % 10)}
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">
                    {recordedBlobUrl ? 'Recording complete · Click Play below to test' : 'Click "Start Recording" to speak'}
                  </div>
                )}
              </div>
            </div>

            {/* Recorder Controls */}
            <div className="flex items-center justify-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
                  <span>{recordedBlobUrl ? 'Record Again' : 'Start Recording'}</span>
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button
                      type="button"
                      onClick={resumeRecording}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
                    >
                      ▶ Resume
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={pauseRecording}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
                    >
                      ⏸ Pause
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    ⏹ Stop & Review
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Mode 2: File Chooser / Upload */}
        {activeMode === 'upload' && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.webm,.flac"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-cyan-500/60 bg-slate-950/60 p-8 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xl group-hover:scale-110 transition-transform mb-3">
                📁
              </div>
              <div className="text-sm font-semibold text-slate-200">
                Choose audio file from Files app
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Supports MP3, WAV, OGG, M4A, WEBM, FLAC
              </div>
              {uploadedFile && (
                <div className="mt-3 px-3 py-1.5 bg-cyan-950/40 border border-cyan-800/80 rounded-lg text-xs font-mono text-cyan-300">
                  Selected: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Playback Preview Bar (if audio is recorded or uploaded) */}
        {activeAudioUrl && (
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Recorded / Selected Audio Playback</span>
              <span className="text-cyan-400 font-mono text-[11px]">
                {Math.floor(audioProgress)}s / {Math.floor(audioDuration || recordDuration)}s
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => togglePlayAudio(activeAudioUrl)}
                className="w-9 h-9 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center font-bold text-xs transition-colors shrink-0 shadow-sm shadow-cyan-500/20 cursor-pointer"
              >
                {isPlayingAudio ? '⏸' : '▶'}
              </button>

              <input
                type="range"
                min="0"
                max={audioDuration || recordDuration || 1}
                step="0.1"
                value={audioProgress}
                onChange={handleSeek}
                className="w-full accent-cyan-400 h-1.5 rounded-lg bg-slate-800"
              />

              <a
                href={activeAudioUrl}
                download={`${conlangRomanized}_audio.webm`}
                className="text-xs text-slate-400 hover:text-slate-200 shrink-0 p-1"
                title="Download audio clip"
              >
                ⬇
              </a>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          {existingAudio && onDeleteAudio ? (
            <button
              type="button"
              onClick={() => {
                onDeleteAudio();
                onClose();
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              Remove Audio
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!activeAudioUrl}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save & Attach Audio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
