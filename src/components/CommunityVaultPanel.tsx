/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { LanguageConfig } from '../engine/types';
import {
  fetchPublishedLanguages,
  publishLanguageToCommunity,
  incrementLanguageCloneCount,
  toggleLanguageLike,
  PublishedLanguageRecord,
} from '../utils/firebaseService';

interface CommunityVaultPanelProps {
  currentConfig: LanguageConfig;
  onLoadLanguage: (config: LanguageConfig) => void;
  userEmail?: string;
}

export const CommunityVaultPanel: React.FC<CommunityVaultPanelProps> = ({
  currentConfig,
  onLoadLanguage,
  userEmail,
}) => {
  const [languages, setLanguages] = useState<PublishedLanguageRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  // Publishing form modal state
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [creatorName, setCreatorName] = useState<string>('Cartographer');
  const [summary, setSummary] = useState<string>(
    `${currentConfig.name} is a ${currentConfig.morphologyType.toLowerCase()} language with ${currentConfig.consonantInventory?.length || 0} consonants and ${currentConfig.vowelInventory?.length || 0} vowels.`
  );
  const [customTags, setCustomTags] = useState<string>('conlang, alien, script');
  const [publishing, setPublishing] = useState<boolean>(false);
  const [publishFeedback, setPublishFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  // Load community languages on mount
  const loadCommunityVault = async () => {
    setLoading(true);
    try {
      const records = await fetchPublishedLanguages();
      setLanguages(records);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunityVault();
  }, []);

  // Update default summary when currentConfig changes
  useEffect(() => {
    setSummary(
      `${currentConfig.name} is a ${currentConfig.morphologyType.toLowerCase()} language with ${currentConfig.consonantInventory?.length || 0} consonants and ${currentConfig.vowelInventory?.length || 0} vowels.`
    );
  }, [currentConfig]);

  // Handle publishing current language
  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    setPublishFeedback(null);

    const parsedTags = customTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const res = await publishLanguageToCommunity(
      currentConfig,
      creatorName,
      summary,
      userEmail,
      parsedTags
    );

    setPublishing(false);

    if (res.success) {
      setPublishFeedback({
        message: `🎉 Success! "${currentConfig.name}" is now live in the Community Vault for creators to explore and use!`,
        isError: false,
      });
      setTimeout(() => {
        setIsPublishModalOpen(false);
        setPublishFeedback(null);
        loadCommunityVault();
      }, 1500);
    } else {
      setPublishFeedback({
        message: `⚠️ Could not publish: ${res.error || 'Check network connection'}`,
        isError: true,
      });
    }
  };

  // Handle Clone / Use Language
  const handleUseLanguage = (item: PublishedLanguageRecord) => {
    incrementLanguageCloneCount(item.id);
    onLoadLanguage(item.config);
    setPublishFeedback({
      message: `📥 Loaded "${item.name}" by ${item.creator} into your active workspace!`,
      isError: false,
    });
    setTimeout(() => setPublishFeedback(null), 3000);
  };

  // Handle Like
  const handleLike = (langId: string) => {
    if (likedMap[langId]) return;
    toggleLanguageLike(langId);
    setLikedMap((prev) => ({ ...prev, [langId]: true }));
    setLanguages((prev) =>
      prev.map((item) =>
        item.id === langId ? { ...item, likesCount: (item.likesCount || 0) + 1 } : item
      )
    );
  };

  // Filtered languages
  const filteredLanguages = useMemo(() => {
    return languages.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchTag =
        selectedTag === 'all' ||
        (item.tags && item.tags.includes(selectedTag)) ||
        item.morphologyType.toLowerCase() === selectedTag.toLowerCase();

      return matchSearch && matchTag;
    });
  }, [languages, searchQuery, selectedTag]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-fadeIn">
      {/* Top Banner & Action */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
              <span>🌐</span> Public Language Exchange & Repository
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>🏛️ Community Language Vault</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Browse constructed languages created by conlangers worldwide, test their phonologies and Unicode scripts, or publish your own dialect to share with the universe!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-5 h-5 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>🚀 Post Current Language</span>
            </button>

            <button
              onClick={loadCommunityVault}
              className="px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
              title="Refresh repository"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Floating feedback alert */}
      {publishFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm animate-bounce ${
            publishFeedback.isError
              ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{publishFeedback.isError ? '⚠️' : '✅'}</span>
            <span className="font-medium">{publishFeedback.message}</span>
          </div>
          <button
            onClick={() => setPublishFeedback(null)}
            className="text-xs opacity-75 hover:opacity-100 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search conlangs by name, author, tag, phonology..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tag Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar py-1">
          {['all', 'agglutinative', 'fusional', 'isolating', 'alien', 'fantasy', 'script'].map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors cursor-pointer ${
                selectedTag === tag
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Language Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Scanning the galactic conlang frequencies...</p>
        </div>
      ) : filteredLanguages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-center p-8 space-y-4">
          <span className="text-5xl">🌌</span>
          <h3 className="text-lg font-bold text-slate-200">No Languages Found</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            Be the pioneer! Post your current language configuration so other creators across the globe can explore it.
          </p>
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
          >
            🚀 Post "{currentConfig.name}" Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLanguages.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col justify-between bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 transition-all duration-200 hover:shadow-xl hover:shadow-cyan-500/5"
            >
              <div className="space-y-3.5">
                {/* Header line */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>👤 {item.creator}</span>
                      <span className="text-slate-600">•</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                  <span className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-slate-800 text-indigo-300 border border-indigo-500/20">
                    {item.morphologyType}
                  </span>
                </div>

                {/* Description summary */}
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {item.summary}
                </p>

                {/* Badges / Specs */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span>🔤</span>
                    <span>Order: <strong className="text-slate-200">{item.wordOrder}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>🎵</span>
                    <span>Sounds: <strong className="text-slate-200">{item.consonantCount}C / {item.vowelCount}V</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>🎼</span>
                    <span>Syllables: <strong className="text-cyan-300">{item.config?.syllableConfig?.customSyllables?.length || 0} custom</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>🎨</span>
                    <span>Glyphs: <strong className="text-slate-200">{item.hasCustomGlyphs ? 'Custom Drawn' : 'Standard'}</strong></span>
                  </div>
                </div>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-[10px] bg-slate-800/80 text-slate-400 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action footer */}
              <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLike(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                      likedMap[item.id]
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60'
                    }`}
                    title="Like language"
                  >
                    <span>{likedMap[item.id] ? '❤️' : '🤍'}</span>
                    <span>{item.likesCount || 0}</span>
                  </button>

                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span>📥</span> {item.clonesCount || 0} uses
                  </span>
                </div>

                <button
                  onClick={() => handleUseLanguage(item)}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-bold text-xs border border-cyan-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-cyan-500/20"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Use This Language</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Language Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🚀</span> Post Language to Community
                </h3>
                <p className="text-xs text-slate-400">
                  Share <strong>{currentConfig.name}</strong> for creators worldwide to study, translate, and adapt!
                </p>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublishSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Creator / Conlanger Name
                </label>
                <input
                  type="text"
                  required
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="e.g. Master Linguist"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description & Linguistic Lore
                </label>
                <textarea
                  rows={3}
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Tell others about this language's phonotactics, fictional history, or unique rules..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={customTags}
                  onChange={(e) => setCustomTags(e.target.value)}
                  placeholder="e.g. agglutinative, alien, sci-fi, custom-script"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">📦 What gets posted:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>Phonology (Consonants, Vowels, Diacritics, Phonotactics)</li>
                  <li>🎼 <strong>Custom Syllables ({currentConfig.syllableConfig?.customSyllables?.length || 0} defined)</strong></li>
                  <li>Grammar & Morphological parameters ({currentConfig.morphologyType}, {currentConfig.wordOrder})</li>
                  <li>Unicode Script matrix & Custom-drawn PUA glyphs</li>
                  <li>Dictionary lexicon words & generated roots</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="px-5 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-cyan-400/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {publishing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Posting to Vault...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀 Publish Conlang</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
