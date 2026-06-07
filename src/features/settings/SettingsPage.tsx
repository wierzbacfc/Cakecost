import { Download, RotateCcw, Upload } from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { NumberInput } from '../../components/NumberInput';
import { exportAppData, importAppData } from '../../lib/storage';
import type { AppData, AppSettings, ProfitMode, RoundTo } from '../../lib/types';

type SettingsPageProps = {
  data: AppData;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onImportData: (data: AppData) => void;
  onClearAll: () => void;
};

export function SettingsPage({
  data,
  settings,
  onUpdateSettings,
  onImportData,
  onClearAll
}: SettingsPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

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

      <section className="panel formGrid">
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
            label="Energia pieczenia"
            value={settings.defaultEnergyBakingHourlyCost}
            suffix="zł/h"
            onValueChange={(value) => updateSettings('defaultEnergyBakingHourlyCost', value)}
          />
          <NumberInput
            label="Energia procesu"
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

      <section className="panel formGrid">
        <div className="formHeader">
          <div>
            <p className="eyebrow">Plik JSON</p>
            <h2>Dane aplikacji</h2>
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
        message="Składniki, przepisy, historia i ustawienia zostaną usunięte z tej przeglądarki."
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
