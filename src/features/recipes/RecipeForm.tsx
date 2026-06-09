import { ChevronDown, Plus, Save, Trash2, X } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { Money } from '../../components/Money';
import { NumberInput } from '../../components/NumberInput';
import { PanFields } from '../../components/PanFields';
import { calculateRecipeIngredientsCost } from '../../lib/calculations';
import { formatAmount, formatDecimal } from '../../lib/format';
import { createId } from '../../lib/id';
import { calculatePanScale, formatPanShape, inferPanFromText } from '../../lib/pans';
import type { Ingredient, PanShape, Recipe, RecipeCategory, RecipeIngredient, Unit } from '../../lib/types';
import { recipeCategories, units } from '../../lib/types';

type RecipeFormProps = {
  recipe?: Recipe;
  ingredients: Ingredient[];
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
};

type RecipeDraft = {
  name: string;
  category: RecipeCategory;
  description: string;
  formSize: string;
  pan: PanShape;
  servings: number;
  finalWeightGrams: number;
  preparationTimeMinutes: number;
  bakingTimeMinutes: number;
  decorationTimeMinutes: number;
  cleaningTimeMinutes: number;
  ingredients: RecipeIngredient[];
};

type RecipeErrors = Record<string, string>;

const categoryLabels: Record<RecipeCategory, string> = {
  ciasto: 'Ciasto',
  tort: 'Tort',
  babeczki: 'Babeczki',
  ciasteczka: 'Ciasteczka',
  inne: 'Inne'
};

