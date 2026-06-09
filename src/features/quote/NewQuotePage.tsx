import { Calculator, Clock, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { Money } from '../../components/Money';
import { NumberInput } from '../../components/NumberInput';
import { PanFields } from '../../components/PanFields';
import { calculateQuote, getActiveLaborMinutes } from '../../lib/calculations';
import { formatDecimal } from '../../lib/format';
import { createId } from '../../lib/id';
import { calculatePanScale, formatPanShape, scalePanShape } from '../../lib/pans';
import type {
  AppSettings,
  Ingredient,
  ProfitMode,
  QuoteHistoryItem,
  QuoteInput,
  Recipe,
  RoundTo
} from '../../lib/types';
import { QuoteResultCard } from './QuoteResultCard';

type NewQuotePageProps = {
  recipes: Recipe[];
  ingredients: Ingredient[];
  settings: AppSettings;
  onSaveHistory: (item: QuoteHistoryItem) => void;
  onOpenRecipes: () => void;
  editingHistoryItem?: QuoteHistoryItem | null;
};

export function NewQuotePage({
  recipes,
  ingredients,
  settings,
  onSaveHistory,
  onOpenRecipes,
  editingHistoryItem
}: NewQuotePageProps) {
  const firstRecipeId = recipes[0]?.id ?? '';
  const [input, setInput] = useState<QuoteInput>(() => createInitialInput(firstRecipeId, settings));
  const [quoteName, setQuoteName] = useState('');
  const [customerPrice, setCustomerPrice] = useState(0);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    if (!recipes.some((recipe) => recipe.id === input.recipeId)) {
      setInput((current) => ({ ...current, recipeId: firstRecipeId }));
    }
  }, [firstRecipeId, input.recipeId, recipes]);

  useEffect(() => {
    if (!editingHistoryItem) {
      return;
    }

    const recipe = recipes.find((item) => item.id === editingHistoryItem.recipeId);
    const savedInput: QuoteInput = { ...editingHistoryItem.input };
    const historyPanScale = editingHistoryItem.panScale ?? editingHistoryItem.result.panScale ?? 1;
    const savedTargetPan = editingHistoryItem.targetPan ?? savedInput.targetPan;
    const targetDiffersFromRecipe =
      Boolean(recipe?.pan && savedTargetPan) &&
      Math.abs(calculatePanScale(recipe?.pan, savedTargetPan) - 1) > 0.0001;
    const historyWasScaled =
      editingHistoryItem.panScaleEnabled === true ||
      savedInput.panScaleEnabled === true ||
      Math.abs(historyPanScale - 1) > 0.0001 ||
      targetDiffersFromRecipe;

    savedInput.panScaleEnabled = historyWasScaled;

    if (historyWasScaled) {
      savedInput.targetPan =
        savedTargetPan ??
        (recipe?.pan ? scalePanShape(recipe.pan, historyPanScale) : undefined);
    } else if (!savedInput.targetPan && recipe?.pan) {
      savedInput.targetPan = recipe.pan;
    }

    setInput(savedInput);
    setQuoteName(editingHistoryItem.quoteName);
    setCustomerPrice(0);
    setSavedMessage('');
  }, [editingHistoryItem, recipes]);

  const selectedRecipe = recipes.find((recipe) => recipe.id === input.recipeId);
  const selectedRecipeActiveMinutes = selectedRecipe ? getActiveLaborMinutes(selectedRecipe) : 0;
  const selectedRecipeTotalMinutes = selectedRecipe
    ? selectedRecipeActiveMinutes + selectedRecipe.bakingTimeMinutes
    : 0;

  useEffect(() => {
    if (editingHistoryItem || !selectedRecipe?.pan || input.targetPan) {
      return;
    }

    setInput((current) => ({ ...current, targetPan: selectedRecipe.pan }));
  }, [editingHistoryItem, input.targetPan, selectedRecipe]);

  const quoteState = useMemo(() => {
    if (!selectedRecipe) {
      return { result: undefined, error: '' };
    }

    try {
      return {
        result: calculateQuote(selectedRecipe, ingredients, input),
        error: ''
      };
    } catch (error) {
      return {
        result: undefined,
        error: error instanceof Error ? error.message : 'Nie udało się obliczyć wyceny.'
      };
    }
  }, [ingredients, input, selectedRecipe]);

  function updateInput<Value extends keyof QuoteInput>(field: Value, value: QuoteInput[Value]) {
    setInput((current) => ({ ...current, [field]: value }));
    setSavedMessage('');
  }

  function saveQuote() {
    if (!selectedRecipe || !quoteState.result) {
      return;
    }

    const savedInput: QuoteInput = {
      ...input,
      panScaleEnabled: input.panScaleEnabled === true,
      targetPan: input.panScaleEnabled ? input.targetPan ?? selectedRecipe.pan : input.targetPan
    };
    const savedTargetPan = savedInput.panScaleEnabled ? savedInput.targetPan : undefined;

    onSaveHistory({
      id: editingHistoryItem?.id ?? createId('quote'),
      recipeId: selectedRecipe.id,
      recipeName: selectedRecipe.name,
      quoteName: quoteName.trim() || selectedRecipe.name,
      date: editingHistoryItem?.date ?? new Date().toISOString(),
      panScaleEnabled: savedInput.panScaleEnabled,
      sourcePan: selectedRecipe.pan,
      targetPan: savedTargetPan,
      panScale: quoteState.result.panScale ?? 1,
      result: quoteState.result,
      input: savedInput
    });
    setSavedMessage(editingHistoryItem ? 'Zmiany w wycenie zapisane.' : 'Wycena zapisana w historii.');
  }

  if (recipes.length === 0) {
    return (
      <div className="pageStack">
        <section className="pageHeader">
          <div>
            <p className="eyebrow">Kalkulacja</p>
            <h1>Nowa wycena</h1>
          </div>
        </section>
        <EmptyState
          icon={<Calculator size={34} />}
          title="Brak przepisów"
          action={
            <button className="button buttonPrimary" type="button" onClick={onOpenRecipes}>
              Dodaj przepis
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="pageStack">
      <section className="pageHeader">
        <div>
          <p className="eyebrow">Kalkulacja</p>
          <h1>{editingHistoryItem ? 'Edycja wyceny' : 'Nowa wycena'}</h1>
        </div>
        <button
          className="button buttonPrimary"
          type="button"
          disabled={!quoteState.result}
          onClick={saveQuote}
        >
          <Save size={20} />
          {editingHistoryItem ? 'Zapisz zmiany' : 'Zapisz wycenę'}
        </button>
      </section>

      <div className="quoteLayout">
        <form className="panel formGrid quoteForm">
          <label className="field">
            <span className="fieldLabel">Nazwa wyceny</span>
            <input
              value={quoteName}
              placeholder={selectedRecipe ? `Np. ${selectedRecipe.name} dla Ani` : 'Np. tort dla Ani'}
              onChange={(event) => {
                setQuoteName(event.target.value);
                setSavedMessage('');
              }}
            />
          </label>

          <label className="field">
            <span className="fieldLabel">Przepis</span>
            <select
              value={input.recipeId}
              onChange={(event) => {
                const recipeId = event.target.value;
                const nextRecipe = recipes.find((recipe) => recipe.id === recipeId);
                setInput((current) => ({
                  ...current,
                  recipeId,
                  panScaleEnabled: false,
                  targetPan: nextRecipe?.pan
                }));
                setSavedMessage('');
              }}
            >
              {recipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.name}
                </option>
              ))}
            </select>
          </label>

          {selectedRecipe ? (
            <div className="recipeTimePanel" aria-label="Parametry czasowe przepisu">
              <div className="recipeTimeHeader">
                <Clock size={20} />
                <div>
                  <span>Parametry czasowe przepisu</span>
                  <strong>
                    {selectedRecipeActiveMinutes} min pracy / {selectedRecipeTotalMinutes} min łącznie
                  </strong>
                </div>
              </div>
              <div className="recipeTimeGrid">
                <TimeMetric label="Przygotowanie" value={selectedRecipe.preparationTimeMinutes} />
                <TimeMetric label="Pieczenie" value={selectedRecipe.bakingTimeMinutes} />
                <TimeMetric label="Dekoracja" value={selectedRecipe.decorationTimeMinutes} />
                <TimeMetric label="Sprzątanie" value={selectedRecipe.cleaningTimeMinutes} />
              </div>
            </div>
          ) : null}

          {selectedRecipe ? (
            <section className="quoteSection panQuoteSection" aria-label="Foremka i przelicznik">
              <div className="quoteSectionHeader">
                <span>Foremka</span>
                <small>Przelicz składniki, koszt składników, porcje i masę na inną formę.</small>
              </div>

              <div className="calculatedLine">
                <span>Foremka z przepisu</span>
                <strong>{formatPanShape(selectedRecipe.pan)}</strong>
              </div>

              {selectedRecipe.pan ? (
                <>
                  <div className="segmentedControl" aria-label="Przeliczanie foremki">
                    <button
                      className={!input.panScaleEnabled ? 'active' : ''}
                      type="button"
                      onClick={() => {
                        setInput((current) => ({
                          ...current,
                          panScaleEnabled: false,
                          targetPan: selectedRecipe.pan
                        }));
                        setSavedMessage('');
                      }}
                    >
                      Bez zmian
                    </button>
                    <button
                      className={input.panScaleEnabled ? 'active' : ''}
                      type="button"
                      onClick={() => {
                        setInput((current) => ({
                          ...current,
                          panScaleEnabled: true,
                          targetPan: current.targetPan ?? selectedRecipe.pan
                        }));
                        setSavedMessage('');
                      }}
                    >
                      Przelicz
                    </button>
                  </div>

                  {input.panScaleEnabled ? (
                    <>
                      <PanFields
                        pan={input.targetPan ?? selectedRecipe.pan}
                        onChange={(targetPan) => updateInput('targetPan', targetPan)}
                      />
                      <div className="calculatedLine">
                        <span>Mnożnik składników</span>
                        <strong>{formatDecimal(quoteState.result?.panScale ?? 1, 2)}x</strong>
                      </div>
                      <div className="warning warningSoft">
                        Czasy pracy, pieczenia i sprzątania zostają z przepisu. Przy innej foremce
                        czas pieczenia może wymagać ręcznej oceny.
                      </div>
                    </>
                  ) : null}
                </>
              ) : (
                <div className="warning warningSoft">
                  Ten przepis nie ma zapisanej bazowej foremki. Uzupełnij ją w edycji przepisu.
                </div>
              )}
            </section>
          ) : null}

          <section className="quoteSection quoteSectionCost" aria-label="Parametry kosztowe">
            <div className="quoteSectionHeader">
              <span>Parametry kosztowe</span>
              <small>Wydatki potrzebne do wykonania wypieku</small>
            </div>

            <div className="twoColumn">
              <NumberInput
                label="Opakowanie"
                value={input.packagingCost}
                suffix="zł"
                onValueChange={(value) => updateInput('packagingCost', value)}
              />
              <NumberInput
                label="Dodatki"
                value={input.extrasCost}
                suffix="zł"
                onValueChange={(value) => updateInput('extrasCost', value)}
              />
            </div>

            <div className="calculatedLine">
              <span>Energia wyliczona automatycznie</span>
              <strong>
                <Money value={quoteState.result?.energyCost ?? 0} />
              </strong>
            </div>

            <label className="field">
              <span className="fieldLabel">Dowóz</span>
              <div className="segmentedControl" aria-label="Dowóz">
                <button
                  className={!input.includeDelivery ? 'active' : ''}
                  type="button"
                  onClick={() => updateInput('includeDelivery', false)}
                >
                  Bez dowozu
                </button>
                <button
                  className={input.includeDelivery ? 'active' : ''}
                  type="button"
                  onClick={() => updateInput('includeDelivery', true)}
                >
                  Z dowozem (+{input.deliveryCost} zł)
                </button>
              </div>
            </label>

            <div className="twoColumn">
              <NumberInput
                label="Dodatkowe koszty (%)"
                value={input.safetyMarginPercent}
                suffix="%"
                onValueChange={(value) => updateInput('safetyMarginPercent', value)}
              />
              <label className="field">
                <span className="fieldLabel">Zaokrąglanie</span>
                <select
                  value={input.roundTo}
                  onChange={(event) => updateInput('roundTo', Number(event.target.value) as RoundTo)}
                >
                  <option value={1}>do 1 zł</option>
                  <option value={5}>do 5 zł</option>
                  <option value={10}>do 10 zł</option>
                </select>
              </label>
            </div>
          </section>

          <section className="quoteSection quoteSectionEarning" aria-label="Parametry zarobkowe">
            <div className="quoteSectionHeader">
              <span>Parametry zarobkowe</span>
              <small>Stawka pracy i zysk doliczany do ceny</small>
            </div>

            <NumberInput
              label="Stawka godzinowa"
              value={input.hourlyRate}
              suffix="zł/h"
              onValueChange={(value) => updateInput('hourlyRate', value)}
            />

            <div className="segmentedControl" aria-label="Tryb zysku">
              <button
                className={input.profitMode === 'fixed' ? 'active' : ''}
                type="button"
                onClick={() => updateInput('profitMode', 'fixed' as ProfitMode)}
              >
                Kwotowo
              </button>
              <button
                className={input.profitMode === 'percent' ? 'active' : ''}
                type="button"
                onClick={() => updateInput('profitMode', 'percent' as ProfitMode)}
              >
                Procentowo
              </button>
            </div>

            {input.profitMode === 'fixed' ? (
              <NumberInput
                label="Zysk kwotowy"
                value={input.profitFixed ?? 0}
                suffix="zł"
                onValueChange={(value) => updateInput('profitFixed', value)}
              />
            ) : (
              <NumberInput
                label="Zysk procentowy"
                value={input.profitPercent ?? 0}
                suffix="%"
                onValueChange={(value) => updateInput('profitPercent', value)}
              />
            )}

            <NumberInput
              label="Cena klienta / własna cena sprzedaży"
              value={customerPrice}
              suffix="zł"
              onValueChange={setCustomerPrice}
            />
          </section>

          {quoteState.error ? <div className="warning warningDanger">{quoteState.error}</div> : null}
          {savedMessage ? <div className="warning warningGood">{savedMessage}</div> : null}
        </form>

        {selectedRecipe && quoteState.result ? (
          <QuoteResultCard
            recipe={selectedRecipe}
            input={input}
            result={quoteState.result}
            customerPrice={customerPrice}
          />
        ) : null}
      </div>
    </div>
  );
}

function TimeMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="recipeTimeMetric">
      <span>{label}</span>
      <strong>{value} min</strong>
    </div>
  );
}

function createInitialInput(recipeId: string, settings: AppSettings): QuoteInput {
  return {
    recipeId,
    packagingCost: 0,
    extrasCost: 0,
    energyBakingHourlyCost: settings.defaultEnergyBakingHourlyCost,
    energyActivityHourlyCost: settings.defaultEnergyActivityHourlyCost,
    deliveryCost: settings.defaultDeliveryCost,
    includeDelivery: false,
    panScaleEnabled: false,
    hourlyRate: settings.defaultHourlyRate,
    safetyMarginPercent: settings.defaultSafetyMarginPercent,
    profitMode: settings.defaultProfitMode,
    profitPercent: settings.defaultProfitPercent,
    profitFixed: settings.defaultProfitFixed,
    roundTo: settings.defaultRoundTo
  };
}
