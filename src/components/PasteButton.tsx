/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { readClipboardText } from '../utils/clipboard';

interface PasteButtonProps {
  onPasteText: (text: string) => void;
  label?: string;
  className?: string;
  variant?: 'compact' | 'standard' | 'inline';
  title?: string;
}

export const PasteButton: React.FC<PasteButtonProps> = ({
  onPasteText,
  label = 'Paste',
  className = '',
  variant = 'compact',
  title = 'Paste whatever you copied from your clipboard into this field',
}) => {
  const [hasPasted, setHasPasted] = useState(false);

  const handleClick = async () => {
    const text = await readClipboardText();
    if (text !== null && text.length > 0) {
      onPasteText(text);
      setHasPasted(true);
      setTimeout(() => setHasPasted(false), 2000);
    }
  };

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={title}
        className={`px-2 py-1 rounded text-xs font-mono transition-all flex items-center gap-1 cursor-pointer select-none ${
          hasPasted
            ? 'bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 shadow-sm shadow-emerald-500/20'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
        } ${className}`}
      >
        {hasPasted ? (
          <>
            <svg
              className="w-3.5 h-3.5 text-emerald-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-[11px] font-semibold text-emerald-300">Pasted!</span>
          </>
        ) : (
          <>
            <svg
              className="w-3.5 h-3.5 text-cyan-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <span className="text-[11px]">📋 {label}</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'standard') {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={title}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer select-none shadow-sm ${
          hasPasted
            ? 'bg-emerald-950 border border-emerald-400 text-emerald-200 shadow-emerald-500/20'
            : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 hover:text-cyan-200'
        } ${className}`}
      >
        {hasPasted ? (
          <>
            <svg
              className="w-4 h-4 text-emerald-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span>✓ Pasted Copied Text!</span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4 text-cyan-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span>📋 {label}</span>
          </>
        )}
      </button>
    );
  }

  // Default: compact
  return (
    <button
      type="button"
      onClick={handleClick}
      title={title}
      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all flex items-center gap-1 cursor-pointer select-none ${
        hasPasted
          ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
          : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80'
      } ${className}`}
    >
      {hasPasted ? (
        <>
          <svg
            className="w-3 h-3 text-emerald-400 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-[10px] text-emerald-300 font-semibold">Pasted!</span>
        </>
      ) : (
        <>
          <svg
            className="w-3 h-3 text-cyan-400 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span>📋 {label}</span>
        </>
      )}
    </button>
  );
};
