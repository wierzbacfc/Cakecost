import { useEffect, useRef, useState } from 'react';
import { Layout } from '../components/Layout';
import { HistoryPage } from '../features/history/HistoryPage';
import { HomePage } from '../features/home/HomePage';
import { IngredientsPage } from '../features/ingredients/IngredientsPage';
import { NewQuotePage } from '../features/quote/NewQuotePage';
import { RecipesPage } from '../features/recipes/RecipesPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import type { Page } from '../lib/navigation';
import {
  clearStoredData,
  createEmptyData,
  loadAppData,
  saveAppData
} from '../lib/storage';
import type { AppData, AppSettings, Ingredient, QuoteHistoryItem, Recipe } from '../lib/types';

export function App() {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [activePage, setActivePage] = useState<Page>('home');
  const [editingHistoryItem, setEditingHistoryItem] = useState<QuoteHistoryItem | null>(null);
  const [toast, setToast] = useState('');
  const toastTimeout = useRef<number>();

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  function notify(message: string) {
    setToast(message);
    window.clearTimeout(toastTimeout.current);
    toastTimeout.current = window.setTimeout(() => setToast(''), 2600);
  }

  function navigate(page: Page) {
    if (page !== 'quote') {
      setEditingHistoryItem(null);
    }
    setActivePage(page);
  }

  function saveIngredient(ingredient: Ingredient) {
    setData((current) => {
      const exists = current.ingredients.some((item) => item.id === ingredient.id);
      return {
        ...current,
        ingredients: exists
          ? current.ingredients.map((item) => (item.id === ingredient.id ? ingredient : item))
          : [...current.ingredients, ingredient]
      };
    });
    notify('Składnik zapisany.');
  }

  function deleteIngredient(ingredientId: string) {
    setData((current) => ({
      ...current,
      ingredients: current.ingredients.filter((ingredient) => ingredient.id !== ingredientId)
    }));
    notify('Składnik usunięty.');
  }

  function saveRecipe(recipe: Recipe) {
    setData((current) => {
      const exists = current.recipes.some((item) => item.id === recipe.id);
      return {
        ...current,
        recipes: exists
          ? current.recipes.map((item) => (item.id === recipe.id ? recipe : item))
          : [...current.recipes, recipe]
      };
    });
    notify('Przepis zapisany.');
  }

  function deleteRecipe(recipeId: string) {
    setData((current) => ({
      ...current,
      recipes: current.recipes.filter((recipe) => recipe.id !== recipeId)
    }));
    notify('Przepis usunięty.');
  }

  function saveHistoryItem(item: QuoteHistoryItem) {
    setData((current) => ({
      ...current,
      history: current.history.some((historyItem) => historyItem.id === item.id)
        ? current.history.map((historyItem) => (historyItem.id === item.id ? item : historyItem))
        : [item, ...current.history]
    }));
    notify(editingHistoryItem ? 'Wycena zaktualizowana.' : 'Wycena zapisana.');
  }

  function deleteHistoryItem(itemId: string) {
    setData((current) => ({
      ...current,
      history: current.history.filter((item) => item.id !== itemId)
    }));
    notify('Wpis usunięty.');
  }

  function renameHistoryItem(itemId: string, quoteName: string) {
    setData((current) => ({
      ...current,
      history: current.history.map((item) =>
        item.id === itemId ? { ...item, quoteName: quoteName.trim() || item.recipeName } : item
      )
    }));
    notify('Nazwa wyceny zapisana.');
  }

  function editHistoryItem(item: QuoteHistoryItem) {
    setEditingHistoryItem(item);
    setActivePage('quote');
  }

  function updateSettings(settings: AppSettings) {
    setData((current) => ({
      ...current,
      settings
    }));
  }

  function importData(nextData: AppData) {
    setData(nextData);
    notify('Dane zaimportowane.');
  }

  function clearAllData() {
    clearStoredData();
    setData(createEmptyData());
    notify('Dane wyczyszczone.');
  }

  return (
    <Layout activePage={activePage} onNavigate={navigate} toast={toast}>
      {activePage === 'home' ? (
        <HomePage
          ingredientCount={data.ingredients.length}
          recipeCount={data.recipes.length}
          historyCount={data.history.length}
          onNavigate={navigate}
        />
      ) : null}

      {activePage === 'ingredients' ? (
        <IngredientsPage
          ingredients={data.ingredients}
          onSave={saveIngredient}
          onDelete={deleteIngredient}
        />
      ) : null}

      {activePage === 'recipes' ? (
        <RecipesPage
          recipes={data.recipes}
          ingredients={data.ingredients}
          onSave={saveRecipe}
          onDelete={deleteRecipe}
          onOpenIngredients={() => setActivePage('ingredients')}
        />
      ) : null}

      {activePage === 'quote' ? (
        <NewQuotePage
          recipes={data.recipes}
          ingredients={data.ingredients}
          settings={data.settings}
          onSaveHistory={saveHistoryItem}
          editingHistoryItem={editingHistoryItem}
          onOpenRecipes={() => navigate('recipes')}
        />
      ) : null}

      {activePage === 'history' ? (
        <HistoryPage
          history={data.history}
          onDelete={deleteHistoryItem}
          onRename={renameHistoryItem}
          onEdit={editHistoryItem}
        />
      ) : null}

      {activePage === 'settings' ? (
        <SettingsPage
          data={data}
          settings={data.settings}
          onUpdateSettings={updateSettings}
          onImportData={importData}
          onClearAll={clearAllData}
        />
      ) : null}
    </Layout>
  );
}