export function RecipeForm({ recipe, ingredients, onSave, onCancel }: RecipeFormProps) {
  const initialPan: PanShape = recipe?.pan ?? inferPanFromText(recipe?.formSize) ?? { type: 'round', diameterCm: 24 };
  const [draft, setDraft] = useState<RecipeDraft>({
    name: recipe?.name ?? '',
    category: recipe?.category ?? 'ciasto',
    description: recipe?.description ?? '',
    formSize: recipe?.formSize ?? '',
    pan: initialPan,
    servings: recipe?.servings ?? 0,
    finalWeightGrams: recipe?.finalWeightGrams ?? 0,
    preparationTimeMinutes: recipe?.preparationTimeMinutes ?? 0,
    bakingTimeMinutes: recipe?.bakingTimeMinutes ?? 0,
    decorationTimeMinutes: recipe?.decorationTimeMinutes ?? 0,
    cleaningTimeMinutes: recipe?.cleaningTimeMinutes ?? 0,
    ingredients: recipe?.ingredients.map((item) => ({ ...item })) ?? []
  });
  const [targetPan, setTargetPan] = useState<PanShape>(initialPan);
  const [isBasePanEditorOpen, setIsBasePanEditorOpen] = useState(false);
  const [isPanCalculatorOpen, setIsPanCalculatorOpen] = useState(false);
  const [errors, setErrors] = useState<RecipeErrors>({});

  const ingredientCost = useMemo(
    () => calculateRecipeIngredientsCost(draft.ingredients, ingredients),
    [draft.ingredients, ingredients]
  );
  const costByIndex = useMemo(
    () => new Map(ingredientCost.lines.map((line) => [line.index, line])),
    [ingredientCost.lines]
  );
  const costErrorsByIndex = useMemo(
    () => new Map(ingredientCost.errors.map((error) => [error.index, error.message])),
    [ingredientCost.errors]
  );
  const panScale = useMemo(() => calculatePanScale(draft.pan, targetPan), [draft.pan, targetPan]);
  const ingredientNamesById = useMemo(
    () => new Map(ingredients.map((ingredient) => [ingredient.id, ingredient.name])),
    [ingredients]
  );

  function updateDraft<Value extends keyof RecipeDraft>(field: Value, value: RecipeDraft[Value]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  }

  function addIngredientRow() {
    const ingredient = ingredients[0];
    setDraft((current) => ({
      ...current,
      ingredients: [
        {
          ingredientId: ingredient?.id ?? '',
          amount: 0,
          unit: ingredient ? getRecipeUnitForIngredient(ingredient) : 'g'
        },
        ...current.ingredients
      ]
    }));
  }

  function updateIngredientRow(index: number, patch: Partial<RecipeIngredient>) {
    setDraft((current) => ({
      ...current,
      ingredients: current.ingredients.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    }));
  }

  function removeIngredientRow(index: number) {
    setDraft((current) => ({
      ...current,
      ingredients: current.ingredients.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function handleIngredientSelect(index: number, ingredientId: string) {
    const ingredient = ingredients.find((item) => item.id === ingredientId);
    updateIngredientRow(index, {
      ingredientId,
      unit: ingredient ? getRecipeUnitForIngredient(ingredient) : 'g'
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: RecipeErrors = {};

    if (!draft.name.trim()) {
      nextErrors.name = 'Przepis musi mieć nazwę.';
    }

    if (draft.ingredients.length === 0) {
      nextErrors.ingredients = 'Przepis musi mieć co najmniej jeden składnik.';
    }

    draft.ingredients.forEach((ingredient, index) => {
      if (!ingredient.ingredientId) {
        nextErrors[`ingredient-${index}`] = 'Wybierz składnik.';
      }

      if (ingredient.amount <= 0) {
        nextErrors[`amount-${index}`] = 'Ilość składnika musi być większa od 0.';
      }
    });

    ingredientCost.errors.forEach((error) => {
      nextErrors[`ingredient-${error.index}`] = error.message;
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const now = new Date().toISOString();
    const shouldApplyPanCalculator = isPanCalculatorOpen && !arePansEqual(draft.pan, targetPan);
    const savedPan = shouldApplyPanCalculator ? targetPan : draft.pan;
    const savedFormSize = shouldApplyPanCalculator ? formatPanShape(targetPan) : draft.formSize.trim();
    const savedServings = shouldApplyPanCalculator
      ? Math.max(1, Math.round(draft.servings * panScale))
      : draft.servings;
    const savedFinalWeightGrams = shouldApplyPanCalculator
      ? Math.max(1, Math.round(draft.finalWeightGrams * panScale))
      : draft.finalWeightGrams;
    const savedIngredients = draft.ingredients.map((item) => ({
      ...item,
      amount: shouldApplyPanCalculator ? Math.round(item.amount * panScale * 100) / 100 : item.amount
    }));

    onSave({
      id: recipe?.id ?? createId('recipe'),
      name: draft.name.trim(),
      category: draft.category,
      description: draft.description.trim(),
      formSize: savedFormSize,
      pan: savedPan,
      servings: savedServings > 0 ? savedServings : undefined,
      finalWeightGrams: savedFinalWeightGrams > 0 ? savedFinalWeightGrams : undefined,
      preparationTimeMinutes: draft.preparationTimeMinutes,
      bakingTimeMinutes: draft.bakingTimeMinutes,
      decorationTimeMinutes: draft.decorationTimeMinutes,
      cleaningTimeMinutes: draft.cleaningTimeMinutes,
      ingredients: savedIngredients,
      createdAt: recipe?.createdAt ?? now,
      updatedAt: now
    });
  }

  return (
    <form className="panel formGrid" onSubmit={handleSubmit}>
      <div className="formHeader">
        <div>
          <p className="eyebrow">{recipe ? 'Edycja' : 'Nowy przepis'}</p>
          <h2 id="recipe-form-title">{recipe ? recipe.name : 'Przepis'}</h2>
        </div>
        <button className="iconButton" type="button" title="Zamknij" onClick={onCancel}>
          <X size={19} />
        </button>
      </div>

      <div className="twoColumn">
        <label className="field">
          <span className="fieldLabel">Nazwa</span>
          <input
            value={draft.name}
            aria-invalid={Boolean(errors.name)}
            onChange={(event) => updateDraft('name', event.target.value)}
          />
          {errors.name ? <span className="fieldError">{errors.name}</span> : null}
        </label>

        <label className="field">
          <span className="fieldLabel">Kategoria</span>
          <select
            value={draft.category}
            onChange={(event) => updateDraft('category', event.target.value as RecipeCategory)}
          >
            {recipeCategories.map((category) => (
              <option key={category} value={category}>
                {categoryLabels[category]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span className="fieldLabel">Opis</span>
        <textarea
          value={draft.description}
          onChange={(event) => updateDraft('description', event.target.value)}
        />
      </label>

      <div className="threeColumn">
        <label className="field">
          <span className="fieldLabel">Forma</span>
          <input
            value={draft.formSize}
            placeholder="24 cm"
            onChange={(event) => updateDraft('formSize', event.target.value)}
          />
        </label>
        <NumberInput
          label="Porcje / sztuki"
          value={draft.servings}
          step="1"
          suffix="szt."
          onValueChange={(value) => updateDraft('servings', value)}
        />
        <NumberInput
          label="Masa końcowa"
          value={draft.finalWeightGrams}
          step="1"
          suffix="g"
          onValueChange={(value) => updateDraft('finalWeightGrams', value)}
        />
      </div>

      <div className="fourColumn">
        <NumberInput
          label="Przygotowanie"
          value={draft.preparationTimeMinutes}
          step="1"
          suffix="min"
          onValueChange={(value) => updateDraft('preparationTimeMinutes', value)}
        />
        <NumberInput
          label="Pieczenie"
          value={draft.bakingTimeMinutes}
          step="1"
          suffix="min"
          onValueChange={(value) => updateDraft('bakingTimeMinutes', value)}
        />
        <NumberInput
          label="Dekorowanie"
          value={draft.decorationTimeMinutes}
          step="1"
          suffix="min"
          onValueChange={(value) => updateDraft('decorationTimeMinutes', value)}
        />
        <NumberInput
          label="Sprzątanie"
          value={draft.cleaningTimeMinutes}
          step="1"
          suffix="min"
          onValueChange={(value) => updateDraft('cleaningTimeMinutes', value)}
        />
      </div>

      <section className="subSection panSection">
        <div className="subSectionHeader">
          <div>
            <h3>Foremka przepisu</h3>
            <p className="sectionHint">Bazowy rozmiar, z którego liczone są składniki w przepisie.</p>
          </div>
        </div>
        <div className="basePanSummary">
          <div className="calculatedLine">
            <span>Foremka bazowa</span>
            <strong>{formatPanShape(draft.pan)}</strong>
          </div>
          <button
            className="button buttonGhost compactButton"
            type="button"
            onClick={() => setIsBasePanEditorOpen((current) => !current)}
          >
            {isBasePanEditorOpen ? 'Ukryj edycję' : 'Edytuj foremkę bazową'}
          </button>
        </div>
        {isBasePanEditorOpen ? (
          <PanFields pan={draft.pan} onChange={(pan) => updateDraft('pan', pan)} />
        ) : null}
      </section>

      <section className="subSection panSection panCalculatorPanel">
        <button
          className="collapseHeader"
          type="button"
          aria-expanded={isPanCalculatorOpen}
          onClick={() => setIsPanCalculatorOpen((current) => !current)}
        >
          <div>
            <h3>Przelicz składniki na inną foremkę</h3>
            <p className="sectionHint">Podgląd nie zmienia przepisu, tylko pokazuje nowe ilości.</p>
          </div>
          <ChevronDown size={20} aria-hidden="true" />
        </button>
        {isPanCalculatorOpen ? (
          <div className="collapseBody">
            <PanFields pan={targetPan} onChange={setTargetPan} />
        <div className="calculatedLine">
          <span>Mnożnik składników</span>
          <strong>{formatDecimal(panScale, 2)}x</strong>
        </div>
        <div className="scaledIngredientList">
          {draft.ingredients.map((ingredient, index) => (
            <div className="scaledIngredientRow" key={`${ingredient.ingredientId}-${index}`}>
              <span>{ingredientNamesById.get(ingredient.ingredientId) ?? 'Składnik'}</span>
              <strong>
                {formatAmount(ingredient.amount, ingredient.unit)} →{' '}
                {formatAmount(Math.round(ingredient.amount * panScale * 100) / 100, ingredient.unit)}
              </strong>
            </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="subSection">
        <div className="subSectionHeader">
          <h3>Składniki przepisu</h3>
          <button
            className="button buttonSecondary"
            type="button"
            disabled={ingredients.length === 0}
            onClick={addIngredientRow}
          >
            <Plus size={18} />
            Dodaj pozycję
          </button>
        </div>

        {ingredients.length === 0 ? (
          <EmptyState title="Brak składników w bazie" />
        ) : draft.ingredients.length === 0 ? (
          <EmptyState title="Dodaj składniki przepisu" />
        ) : (
          <div className="recipeIngredientList">
            {draft.ingredients.map((recipeIngredient, index) => {
              const lineCost = costByIndex.get(index);
              const lineError = errors[`ingredient-${index}`] ?? errors[`amount-${index}`] ?? costErrorsByIndex.get(index);

              return (
                <div className="recipeIngredientRow" key={`${recipeIngredient.ingredientId}-${index}`}>
                  <label className="field">
                    <span className="fieldLabel">Składnik</span>
                    <select
                      value={recipeIngredient.ingredientId}
                      aria-invalid={Boolean(lineError)}
                      onChange={(event) => handleIngredientSelect(index, event.target.value)}
                    >
                      {ingredients.map((ingredient) => (
                        <option key={ingredient.id} value={ingredient.id}>
                          {ingredient.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <NumberInput
                    label="Ilość"
                    value={recipeIngredient.amount}
                    step="0.1"
                    error={errors[`amount-${index}`]}
                    onValueChange={(value) => updateIngredientRow(index, { amount: value })}
                  />

                  <label className="field">
                    <span className="fieldLabel">Jednostka</span>
                    <select
                      value={recipeIngredient.unit}
                      onChange={(event) =>
                        updateIngredientRow(index, { unit: event.target.value as Unit })
                      }
                    >
                      {units.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className={lineError ? 'lineCost hasError' : 'lineCost'}>
                    <span>Koszt</span>
                    <strong>{lineCost ? <Money value={lineCost.cost} /> : '—'}</strong>
                    {lineError ? <small>{lineError}</small> : null}
                  </div>

                  <button
                    className="iconButton danger rowDelete"
                    type="button"
                    title="Usuń pozycję"
                    onClick={() => removeIngredientRow(index)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {errors.ingredients ? <p className="fieldError">{errors.ingredients}</p> : null}

        <div className="calculatedLine">
          <span>Koszt składników przepisu</span>
          <strong>
            {ingredientCost.errors.length > 0 ? 'Wymaga poprawek' : <Money value={ingredientCost.total} />}
          </strong>
        </div>
      </section>

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

function getRecipeUnitForIngredient(ingredient: Ingredient): Unit {
  if (ingredient.unit === 'kg' || ingredient.unit === 'g') {
    return 'g';
  }

  if (ingredient.unit === 'l' || ingredient.unit === 'ml') {
    return 'ml';
  }

  return 'szt';
}

function arePansEqual(first: PanShape, second: PanShape) {
  if (first.type !== second.type) {
    return false;
  }

  if (first.type === 'round' && second.type === 'round') {
    return first.diameterCm === second.diameterCm;
  }

  return (
    first.type === 'rectangular' &&
    second.type === 'rectangular' &&
    first.widthCm === second.widthCm &&
    first.heightCm === second.heightCm
  );
}
