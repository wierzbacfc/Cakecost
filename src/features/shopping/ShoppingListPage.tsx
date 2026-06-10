import { Check, FolderOpen, Save, Search, ShoppingBasket, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { Money } from '../../components/Money';
import { generateShoppingList } from '../../lib/calculations';
import { formatDate, formatShoppingAmount } from '../../lib/format';
import { createId } from '../../lib/id';
import type { Ingredient, Recipe, SavedShoppingList } from '../../lib/types';

type ShoppingListPageProps = {
  recipes: Recipe[];
  ingredients: Ingredient[];
  savedLists: SavedShoppingList[];
  onSaveList: (list: SavedShoppingList) => void;
  onDeleteList: (listId: string) => void;
  onOpenRecipes: () => void;
};

type RecipeQuantities = Record<string, number>;

export function ShoppingListPage({
  recipes,
  ingredients,
  savedLists,
  onSaveList,
  onDeleteList,
  onOpenRecipes
}: ShoppingListPageProps) {
  const [recipeQuantities, setRecipeQuantities] = useState<RecipeQuantities>({});
  const [search, setSearch] = useState('');
  const [listName, setListName] = useState('');
  const [activeSavedListId, setActiveSavedListId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedShoppingList | null>(null);

  const sortedRecipes = useMemo(
    () => [...recipes].sort((a, b) => a.name.localeCompare(b.name, 'pl')),
    [recipes]
  );

  const visibleRecipes = useMemo(() => {
    const phrase = search.trim().toLocaleLowerCase('pl');

    if (!phrase) {
      return sortedRecipes;
    }

    return sortedRecipes.filter((recipe) =>
      `${recipe.name} ${recipe.category} ${recipe.formSize ?? ''}`
        .toLocaleLowerCase('pl')
        .includes(phrase)
    );
  }, [search, sortedRecipes]);

  const shoppingList = useMemo(
    () =>
      generateShoppingList(
        recipes,
        ingredients,
        Object.entries(recipeQuantities).map(([recipeId, quantity]) => ({ recipeId, quantity }))
      ),
    [ingredients, recipeQuantities, recipes]
  );
  const sortedSavedLists = useMemo(
    () =>
      [...savedLists].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [savedLists]
  );
  const activeSavedList = activeSavedListId
    ? savedLists.find((list) => list.id === activeSavedListId)
    : undefined;

  function toggleRecipe(recipeId: string) {
    setRecipeQuantities((current) => {
      if (current[recipeId]) {
        const { [recipeId]: _, ...rest } = current;
        return rest;
      }

      return { ...current, [recipeId]: 1 };
    });
  }

  function updateRecipeQuantity(recipeId: string, value: number) {
    const quantity = Number.isFinite(value) ? Math.max(1, Math.round(value)) : 1;
    setRecipeQuantities((current) => ({ ...current, [recipeId]: quantity }));
  }

  function adjustRecipeQuantity(recipeId: string, change: number) {
    setRecipeQuantities((current) => ({
      ...current,
      [recipeId]: Math.max(1, (current[recipeId] ?? 1) + change)
    }));
  }

  function selectAllVisible() {
    setRecipeQuantities((current) => {
      const next = { ...current };
      visibleRecipes.forEach((recipe) => {
        next[recipe.id] = next[recipe.id] ?? 1;
      });
      return next;
    });
  }

  function clearSelection() {
    setRecipeQuantities({});
    setActiveSavedListId(null);
  }

  function startNewList() {
    setRecipeQuantities({});
    setListName('');
    setActiveSavedListId(null);
    setSearch('');
  }

  function saveCurrentList() {
    if (shoppingList.selectedRecipeCount === 0 || shoppingList.lines.length === 0) {
      return;
    }

    const now = new Date().toISOString();
    const existingList = activeSavedListId
      ? savedLists.find((list) => list.id === activeSavedListId)
      : undefined;
    const name = listName.trim() || existingList?.name || `Lista zakupów ${formatDate(now)}`;
    const selections = Object.entries(recipeQuantities)
      .map(([recipeId, quantity]) => {
        const recipe = recipes.find((item) => item.id === recipeId);

        if (!recipe || quantity <= 0) {
          return null;
        }

        return {
          recipeId,
          recipeName: recipe.name,
          quantity
        };
      })
      .filter((selection): selection is NonNullable<typeof selection> => Boolean(selection));
    const savedList: SavedShoppingList = {
      id: existingList?.id ?? createId('shopping-list'),
      name,
      createdAt: existingList?.createdAt ?? now,
      updatedAt: now,
      selections,
      lines: shoppingList.lines.map((line) => ({
        ingredientId: line.ingredientId,
        ingredientName: line.ingredient.name,
        amount: line.amount,
        unit: line.unit,
        estimatedCost: line.estimatedCost,
        recipeNames: line.recipeNames
      })),
      totalEstimatedCost: shoppingList.totalEstimatedCost
    };

    onSaveList(savedList);
    setListName(savedList.name);
    setActiveSavedListId(savedList.id);
  }

  function loadSavedList(list: SavedShoppingList) {
    setRecipeQuantities(
      list.selections.reduce<RecipeQuantities>((next, selection) => {
        next[selection.recipeId] = selection.quantity;
        return next;
      }, {})
    );
    setListName(list.name);
    setActiveSavedListId(list.id);
    setSearch('');
  }

  if (recipes.length === 0) {
    return (
      <div className="pageStack">
        <section className="pageHeader">
          <div>
            <p className="eyebrow">Planowanie</p>
            <h1>Lista zakupów</h1>
          </div>
        </section>
        <EmptyState
          icon={<ShoppingBasket size={34} />}
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
          <p className="eyebrow">Planowanie</p>
          <h1>Lista zakupów</h1>
        </div>
        <div className="buttonRow">
          <button className="button buttonSecondary" type="button" onClick={selectAllVisible}>
            <Check size={20} />
            Zaznacz widoczne
          </button>
          <button
            className="button buttonGhost"
            type="button"
            disabled={shoppingList.selectedRecipeCount === 0}
            onClick={clearSelection}
          >
            <Trash2 size={20} />
            Wyczyść
          </button>
        </div>
      </section>

      <section className="panel savedShoppingPanel" aria-label="Zapisane listy zakupów">
        <div className="formHeader">
          <div>
            <h2>Zapisane listy</h2>
            <p className="sectionHint">
              Zapisuj kilka osobnych list, wczytuj je ponownie i usuwaj te, które są już niepotrzebne.
            </p>
          </div>
          <button className="button buttonGhost compactButton" type="button" onClick={startNewList}>
            Nowa lista
          </button>
        </div>

        <div className="shoppingSaveBar">
          <label className="field">
            <span className="fieldLabel">Nazwa listy</span>
            <input
              value={listName}
              placeholder="Np. zakupy na sobotnie zamówienia"
              onChange={(event) => setListName(event.target.value)}
            />
          </label>
          <button
            className="button buttonPrimary"
            type="button"
            disabled={shoppingList.selectedRecipeCount === 0 || shoppingList.lines.length === 0}
            onClick={saveCurrentList}
          >
            <Save size={20} />
            {activeSavedList ? 'Zaktualizuj listę' : 'Zapisz listę'}
          </button>
        </div>

        {sortedSavedLists.length > 0 ? (
          <div className="savedShoppingList">
            {sortedSavedLists.map((list) => (
              <article
                key={list.id}
                className={
                  list.id === activeSavedListId ? 'savedShoppingCard active' : 'savedShoppingCard'
                }
              >
                <div className="savedShoppingCardMain">
                  <h3>{list.name}</h3>
                  <p>{formatDate(list.updatedAt)}</p>
                  <div className="miniMetrics">
                    <span>{list.selections.reduce((sum, item) => sum + item.quantity, 0)} wypieków</span>
                    <span>{list.lines.length} produktów</span>
                    <span className="miniMetricCost">
                      <Money value={list.totalEstimatedCost} />
                    </span>
                  </div>
                </div>
                <div className="itemActions">
                  <button
                    className="iconButton"
                    type="button"
                    title="Wczytaj listę"
                    onClick={() => loadSavedList(list)}
                  >
                    <FolderOpen size={18} />
                  </button>
                  <button
                    className="iconButton danger"
                    type="button"
                    title="Usuń listę"
                    onClick={() => setDeleteTarget(list)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="shoppingEmpty compact">
            <ShoppingBasket size={28} />
            <strong>Nie masz jeszcze zapisanych list.</strong>
          </div>
        )}
      </section>

      <div className="shoppingLayout">
        <section className="panel shoppingChooser" aria-label="Wybór przepisów">
          <div className="formHeader">
            <div>
              <h2>Wybierz ciasta</h2>
              <p className="sectionHint">
                Zaznacz przepisy i ustaw, ile sztuk każdego wypieku chcesz przygotować.
              </p>
            </div>
          </div>

          <label className="searchBox">
            <Search size={19} />
            <input
              value={search}
              placeholder="Szukaj przepisu"
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <div className="shoppingRecipeList">
            {visibleRecipes.map((recipe) => {
              const quantity = recipeQuantities[recipe.id] ?? 0;
              const isSelected = quantity > 0;

              return (
                <article
                  key={recipe.id}
                  className={isSelected ? 'shoppingRecipe selected' : 'shoppingRecipe'}
                >
                  <button
                    className="shoppingRecipeToggle"
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleRecipe(recipe.id)}
                  >
                    <span className="shoppingCheck" aria-hidden="true">
                      {isSelected ? <Check size={17} /> : null}
                    </span>
                    <span className="shoppingRecipeText">
                      <strong>{recipe.name}</strong>
                      <small>
                        {recipe.category}
                        {recipe.formSize ? ` · ${recipe.formSize}` : ''}
                        {recipe.ingredients.length ? ` · ${recipe.ingredients.length} składników` : ''}
                      </small>
                    </span>
                  </button>

                  {isSelected ? (
                    <label className="shoppingQuantity">
                      <span>Ilość</span>
                      <span className="quantityStepper">
                        <button
                          type="button"
                          aria-label={`Zmniejsz ilość dla ${recipe.name}`}
                          onClick={() => adjustRecipeQuantity(recipe.id, -1)}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          inputMode="numeric"
                          value={quantity}
                          aria-label={`Ilość wypieków dla ${recipe.name}`}
                          onFocus={(event) => event.target.select()}
                          onClick={(event) => event.currentTarget.select()}
                          onChange={(event) =>
                            updateRecipeQuantity(recipe.id, Number(event.target.value))
                          }
                        />
                        <button
                          type="button"
                          aria-label={`Zwiększ ilość dla ${recipe.name}`}
                          onClick={() => adjustRecipeQuantity(recipe.id, 1)}
                        >
                          +
                        </button>
                      </span>
                    </label>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <section className="panel shoppingResultPanel" aria-label="Wygenerowana lista zakupów">
          <div className="formHeader">
            <div>
              <h2>Zakupy</h2>
              <p className="sectionHint">Składniki z wybranych przepisów są zsumowane po jednostkach.</p>
            </div>
          </div>

          {shoppingList.selectedRecipeCount === 0 ? (
            <div className="shoppingEmpty">
              <ShoppingBasket size={34} />
              <strong>Zaznacz przynajmniej jeden przepis</strong>
            </div>
          ) : (
            <>
              <div className="shoppingSummary">
                <div>
                  <span>Wybrane wypieki</span>
                  <strong>{shoppingList.selectedRecipeCount}</strong>
                </div>
                <div>
                  <span>Pozycje zakupów</span>
                  <strong>{shoppingList.lines.length}</strong>
                </div>
                <div>
                  <span>Szacowany koszt</span>
                  <strong>
                    <Money value={shoppingList.totalEstimatedCost} />
                  </strong>
                </div>
              </div>

              <div className="shoppingList">
                {shoppingList.lines.map((line) => (
                  <article key={line.ingredientId} className="shoppingListLine">
                    <div>
                      <strong>{line.ingredient.name}</strong>
                      <small>{line.recipeNames.join(', ')}</small>
                    </div>
                    <div className="shoppingListAmount">
                      <strong>{formatShoppingAmount(line.amount, line.unit)}</strong>
                      <span>
                        ok. <Money value={line.estimatedCost} />
                      </span>
                    </div>
                  </article>
                ))}
              </div>

              {shoppingList.issues.length > 0 ? (
                <div className="warning warningDanger">
                  <div>
                    <strong>Nie wszystkie składniki dało się dodać do listy.</strong>
                    {shoppingList.issues.map((issue) => (
                      <span key={`${issue.recipeName}-${issue.ingredientName ?? issue.message}`}>
                        {issue.recipeName}
                        {issue.ingredientName ? ` · ${issue.ingredientName}` : ''}: {issue.message}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>

      {activeSavedList ? (
        <section className="panel savedShoppingSnapshot" aria-label="Produkty zapisane w aktywnej liście">
          <div className="formHeader">
            <div>
              <h2>Produkty zapisane w „{activeSavedList.name}”</h2>
              <p className="sectionHint">
                To snapshot listy z momentu zapisu. Wczytana lista po lewej przelicza się na aktualnych danych.
              </p>
            </div>
          </div>
          <div className="shoppingList">
            {activeSavedList.lines.map((line) => (
              <article key={line.ingredientId} className="shoppingListLine">
                <div>
                  <strong>{line.ingredientName}</strong>
                  <small>{line.recipeNames.join(', ')}</small>
                </div>
                <div className="shoppingListAmount">
                  <strong>{formatShoppingAmount(line.amount, line.unit)}</strong>
                  <span>
                    ok. <Money value={line.estimatedCost} />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Usunąć listę zakupów?"
        message={`Lista „${deleteTarget?.name ?? ''}” zostanie usunięta.`}
        confirmLabel="Usuń"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDeleteList(deleteTarget.id);
            if (deleteTarget.id === activeSavedListId) {
              setActiveSavedListId(null);
              setListName('');
            }
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
