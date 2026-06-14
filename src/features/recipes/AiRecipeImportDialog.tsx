import { AlertTriangle, FileText, Link, Settings, Sparkles, Wand2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { formatAmount } from '../../lib/format';
import {
  type AiRecipeSource,
  type GeminiRecipeImportResult,
  createRecipeDraftFromGemini,
  importRecipeWithGemini
} from '../../lib/geminiRecipeImport';
import type { AiSettings, Ingredient, Recipe } from '../../lib/types';

type AiRecipeImportDialogProps = {
  open: boolean;
  aiSettings: AiSettings;
  ingredients: Ingredient[];
  onImported: (recipe: Recipe) => void;
  onCancel: () => void;
  onOpenIngredients: () => void;
  onOpenSettings: () => void;
};

type SourceType = AiRecipeSource['type'];

export function AiRecipeImportDialog({
  open,
  aiSettings,
  ingredients,
  onImported,
  onCancel,
  onOpenIngredients,
  onOpenSettings
}: AiRecipeImportDialogProps) {
  const [sourceType, setSourceType] = useState<SourceType>('url');
  const [sourceValue, setSourceValue] = useState('');
  const [sourceForResult, setSourceForResult] = useState<AiRecipeSource | null>(null);
  const [result, setResult] = useState<GeminiRecipeImportResult | null>(null);
  const [ingredientMappings, setIngredientMappings] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const sortedIngredients = useMemo(
    () => [...ingredients].sort((a, b) => a.name.localeCompare(b.name, 'pl')),
    [ingredients]
  );
  const hasApiKey = Boolean(aiSettings.geminiApiKey.trim());
  const unresolvedIngredientCount = result
    ? result.recipe.ingredients.filter((_, index) => !ingredientMappings[index]).length
    : 0;
  const warnings = result ? [...result.retrievalWarnings, ...result.recipe.warnings] : [];

  useEffect(() => {
    if (!open) {
      setSourceValue('');
      setSourceForResult(null);
      setResult(null);
      setIngredientMappings({});
      setIsLoading(false);
      setError('');
    }
  }, [open]);

  if (!open) {
    return null;
  }

  async function handleImport() {
    setError('');

    if (!hasApiKey) {
      setError('Dodaj klucz API Gemini w ustawieniach.');
      return;
    }

    if (ingredients.length === 0) {
      setError('Najpierw dodaj skladniki w bazie, zeby importer mogl je zmapowac.');
      return;
    }

    const source: AiRecipeSource = {
      type: sourceType,
      value: sourceValue.trim()
    };

    setIsLoading(true);

    try {
      const nextResult = await importRecipeWithGemini({
        apiKey: aiSettings.geminiApiKey,
        model: aiSettings.geminiModel,
        source,
        ingredients
      });
      setResult(nextResult);
      setSourceForResult(source);
      setIngredientMappings(
        Object.fromEntries(
          nextResult.recipe.ingredients.map((ingredient, index) => [
            index,
            ingredient.suggestedIngredientId
          ])
        )
      );
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Nie udalo sie rozpoznac przepisu.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCreateDraft() {
    if (!result || unresolvedIngredientCount > 0) {
      return;
    }

    onImported(
      createRecipeDraftFromGemini(
        result.recipe,
        ingredientMappings,
        sourceForResult ?? { type: sourceType, value: sourceValue.trim() }
      )
    );
  }

  function openSettings() {
    onCancel();
    onOpenSettings();
  }

  function openIngredients() {
    onCancel();
    onOpenIngredients();
  }

  return (
    <div className="dialogBackdrop" role="presentation">
      <div className="dialog aiImportDialog" role="dialog" aria-modal="true" aria-labelledby="ai-import-title">
        <div className="formHeader">
          <div>
            <p className="eyebrow">Gemini</p>
            <h2 id="ai-import-title">Dodaj przepis z AI</h2>
          </div>
          <button className="iconButton" type="button" title="Zamknij" onClick={onCancel}>
            <X size={19} />
          </button>
        </div>

        {!hasApiKey ? (
          <div className="warning warningSoft">
            <AlertTriangle size={19} />
            <div>
              <strong>Brak klucza API Gemini.</strong>
              <span>Klucz dodasz w ustawieniach AI.</span>
            </div>
            <button className="button buttonSecondary compactButton" type="button" onClick={openSettings}>
              <Settings size={18} />
              Ustaw klucz
            </button>
          </div>
        ) : null}

        {ingredients.length === 0 ? (
          <div className="warning warningDanger">
            <AlertTriangle size={19} />
            <div>
              <strong>Brak skladnikow w bazie.</strong>
              <span>Importer musi dopasowac skladniki AI do Twojej bazy cen.</span>
            </div>
            <button className="button buttonSecondary compactButton" type="button" onClick={openIngredients}>
              Dodaj skladniki
            </button>
          </div>
        ) : null}

        <section className="aiImportSource">
          <div className="segmentedControl aiImportMode">
            <button
              className={sourceType === 'url' ? 'active' : ''}
              type="button"
              onClick={() => setSourceType('url')}
            >
              <Link size={17} />
              Link
            </button>
            <button
              className={sourceType === 'text' ? 'active' : ''}
              type="button"
              onClick={() => setSourceType('text')}
            >
              <FileText size={17} />
              Tekst
            </button>
          </div>

          {sourceType === 'url' ? (
            <label className="field">
              <span className="fieldLabel">Link do przepisu</span>
              <input
                type="url"
                value={sourceValue}
                placeholder="https://..."
                onChange={(event) => setSourceValue(event.target.value)}
              />
            </label>
          ) : (
            <label className="field">
              <span className="fieldLabel">Treść przepisu</span>
              <textarea
                value={sourceValue}
                placeholder="Wklej skladniki, opis i czasy z przepisu"
                onChange={(event) => setSourceValue(event.target.value)}
              />
            </label>
          )}

          <div className="formActions">
            <button
              className="button buttonPrimary"
              type="button"
              disabled={isLoading || !hasApiKey || ingredients.length === 0}
              onClick={handleImport}
            >
              {isLoading ? <Wand2 size={19} /> : <Sparkles size={19} />}
              {isLoading ? 'Rozpoznaję...' : 'Rozpoznaj przepis'}
            </button>
          </div>
        </section>

        {error ? <div className="warning warningDanger">{error}</div> : null}

        {result ? (
          <section className="aiReview">
            <div className="aiReviewSummary">
              <div>
                <span>Nazwa</span>
                <strong>{result.recipe.name}</strong>
              </div>
              <div>
                <span>Kategoria</span>
                <strong>{result.recipe.category}</strong>
              </div>
              <div>
                <span>Składniki</span>
                <strong>{result.recipe.ingredients.length}</strong>
              </div>
              <div>
                <span>Pieczenie</span>
                <strong>{result.recipe.bakingTimeMinutes} min</strong>
              </div>
            </div>

            {warnings.length > 0 ? (
              <div className="warning warningSoft">
                <AlertTriangle size={19} />
                <div>
                  {warnings.map((warning) => (
                    <span key={warning}>{warning}</span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="subSectionHeader">
              <div>
                <h3>Mapowanie składników</h3>
                <p className="sectionHint">Sprawdź, czy AI dobrze połączyło składniki z bazą cen.</p>
              </div>
            </div>

            <div className="aiIngredientReview">
              {result.recipe.ingredients.map((ingredient, index) => (
                <div className="aiIngredientReviewRow" key={`${ingredient.name}-${index}`}>
                  <div className="aiIngredientName">
                    <strong>{ingredient.name || 'Składnik'}</strong>
                    <span>
                      {ingredient.originalAmountText || formatAmount(ingredient.amount, ingredient.unit)}
                      {ingredient.confidence !== 'high' ? ` · pewność: ${ingredient.confidence}` : ''}
                    </span>
                  </div>
                  <label className="field">
                    <span className="fieldLabel">Składnik w bazie</span>
                    <select
                      value={ingredientMappings[index] ?? ''}
                      onChange={(event) =>
                        setIngredientMappings((current) => ({
                          ...current,
                          [index]: event.target.value
                        }))
                      }
                    >
                      <option value="">Wybierz składnik</option>
                      {sortedIngredients.map((catalogIngredient) => (
                        <option key={catalogIngredient.id} value={catalogIngredient.id}>
                          {catalogIngredient.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}
            </div>

            {unresolvedIngredientCount > 0 ? (
              <div className="warning warningSoft">
                Wybierz składnik z bazy dla {unresolvedIngredientCount} pozycji przed utworzeniem szkicu.
              </div>
            ) : null}

            <div className="formActions">
              <button className="button buttonGhost" type="button" onClick={() => setResult(null)}>
                Cofnij
              </button>
              <button
                className="button buttonPrimary"
                type="button"
                disabled={unresolvedIngredientCount > 0}
                onClick={handleCreateDraft}
              >
                <Wand2 size={19} />
                Utwórz szkic
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
