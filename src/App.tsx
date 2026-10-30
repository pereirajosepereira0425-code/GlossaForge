/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import { CustomAudioAttachment, LanguageConfig } from './engine/types';
import { PRESET_BLANK, PRESET_VALKYRISH } from './engine/presets';
import { generateLexicon } from './engine/lexicon';
import { Header } from './components/Header';
import { ParametersPanel } from './components/ParametersPanel';
import { PhonologyPanel } from './components/PhonologyPanel';
import { SyllableEditorPanel } from './components/SyllableEditorPanel';
import { MorphologyPanel } from './components/MorphologyPanel';
import { TranslatorPanel } from './components/TranslatorPanel';
import { ScriptStudioPanel } from './components/ScriptStudioPanel';
import { CustomCharacterCreator } from './components/CustomCharacterCreator';
import { DictionaryPanel } from './components/DictionaryPanel';
import { AudioVaultPanel } from './components/AudioVaultPanel';
import { DossierPanel } from './components/DossierPanel';
import { PresetsSlideDrawer } from './components/PresetsSlideDrawer';
import { CommunityVaultPanel } from './components/CommunityVaultPanel';
import { useAutoSave, getAutoSavedLanguage } from './utils/useAutoSave';
import { testFirestoreConnection } from './utils/firebaseService';

