import { Download, Eye, EyeOff, KeyRound, RotateCcw, Save, Trash2, Upload } from 'lucide-react';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { NumberInput } from '../../components/NumberInput';
import { exportAppData, importAppData } from '../../lib/storage';
import type { AiSettings, AppData, AppSettings, ProfitMode, RoundTo } from '../../lib/types';

type SettingsPageProps = {
  data: AppData;
  settings: AppSettings;
  aiSettings: AiSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onUpdateAiSettings: (settings: AiSettings) => void;
  onImportData: (data: AppData) => void;
  onClearAll: () => void;
};

export function SettingsPage({
  data,
  settings,
  aiSettings,
  onUpdateSettings,
  onUpdateAiSettings,
  onImportData,
  onClearAll
}: SettingsPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [apiKeyDraft, setApiKeyDraft] = useState(aiSettings.geminiApiKey);
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setApiKeyDraft(aiSettings.geminiApiKey);
  }, [aiSettings.geminiApiKey]);

  function updateSettings<Value extends keyof AppSettings>(
    field: Value,
    value: AppSettings[Value]
  ) {
    onUpdateSettings({ ...settings, [field]: value });
    setMessage('Ustawienia zapisane.');
    setError('');
  }

  function exportData() {
    const payload = JSON.stringify(exportAppData(data), null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kalkulator-wypiekow-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Dane wyeksportowane.');
    setError('');
  }

  function saveGeminiApiKey() {
    const nextApiKey = apiKeyDraft.trim();
    onUpdateAiSettings({
      ...aiSettings,
      geminiApiKey: nextApiKey
    });
    setMessage(nextApiKey ? 'Klucz API Gemini zapisany.' : 'Klucz API Gemini usunięty.');
    setError('');
  }

  function clearGeminiApiKey() {
    setApiKeyDraft('');
    onUpdateAiSettings({
      ...aiSettings,
      geminiApiKey: ''
    });
    setMessage('Klucz API Gemini usunięty.');
    setError('');
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const parsed = JSON.parse(await file.text());
      const nextData = importAppData(parsed);
      onImportData(nextData);
      setMessage('Dane zaimportowane.');
      setError('');
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Nie udało się zaimportować danych.');
      setMessage('');
    }
  }

  return (
    <div className="pageStack">
      <section className="pageHeader">
        <div>
          <p className="eyebrow">Domyślne wartości</p>
          <h1>Ustawienia</h1>
        </div>
      </section>

      <section className="panel formGrid settingsPanel settingsDefaults">
        <div className="fourColumn">
          <NumberInput
            label="Stawka godzinowa"
            value={settings.defaultHourlyRate}
            suffix="zł/h"
            onValueChange={(value) => updateSettings('defaultHourlyRate', value)}
          />
          <NumberInput
            label="Dodatkowe koszty (%)"
            value={settings.defaultSafetyMarginPercent}
            suffix="%"
            onValueChange={(value) => updateSettings('defaultSafetyMarginPercent', value)}
          />
          <NumberInput
            label="Koszt pieczenia"
            value={settings.defaultEnergyBakingHourlyCost}
            suffix="zł/h"
            onValueChange={(value) => updateSettings('defaultEnergyBakingHourlyCost', value)}
          />
          <NumberInput
            label="Pozostały koszt mediów"
            value={settings.defaultEnergyActivityHourlyCost}
            suffix="zł/h"
            onValueChange={(value) => updateSettings('defaultEnergyActivityHourlyCost', value)}
          />
          <NumberInput
            label="Koszt dowozu"
            value={settings.defaultDeliveryCost}
            suffix="zł"
            onValueChange={(value) => updateSettings('defaultDeliveryCost', value)}
          />
        </div>

        <div className="threeColumn">
          <label className="field">
            <span className="fieldLabel">Domyślny zysk</span>
            <select
              value={settings.defaultProfitMode}
              onChange={(event) =>
                updateSettings('defaultProfitMode', event.target.value as ProfitMode)
              }
            >
              <option value="fixed">Kwotowo</option>
              <option value="percent">Procentowo</option>
            </select>
          </label>
          <NumberInput
            label="Zysk procentowy"
            value={settings.defaultProfitPercent}
            suffix="%"
            onValueChange={(value) => updateSettings('defaultProfitPercent', value)}
          />
          <NumberInput
            label="Zysk kwotowy"
            value={settings.defaultProfitFixed}
            suffix="zł"
            onValueChange={(value) => updateSettings('defaultProfitFixed', value)}
          />
        </div>

        <label className="field">
          <span className="fieldLabel">Zaokrąglanie ceny</span>
          <select
            value={settings.defaultRoundTo}
            onChange={(event) => updateSettings('defaultRoundTo', Number(event.target.value) as RoundTo)}
          >
            <option value={1}>do 1 zł</option>
            <option value={5}>do 5 zł</option>
            <option value={10}>do 10 zł</option>
          </select>
        </label>
      </section>

      <section className="panel formGrid settingsPanel settingsAi">
        <div className="formHeader">
          <div>
            <p className="eyebrow">AI</p>
            <h2>Gemini</h2>
            <p className="sectionHint">
              Klucz jest zapisany tylko lokalnie w tej przeglądarce i nie trafia do eksportu danych.
            </p>
          </div>
        </div>

        <div className="aiSettingsBox">
          <label className="field">
            <span className="fieldLabel">Klucz API Gemini</span>
            <div className="secretInputRow">
              <input
                type={isApiKeyVisible ? 'text' : 'password'}
                value={apiKeyDraft}
                placeholder="AIza..."
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => setApiKeyDraft(event.target.value)}
              />
              <button
                className="iconButton"
                type="button"
                title={isApiKeyVisible ? 'Ukryj klucz' : 'Pokaż klucz'}
                onClick={() => setIsApiKeyVisible((current) => !current)}
              >
                {isApiKeyVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <div className="aiModelInfo">
            <KeyRound size={18} />
            <div>
              <span>Model</span>
              <strong>{aiSettings.geminiModel}</strong>
            </div>
          </div>
        </div>

        <div className="buttonRow">
          <button className="button buttonSecondary" type="button" onClick={saveGeminiApiKey}>
            <Save size={19} />
            Zapisz klucz
          </button>
          <button className="button buttonGhost" type="button" onClick={clearGeminiApiKey}>
            <Trash2 size={19} />
            Usuń klucz
          </button>
        </div>
      </section>

      <section className="panel formGrid settingsPanel settingsData">
        <div className="formHeader">
          <div>
            <p className="eyebrow">Plik JSON</p>
            <h2>Dane aplikacji</h2>
            <p className="sectionHint">
              Dane są zapisane w tej przeglądarce. Przed czyszczeniem telefonu lub aplikacji warto zrobić eksport.
            </p>
          </div>
        </div>
        <div className="buttonRow">
          <button className="button buttonSecondary" type="button" onClick={exportData}>
            <Download size={19} />
            Eksportuj
          </button>
          <button
            className="button buttonSecondary"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={19} />
            Importuj
          </button>
          <button
            className="button buttonDanger"
            type="button"
            onClick={() => setConfirmClear(true)}
          >
            <RotateCcw size={19} />
            Wyczyść dane
          </button>
        </div>
        <input
          ref={fileInputRef}
          className="visuallyHidden"
          type="file"
          accept="application/json,.json"
          onChange={importData}
        />
        {message ? <div className="warning warningGood">{message}</div> : null}
        {error ? <div className="warning warningDanger">{error}</div> : null}
      </section>

      <ConfirmDialog
        open={confirmClear}
        title="Wyczyścić wszystkie dane?"
        message="Składniki, przepisy, historia wycen, listy zakupów i ustawienia zostaną usunięte z tej przeglądarki."
        confirmLabel="Wyczyść"
        destructive
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          onClearAll();
          setConfirmClear(false);
          setMessage('Dane wyczyszczone.');
          setError('');
        }}
      />
    </div>
  );
}
