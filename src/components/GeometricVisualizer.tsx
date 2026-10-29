/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GeometricMorphology, LinearVector } from '../engine/types';

interface GeometricVisualizerProps {
  sampleWord: string;
  syllables: string[];
  geometricMorphology: GeometricMorphology;
  linearVector: LinearVector;
}

export const GeometricVisualizer: React.FC<GeometricVisualizerProps> = ({
  sampleWord,
  syllables,
  geometricMorphology,
  linearVector,
}) => {
  // Break syllables into phoneme matrix cells
  const matrixRows: { label: string; cells: { char: string; isVowel: boolean; isGlottal: boolean; active: boolean }[] }[] = [];

  syllables.forEach((syl, rIdx) => {
    const chars = syl.split('');
    const cells = chars.map((ch, cIdx) => {
      const isVowel = /[aeiouyäöüě]/i.test(ch);
      const isGlottal = ch === "'";
      const isDiagonalActive = geometricMorphology === 'diagonal-matrix' && (
        (rIdx % 2 === 0 && isVowel) || (rIdx % 2 === 1 && !isVowel && !isGlottal)
      );
      return {
        char: ch,
        isVowel,
        isGlottal,
        active: isDiagonalActive,
      };
    });
    matrixRows.push({
      label: `σ${rIdx + 1}`,
      cells,
    });
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs font-mono">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div>
          <span className="text-slate-400 font-sans font-medium text-xs">Morphological Grid Mapping:</span>{' '}
          <span className="text-cyan-400 font-semibold">{sampleWord || 'rath’mor'}</span>
        </div>
        <div className="text-slate-400 text-[11px] font-sans">
          Mode: <span className="text-slate-200">{geometricMorphology}</span> · Vector:{' '}
          <span className="text-slate-200">{linearVector}</span>
        </div>
      </div>

      {/* Grid rendering */}
      <div className="space-y-2">
        {matrixRows.map((row, rIdx) => (
          <div key={rIdx} className="flex items-center gap-2">
            <span className="w-8 text-slate-400 text-right pr-2 border-r border-slate-800">{row.label}</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {row.cells.map((cell, cIdx) => (
                <div
                  key={cIdx}
                  className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm transition-all ${
                    cell.isGlottal
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : cell.isVowel
                      ? cell.active
                        ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 shadow-sm shadow-cyan-500/20'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : cell.active
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                  title={`${cell.isVowel ? 'Vowel' : cell.isGlottal ? 'Glottal Stop' : 'Consonant'} [${cell.char}]`}
                >
                  {cell.char}
                </div>
              ))}
            </div>
            {geometricMorphology === 'diagonal-matrix' && (
              <span className="text-[10px] text-cyan-400/80 pl-2">
                {rIdx % 2 === 0 ? '↘ step: V-diag' : '↗ step: C-diag'}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-indigo-500/30 border border-indigo-500/50 inline-block"></span>
          <span>Vowel Nucleus</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700 inline-block"></span>
          <span>Consonant Flank</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50 inline-block"></span>
          <span>Glottal Stop (ʔ)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-cyan-500/30 border border-cyan-400 inline-block"></span>
          <span>Matrix Axis Active</span>
        </div>
      </div>
    </div>
  );
};
