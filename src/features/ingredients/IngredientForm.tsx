import { Save, X } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { NumberInput } from '../../components/NumberInput';
import { calculateIngredientUnitPrice, roundCurrency } from '../../lib/calculations';
import { formatUnitPrice } from '../../lib/format';
import { createId } from '../../lib/id';
import type { Ingredient, Unit } from '../../lib/types';
import { units } from '../../lib/types';

type IngredientFormProps = {
  ingredient?: Ingredient;
  onSave: (ingredient: Ingredient) => void;
  onCancel: () => void;
};

type IngredientDraft = {
  name: string;
  packagePrice: number;
  packageAmount: number;
  unit: Unit;
  store: string;
  notes: string;
};

type IngredientErrors = Partial<Record<keyof IngredientDraft, string>>;

export function IngredientForm({ ingredient, onSave, onCancel }: IngredientFormProps) {
  const [draft, setDraft] = useState<IngredientDraft>({
    name: ingredient?.name ?? '',
    packagePrice: ingredient?.packagePrice ?? 0,
    packageAmount: ingredient?.packageAmount ?? 0,
    unit: ingredient?.unit ?? 'g',
    store: ingredient?.store ?? '',
    notes: ingredient?.notes ?? ''
  });
  const [errors, setErrors] = useState<IngredientErrors>({});

  const unitPrice = useMemo(() => {
    try {
      return calculateIngredientUnitPrice(
        draft.packagePrice,
        draft.packageAmount,
        draft.unit
      );
    } catch {
      return undefined;
    }
  }, [draft.packageAmount, draft.packagePrice, draft.unit]);

  function updateDraft<Value extends keyof IngredientDraft>(
    field: Value,
    value: IngredientDraft[Value]
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: IngredientErrors = {};

    if (!draft.name.trim()) {
      nextErrors.name = 'Nazwa składnika nie może być pusta.';
    }

    if (draft.packagePrice <= 0) {
      nextErrors.packagePrice = 'Cena opakowania musi być większa od 0.';
    }

    if (draft.packageAmount <= 0) {
      nextErrors.packageAmount = 'Ilość w opakowaniu musi być większa od 0.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || unitPrice === undefined) {
      return;
    }

    const packagePrice = roundCurrency(draft.packagePrice);
    const normalizedUnitPrice = calculateIngredientUnitPrice(
      packagePrice,
      draft.packageAmount,
      draft.unit
    );

    onSave({
      id: ingredient?.id ?? createId('ingredient'),
      name: draft.name.trim(),
      packagePrice,
      packageAmount: draft.packageAmount,
      unit: draft.unit,
      unitPrice: normalizedUnitPrice,
      store: draft.store.trim(),
      notes: draft.notes.trim(),
      updatedAt: new Date().toISOString()
    });
  }

  return (
    <form className="panel formGrid" onSubmit={handleSubmit}>
      <div className="formHeader">
        <div>
          <p className="eyebrow">{ingredient ? 'Edycja' : 'Nowy składnik'}</p>
          <h2>{ingredient ? ingredient.name : 'Składnik'}</h2>
        </div>
        <button className="iconButton" type="button" title="Zamknij" onClick={onCancel}>
          <X size={19} />
        </button>
      </div>

      <label className="field">
        <span className="fieldLabel">Nazwa</span>
        <input
          value={draft.name}
          aria-invalid={Boolean(errors.name)}
          onChange={(event) => updateDraft('name', event.target.value)}
        />
        {errors.name ? <span className="fieldError">{errors.name}</span> : null}
      </label>

      <div className="twoColumn">
        <NumberInput
          label="Cena opakowania"
          value={draft.packagePrice}
          suffix="zł"
          error={errors.packagePrice}
          onValueChange={(value) => updateDraft('packagePrice', value)}
        />
        <NumberInput
          label="Ilość w opakowaniu"
          value={draft.packageAmount}
          suffix={draft.unit}
          error={errors.packageAmount}
          onValueChange={(value) => updateDraft('packageAmount', value)}
        />
      </div>

      <label className="field">
        <span className="fieldLabel">Jednostka opakowania</span>
        <select value={draft.unit} onChange={(event) => updateDraft('unit', event.target.value as Unit)}>
          {units.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </label>

      <div className="calculatedLine">
        <span>Cena jednostkowa</span>
        <strong>{unitPrice === undefined ? '—' : formatUnitPrice(unitPrice, draft.unit)}</strong>
      </div>

      <label className="field">
        <span className="fieldLabel">Sklep</span>
        <input value={draft.store} onChange={(event) => updateDraft('store', event.target.value)} />
      </label>

      <label className="field">
        <span className="fieldLabel">Notatki</span>
        <textarea value={draft.notes} onChange={(event) => updateDraft('notes', event.target.value)} />
      </label>

      <div className="formActions">
        <button className="button buttonGhost" type="button" onClick={onCancel}>
          Anuluj
        </button>
        <button className="button buttonPrimary" type="submit">
          <Save size={19} />
          Zapisz
        </button>
      </div>
    </form>
  );
}
