/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * Universal clipboard reader with permission fallback.
 * Works seamlessly across modern desktop browsers, mobile viewports,
 * and sandboxed iframes.
 */
export async function readClipboardText(): Promise<string | null> {
  // 1. Try modern navigator.clipboard.readText()
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.readText === 'function'
  ) {
    try {
      const text = await navigator.clipboard.readText();
      if (text !== undefined && text !== null) {
        return text;
      }
    } catch (err) {
      console.warn('Modern clipboard.readText blocked or denied permissions:', err);
    }
  }

  // 2. Fallback for restricted iframe security policies
  if (typeof window !== 'undefined') {
    try {
      const fallback = window.prompt('📋 Paste your copied text here (Ctrl+V / Cmd+V):');
      if (fallback !== null) {
        return fallback;
      }
    } catch (e) {
      console.warn('Clipboard prompt fallback failed:', e);
    }
  }

  return null;
}

/**
 * Seamless paste event handler for controlled inputs and textareas.
 * Guarantees that any pasted text is inserted directly at the cursor
 * without character drop, truncation, or synthetic event loss.
 */
export function handleDirectPaste(
  e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  currentVal: string,
  onChange: (newVal: string) => void
) {
  const pasted = e.clipboardData?.getData('text');
  if (pasted === undefined || pasted === null) return;

  const target = e.currentTarget;
  const start = target.selectionStart ?? currentVal.length;
  const end = target.selectionEnd ?? currentVal.length;

  const nextVal = currentVal.slice(0, start) + pasted + currentVal.slice(end);
  e.preventDefault();
  onChange(nextVal);

  // Restore cursor position immediately after the pasted content
  setTimeout(() => {
    try {
      target.focus();
      target.setSelectionRange(start + pasted.length, start + pasted.length);
    } catch {
      // Ignore if unmounted
    }
  }, 0);
}