export default function App() {
  // Check for auto-saved progress on boot, otherwise default to PRESET_VALKYRISH
  const [activeConfig, setActiveConfig] = useState<LanguageConfig>(() => {
    const saved = getAutoSavedLanguage();
    if (saved?.config && saved.config.name) {
      return saved.config;
    }
    return PRESET_VALKYRISH;
  });

  const [activeTab, setActiveTab] = useState<string>('parameters');
  const [regenerateKey, setRegenerateKey] = useState<number>(0);
  const [audioLibrary, setAudioLibrary] = useState<Record<string, CustomAudioAttachment>>({});
  const [isPresetsSlideOpen, setIsPresetsSlideOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // 15-Second visual auto-save hook
  const autoSave = useAutoSave(activeConfig, () => {
    // Optional callback on save tick
  });

  // Verify Firestore connection on boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Generate lexicon deterministically based on config & regenerateKey
  const lexicon = useMemo(() => {
    // Inject seed tweak into config id if regenerated
    const derivedConfig = regenerateKey === 0
      ? activeConfig
      : { ...activeConfig, id: `${activeConfig.id}-v${regenerateKey}` };
    return generateLexicon(derivedConfig);
  }, [activeConfig, regenerateKey]);

  // Pick sample word from lexicon or custom override
  const sampleWordEntry = lexicon.find((w) => w.isCustomOverride) || lexicon[0] || {
    conlang: "rath'mor",
    syllables: ['rath', 'mor'],
  };

  const handleSelectPreset = (preset: LanguageConfig) => {
    setActiveConfig(preset);
    setRegenerateKey(0);
    setNotification(`Loaded preset: ${preset.name}`);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleCreateBlankPreset = () => {
    setActiveConfig(PRESET_BLANK);
    setRegenerateKey(0);
    setActiveTab('parameters');
    setNotification('Created new blank conlang canvas!');
    setTimeout(() => setNotification(null), 2500);
  };

  const handleRegenerate = () => {
    setRegenerateKey((prev) => prev + 1);
    setNotification('Regenerated lexicon roots & morphology variations!');
    setTimeout(() => setNotification(null), 2000);
  };

  const handleSaveAudio = (key: string, attachment: CustomAudioAttachment) => {
    setAudioLibrary((prev) => ({
      ...prev,
      [key]: attachment,
    }));
  };

  const handleDeleteAudio = (key: string) => {
    setAudioLibrary((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleLoadCommunityLanguage = (loadedConfig: LanguageConfig) => {
    setActiveConfig(loadedConfig);
    setRegenerateKey(0);
    setActiveTab('parameters');
    setNotification(`🚀 Successfully imported "${loadedConfig.name}" into workspace!`);
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Bar Header adhering strictly to Top Bar Contract with 15-second visual auto-save */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeConfig={activeConfig}
        onSelectPreset={handleSelectPreset}
        onRegenerate={handleRegenerate}
        onOpenPresetsSlide={() => setIsPresetsSlideOpen(true)}
        onCreateBlankPreset={handleCreateBlankPreset}
        autoSaveStatus={autoSave}
      />

      {/* Floating Global Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900/95 border border-cyan-500/50 text-cyan-200 text-xs font-semibold rounded-xl shadow-2xl shadow-cyan-500/20 animate-fadeIn">
          <span>✨</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Mobile Tab Navigation Bar */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs font-medium no-scrollbar">
        {[
          { id: 'parameters', label: 'Parameters' },
          { id: 'phonology', label: 'Phonology' },
          { id: 'syllables', label: '🎼 Syllables' },
          { id: 'character-maker', label: '🔣 Character Maker' },
          { id: 'morphology', label: 'Grammar' },
          { id: 'translator', label: 'Translator' },
          { id: 'script-studio', label: 'Unicode Script' },
          { id: 'lexicon', label: 'Dictionary' },
          { id: 'audio-studio', label: '🎙️ Audio Studio' },
          { id: 'dossier', label: 'Dossier' },
          { id: 'community-vault', label: '🌐 Community Vault' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 transition-colors ${
              activeTab === tab.id
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Workspace Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'parameters' && (
          <ParametersPanel
            config={activeConfig}
            onChangeConfig={setActiveConfig}
            sampleWord={sampleWordEntry.conlang}
            sampleSyllables={sampleWordEntry.syllables}
            onOpenPresetsSlide={() => setIsPresetsSlideOpen(true)}
            onCreateBlankPreset={handleCreateBlankPreset}
          />
        )}

        {activeTab === 'phonology' && (
          <PhonologyPanel
            config={activeConfig}
            onChangeConfig={setActiveConfig}
          />
        )}

        {activeTab === 'syllables' && (
          <SyllableEditorPanel
            config={activeConfig}
            onChangeConfig={setActiveConfig}
          />
        )}

        {activeTab === 'character-maker' && (
          <CustomCharacterCreator
            config={activeConfig}
            onChangeConfig={setActiveConfig}
          />
        )}

        {activeTab === 'morphology' && (
          <MorphologyPanel
            config={activeConfig}
            onChangeConfig={setActiveConfig}
          />
        )}

        {activeTab === 'translator' && (
          <TranslatorPanel
            config={activeConfig}
            lexicon={lexicon}
            audioLibrary={audioLibrary}
            onSaveAudio={handleSaveAudio}
            onDeleteAudio={handleDeleteAudio}
          />
        )}

        {activeTab === 'script-studio' && (
          <ScriptStudioPanel
            config={activeConfig}
            onChangeConfig={setActiveConfig}
          />
        )}

        {activeTab === 'lexicon' && (
          <DictionaryPanel
            config={activeConfig}
            lexicon={lexicon}
            audioLibrary={audioLibrary}
            onSaveAudio={handleSaveAudio}
            onDeleteAudio={handleDeleteAudio}
          />
        )}

        {activeTab === 'audio-studio' && (
          <AudioVaultPanel
            config={activeConfig}
            lexicon={lexicon}
            audioLibrary={audioLibrary}
            onSaveAudio={handleSaveAudio}
            onDeleteAudio={handleDeleteAudio}
          />
        )}

        {activeTab === 'dossier' && (
          <DossierPanel
            config={activeConfig}
            lexicon={lexicon}
          />
        )}

        {activeTab === 'community-vault' && (
          <CommunityVaultPanel
            currentConfig={activeConfig}
            onLoadLanguage={handleLoadCommunityLanguage}
            userEmail="pereirajosepereira0425@gmail.com"
          />
        )}
      </main>

      {/* Presets Slide-Out Drawer / Modal */}
      <PresetsSlideDrawer
        isOpen={isPresetsSlideOpen}
        onClose={() => setIsPresetsSlideOpen(false)}
        activeConfig={activeConfig}
        onSelectPreset={handleSelectPreset}
        onCreateBlankPreset={handleCreateBlankPreset}
      />

      {/* Quiet, clean editorial footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">GlossaForge</span>
            <span aria-hidden="true">·</span>
            <span>Mathematical & Structural Conlang Synthesis</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>💾 15s Auto-Save Active</span>
            <span aria-hidden="true">·</span>
            <span>🌐 Cloud Community Exchange</span>
            <span aria-hidden="true">·</span>
            <span>Unicode PUA Character Studio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
