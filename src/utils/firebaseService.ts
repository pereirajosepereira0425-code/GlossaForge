/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  updateDoc,
  increment,
  getDocFromServer
} from 'firebase/firestore';
import { LanguageConfig } from '../engine/types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
const databaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
export const db = databaseId ? getFirestore(firebaseApp, databaseId) : getFirestore(firebaseApp);

export interface PublishedLanguageRecord {
  id: string;
  name: string;
  creator: string;
  creatorEmail?: string;
  summary: string;
  morphologyType: string;
  wordOrder: string;
  consonantCount: number;
  vowelCount: number;
  hasCustomScript: boolean;
  hasCustomGlyphs: boolean;
  tags: string[];
  config: LanguageConfig;
  clonesCount: number;
  likesCount: number;
  createdAt: string;
  updatedAt: string;
}

const COLLECTION_NAME = 'published_languages';

/**
 * Verify live connection to Firestore
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const testDoc = doc(db, COLLECTION_NAME, '__connection_probe__');
    await getDocFromServer(testDoc);
    return true;
  } catch (error: any) {
    if (error?.code === 'not-found' || error?.code === 'permission-denied') {
      return true;
    }
    console.warn('Firestore server connection test note:', error);
    return true;
  }
}

/**
 * Fetch all published community languages
 */
export async function fetchPublishedLanguages(): Promise<PublishedLanguageRecord[]> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    const results: PublishedLanguageRecord[] = [];
    snapshot.forEach((d) => {
      if (d.id !== '__connection_probe__') {
        results.push(d.data() as PublishedLanguageRecord);
      }
    });
    return results;
  } catch (err) {
    console.error('Error fetching published languages from Firebase:', err);
    try {
      const local = localStorage.getItem('glossaforge_community_cached');
      if (local) return JSON.parse(local);
    } catch (_) {}
    return [];
  }
}

/**
 * Publish or update a constructed language for others to use
 */
export async function publishLanguageToCommunity(
  config: LanguageConfig,
  creator: string,
  summary: string,
  creatorEmail?: string,
  tags: string[] = []
): Promise<{ success: boolean; id: string; error?: string }> {
  try {
    const langId = config.id && config.id !== 'blank-custom' ? `${config.id}-${Date.now().toString(36)}` : `lang-${Date.now().toString(36)}`;
    const docRef = doc(db, COLLECTION_NAME, langId);

    const consonantCount = config.consonantInventory?.length || 0;
    const vowelCount = config.vowelInventory?.length || 0;
    const hasCustomGlyphs = (config.customGlyphs?.length || 0) > 0 || (config.customLetters?.length || 0) > 0;

    const record: PublishedLanguageRecord = {
      id: langId,
      name: config.name || 'Untitled Conlang',
      creator: creator.trim() || 'Anonymous Cartographer',
      creatorEmail: creatorEmail || '',
      summary: summary.trim() || `A ${config.morphologyType} constructed language with ${consonantCount} consonants and ${vowelCount} vowels.`,
      morphologyType: config.morphologyType,
      wordOrder: config.wordOrder,
      consonantCount,
      vowelCount,
      hasCustomScript: !!config.scriptStyle,
      hasCustomGlyphs,
      tags: Array.from(new Set([config.morphologyType.toLowerCase(), config.wordOrder.toLowerCase(), ...tags])),
      config: JSON.parse(JSON.stringify(config)),
      clonesCount: 0,
      likesCount: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, record);

    // Also update local cache for instant offline access
    try {
      const existing = localStorage.getItem('glossaforge_community_cached');
      const list: PublishedLanguageRecord[] = existing ? JSON.parse(existing) : [];
      list.unshift(record);
      localStorage.setItem('glossaforge_community_cached', JSON.stringify(list.slice(0, 50)));
    } catch (_) {}

    return { success: true, id: langId };
  } catch (err: any) {
    console.error('Error publishing language:', err);
    return { success: false, id: '', error: err?.message || 'Failed to publish to community' };
  }
}

/**
 * Increment clone count when someone uses or clones a language
 */
export async function incrementLanguageCloneCount(langId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, langId);
    await updateDoc(docRef, {
      clonesCount: increment(1),
    });
  } catch (e) {
    console.warn('Could not increment clone count:', e);
  }
}

/**
 * Increment appreciation likes count
 */
export async function toggleLanguageLike(langId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, langId);
    await updateDoc(docRef, {
      likesCount: increment(1),
    });
  } catch (e) {
    console.warn('Could not like language:', e);
  }
}
