/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { LanguageConfig } from '../engine/types';

export interface AutoSaveStatus {
  lastSavedAt: Date | null;
  secondsUntilNext: number;
  isSaving: boolean;
  saveCount: number;
}

const STORAGE_KEY = 'glossaforge_language_autosave';
const AUTOSAVE_INTERVAL_SEC = 15;

export function useAutoSave(
  config: LanguageConfig,
  onSaveCallback?: (config: LanguageConfig) => void
) {
  const [secondsUntilNext, setSecondsUntilNext] = useState<number>(AUTOSAVE_INTERVAL_SEC);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_meta`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.timestamp) return new Date(parsed.timestamp);
      }
    } catch (_) {}
    return null;
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveCount, setSaveCount] = useState<number>(0);

  // Keep latest config reference
  const configRef = useRef<LanguageConfig>(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Save function
  const executeSave = useCallback(() => {
    setIsSaving(true);
    try {
      const current = configRef.current;
      const payload = {
        config: current,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      localStorage.setItem(`${STORAGE_KEY}_meta`, JSON.stringify({ timestamp: payload.timestamp, id: current.id, name: current.name }));
      
      const now = new Date();
      setLastSavedAt(now);
      setSaveCount((prev) => prev + 1);

      if (onSaveCallback) {
        onSaveCallback(current);
      }
    } catch (err) {
      console.warn('AutoSave storage error:', err);
    } finally {
      setTimeout(() => {
        setIsSaving(false);
      }, 600);
      setSecondsUntilNext(AUTOSAVE_INTERVAL_SEC);
    }
  }, [onSaveCallback]);

  // Timer: 1-second tick to update countdown and trigger save at 0
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilNext((prev) => {
        if (prev <= 1) {
          executeSave();
          return AUTOSAVE_INTERVAL_SEC;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [executeSave]);

  return {
    lastSavedAt,
    secondsUntilNext,
    isSaving,
    saveCount,
    saveNow: executeSave,
  };
}

/**
 * Load previously auto-saved language if available
 */
export function getAutoSavedLanguage(): { config: LanguageConfig; timestamp: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}
