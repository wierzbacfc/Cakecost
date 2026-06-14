import type { AiSettings } from './types';

const AI_SETTINGS_KEY = 'kalkulator-wypiekow:ai-settings:v1';

export const defaultAiSettings: AiSettings = {
  geminiApiKey: '',
  geminiModel: 'gemini-3.5-flash'
};

export function loadAiSettings(): AiSettings {
  if (typeof localStorage === 'undefined') {
    return { ...defaultAiSettings };
  }

  const raw = localStorage.getItem(AI_SETTINGS_KEY);

  if (!raw) {
    return { ...defaultAiSettings };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AiSettings>;

    return normalizeAiSettings(parsed);
  } catch (error) {
    console.warn('Nie udalo sie odczytac ustawien AI.', error);
    return { ...defaultAiSettings };
  }
}

export function saveAiSettings(settings: AiSettings) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(normalizeAiSettings(settings)));
}

export function clearAiSettings() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(AI_SETTINGS_KEY);
  }
}

function normalizeAiSettings(value: Partial<AiSettings>): AiSettings {
  return {
    geminiApiKey: typeof value.geminiApiKey === 'string' ? value.geminiApiKey.trim() : '',
    geminiModel: typeof value.geminiModel === 'string' && value.geminiModel.trim()
      ? value.geminiModel.trim()
      : defaultAiSettings.geminiModel
  };
}
