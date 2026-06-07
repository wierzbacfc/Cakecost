import { Edit3, PackagePlus, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { Money } from '../../components/Money';
import { formatAmount, formatUnitPrice } from '../../lib/format';
import type { Ingredient } from '../../lib/types';
import { IngredientForm } from './IngredientForm';

type IngredientsPageProps = {
  ingredients: Ingredient[];
  onSave: (ingredient: Ingredient) => void;
  onDelete: (ingredientId: string) => void;
};

export function IngredientsPage({ ingredients, onSave, onDelete }: IngredientsPageProps) {
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const filteredIngredients = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return ingredients
      .filter((ingredient) =>
        normalizedSearch ? ingredient.name.toLowerCase().includes(normalizedSearch) : true
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  }, [ingredients, search]);

  function closeForm() {
    setIsAdding(false);
    setEditingIngredient(null);
  }

  function handleSave(ingredient: Ingredient) {
    onSave(ingredient);
    closeForm();
  }

  function openAddForm() {
    setEditingIngredient(null);
    setIsAdding(true);
  }

  function openEditForm(ingredient: Ingredient) {
    setIsAdding(false);
    setEditingIngredient(ingredient);
  }

  useEffect(() => {
    if (!isAdding && !editingIngredient) {
      return;
    }

    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstField = formRef.current?.querySelector<HTMLInputElement | HTMLSelectElement>(
        'input, select, textarea'
      );
      firstField?.focus({ preventScroll: true });
    });
  }, [editingIngredient, isAdding]);

  return (
    <div className="pageStack">
      <section className="pageHeader">
        <div>
          <p className="eyebrow">Baza składników</p>
          <h1>Składniki</h1>
        </div>
        <button className="button buttonPrimary" type="button" onClick={openAddForm}>
          <Plus size={20} />
          Dodaj
        </button>
      </section>

      {(isAdding || editingIngredient) && (
        <div ref={formRef} className="formAnchor">
          <IngredientForm
            ingredient={editingIngredient ?? undefined}
            onSave={handleSave}
            onCancel={closeForm}
          />
        </div>
      )}

      <label className="searchBox">
        <Search size={18} />
        <span className="visuallyHidden">Szukaj składnika</span>
        <input
          value={search}
          placeholder="Szukaj składnika"
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      {filteredIngredients.length === 0 ? (
        <EmptyState
          icon={<PackagePlus size={34} />}
          title={ingredients.length === 0 ? 'Brak składników' : 'Brak wyników'}
          action={
            <button className="button buttonPrimary" type="button" onClick={openAddForm}>
              <Plus size={20} />
              Dodaj składnik
            </button>
          }
        />
      ) : (
        <div className="listGrid">
          {filteredIngredients.map((ingredient) => (
            <article className="listItem" key={ingredient.id}>
              <div className="listItemMain">
                <h2>{ingredient.name}</h2>
                <p>
                  <Money value={ingredient.packagePrice} /> /{' '}
                  {formatAmount(ingredient.packageAmount, ingredient.unit)}
                </p>
                <strong>{formatUnitPrice(ingredient.unitPrice, ingredient.unit)}</strong>
                {ingredient.store ? <small>{ingredient.store}</small> : null}
              </div>
              <div className="itemActions">
                <button
                  className="iconButton"
                  type="button"
                  title="Edytuj składnik"
                  onClick={() => openEditForm(ingredient)}
                >
                  <Edit3 size={18} />
                </button>
                <button
                  className="iconButton danger"
                  type="button"
                  title="Usuń składnik"
                  onClick={() => setDeleteTarget(ingredient)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Usunąć składnik?"
        message={`Składnik „${deleteTarget?.name ?? ''}” zostanie usunięty z bazy.`}
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
    </div>
  );
}
