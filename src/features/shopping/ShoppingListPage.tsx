import { Check, Search, ShoppingBasket, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { Money } from '../../components/Money';
import { generateShoppingList } from '../../lib/calculations';
import { formatShoppingAmount } from '../../lib/format';
import type { Ingredient, Recipe } from '../../lib/types';

type ShoppingListPageProps = {
  recipes: Recipe[];
  ingredients: Ingredient[];
  onOpenRecipes: () => void;
};

type RecipeQuantities = Record<string, number>;

export function ShoppingListPage({
  recipes,
  ingredients,
  onOpenRecipes
}: ShoppingListPageProps) {
  const [recipeQuantities, setRecipeQuantities] = useState<RecipeQuantities>({});
  const [search, setSearch] = useState('');

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
                      <input
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        value={quantity}
                        aria-label={`Ilość wypieków dla ${recipe.name}`}
                        onChange={(event) =>
                          updateRecipeQuantity(recipe.id, Number(event.target.value))
                        }
                      />
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
    </div>
  );
}
