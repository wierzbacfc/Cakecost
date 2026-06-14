import { BookOpen, Copy, Edit3, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { Money } from '../../components/Money';
import { calculateRecipeIngredientsCost, getActiveLaborMinutes } from '../../lib/calculations';
import { createId } from '../../lib/id';
import { formatPanShape } from '../../lib/pans';
import type { AiSettings, Ingredient, Recipe } from '../../lib/types';
import { AiRecipeImportDialog } from './AiRecipeImportDialog';
import { RecipeForm } from './RecipeForm';

type RecipesPageProps = {
  recipes: Recipe[];
  ingredients: Ingredient[];
  aiSettings: AiSettings;
  onSave: (recipe: Recipe) => void;
  onDelete: (recipeId: string) => void;
  onOpenIngredients: () => void;
  onOpenSettings: () => void;
};

export function RecipesPage({
  recipes,
  ingredients,
  aiSettings,
  onSave,
  onDelete,
  onOpenIngredients,
  onOpenSettings
}: RecipesPageProps) {
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [aiDraftRecipe, setAiDraftRecipe] = useState<Recipe | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAiImportOpen, setIsAiImportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const sortedRecipes = useMemo(
    () => [...recipes].sort((a, b) => a.name.localeCompare(b.name, 'pl')),
    [recipes]
  );

  function closeForm() {
    setEditingRecipe(null);
    setAiDraftRecipe(null);
    setIsAdding(false);
  }

  function handleSave(recipe: Recipe) {
    onSave(recipe);
    closeForm();
  }

  function openAddForm() {
    setEditingRecipe(null);
    setAiDraftRecipe(null);
    setIsAdding(true);
  }

  function openEditForm(recipe: Recipe) {
    setIsAdding(false);
    setAiDraftRecipe(null);
    setEditingRecipe(recipe);
  }

  function handleAiImported(recipe: Recipe) {
    setIsAiImportOpen(false);
    setEditingRecipe(null);
    setIsAdding(false);
    setAiDraftRecipe(recipe);
  }

  function duplicateRecipe(recipe: Recipe) {
    const now = new Date().toISOString();
    onSave({
      ...recipe,
      id: createId('recipe'),
      name: `${recipe.name} - kopia`,
      ingredients: recipe.ingredients.map((ingredient) => ({ ...ingredient })),
      createdAt: now,
      updatedAt: now
    });
  }

  useEffect(() => {
    if (!isAdding && !editingRecipe && !aiDraftRecipe) {
      return;
    }

    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstField = formRef.current?.querySelector<HTMLInputElement | HTMLSelectElement>(
        'input, select, textarea'
      );
      firstField?.focus({ preventScroll: true });
    });
  }, [aiDraftRecipe, editingRecipe, isAdding]);

  return (
    <div className="pageStack">
      <section className="pageHeader">
        <div>
          <p className="eyebrow">Receptury</p>
          <h1>Przepisy</h1>
        </div>
        <div className="buttonRow pageHeaderActions">
          <button className="button buttonSecondary" type="button" onClick={() => setIsAiImportOpen(true)}>
            <Sparkles size={20} />
            Dodaj z AI
          </button>
          <button className="button buttonPrimary" type="button" onClick={openAddForm}>
            <Plus size={20} />
            Dodaj
          </button>
        </div>
      </section>

      {ingredients.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={34} />}
          title="Najpierw dodaj składniki"
          action={
            <button className="button buttonPrimary" type="button" onClick={onOpenIngredients}>
              <Plus size={20} />
              Dodaj składnik
            </button>
          }
        />
      ) : null}

      {(isAdding || editingRecipe || aiDraftRecipe) && (
        <div className="dialogBackdrop recipeFormBackdrop" role="presentation">
          <div
            ref={formRef}
            className="dialog recipeFormDialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recipe-form-title"
          >
            <RecipeForm
              recipe={aiDraftRecipe ?? editingRecipe ?? undefined}
              isNewRecipe={isAdding || Boolean(aiDraftRecipe)}
              ingredients={ingredients}
              onSave={handleSave}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}

      {sortedRecipes.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={34} />}
          title="Brak przepisów"
          action={
            <button className="button buttonPrimary" type="button" onClick={openAddForm}>
              <Plus size={20} />
              Dodaj przepis
            </button>
          }
        />
      ) : (
        <div className="listGrid">
          {sortedRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              ingredients={ingredients}
              onEdit={() => openEditForm(recipe)}
              onDuplicate={() => duplicateRecipe(recipe)}
              onDelete={() => setDeleteTarget(recipe)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Usunąć przepis?"
        message={`Przepis „${deleteTarget?.name ?? ''}” zostanie usunięty.`}
        confirmLabel="Usuń"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDelete(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />

      <AiRecipeImportDialog
        open={isAiImportOpen}
        aiSettings={aiSettings}
        ingredients={ingredients}
        onImported={handleAiImported}
        onCancel={() => setIsAiImportOpen(false)}
        onOpenIngredients={onOpenIngredients}
        onOpenSettings={onOpenSettings}
      />
    </div>
  );
}

type RecipeCardProps = {
  recipe: Recipe;
  ingredients: Ingredient[];
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

function RecipeCard({ recipe, ingredients, onEdit, onDuplicate, onDelete }: RecipeCardProps) {
  const cost = calculateRecipeIngredientsCost(recipe, ingredients);
  const activeMinutes = getActiveLaborMinutes(recipe);

  return (
    <article className="listItem">
      <div className="listItemMain">
        <h2>{recipe.name}</h2>
        <p>
          {recipe.category}
          {recipe.formSize ? ` · ${recipe.formSize}` : ''}
          {recipe.servings ? ` · ${recipe.servings} porcji` : ''}
        </p>
        <div className="miniMetrics">
          <span>{recipe.ingredients.length} składników</span>
          <span>{activeMinutes} min pracy</span>
          <span>{recipe.bakingTimeMinutes} min pieczenia</span>
          {recipe.pan ? <span>{formatPanShape(recipe.pan)}</span> : null}
        </div>
        <div className="recipeCardCost">
          <span>Koszt składników</span>
          <strong>
            {cost.errors.length > 0 ? 'Koszt wymaga poprawek' : <Money value={cost.total} />}
          </strong>
        </div>
      </div>
      <div className="itemActions">
        <button className="iconButton" type="button" title="Edytuj przepis" onClick={onEdit}>
          <Edit3 size={18} />
        </button>
        <button className="iconButton" type="button" title="Duplikuj przepis" onClick={onDuplicate}>
          <Copy size={18} />
        </button>
        <button className="iconButton danger" type="button" title="Usuń przepis" onClick={onDelete}>
          <Trash2 size={18} />
        </button>
      </div>
    </article>
  );
}
