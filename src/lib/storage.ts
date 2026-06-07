import { calculateIngredientUnitPrice, roundCurrency } from './calculations';
import {
  createEmptyData,
  createSampleData,
  defaultSettings,
  mergeSampleCatalog
} from './sampleData';
import type {
  AppData,
  AppDataExport,
  AppSettings,
  Ingredient,
  ProfitMode,
  QuoteHistoryItem,
  Recipe,
  RecipeCategory,
  RoundTo,
  Unit
} from './types';
import { recipeCategories, units } from './types';

const STORAGE_KEY = 'kalkulator-wypiekow:data:v1';

export function loadAppData(): AppData {
  if (typeof localStorage === 'undefined') {
    return createSampleData();
  }

  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    const sampleData = createSampleData();
    saveAppData(sampleData);
    return sampleData;
  }

  try {
    return mergeSampleCatalog(normalizeAppData(JSON.parse(raw)));
  } catch (error) {
    console.warn('Nie udało się odczytać danych aplikacji.', error);
    return createSampleData();
  }
}

export function saveAppData(data: AppData) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function exportAppData(data: AppData): AppDataExport {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...data
  };
}

export function importAppData(value: unknown): AppData {
  const candidate = value as Partial<AppDataExport>;

  if (!candidate || typeof candidate !== 'object') {
    throw new Error('Plik importu ma nieprawidłowy format.');
  }

  return normalizeAppData(candidate);
}

export function clearStoredData() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function normalizeAppData(value: Partial<AppDataExport>): AppData {
  const now = new Date().toISOString();
  const settings = normalizeSettings(value.settings);
  const ingredients = Array.isArray(value.ingredients)
    ? value.ingredients.map((ingredient) => normalizeIngredient(ingredient, now)).filter(Boolean)
    : [];
  const recipes = Array.isArray(value.recipes)
    ? value.recipes.map((recipe) => normalizeRecipe(recipe, now)).filter(Boolean)
    : [];
  const history = Array.isArray(value.history)
    ? value.history.map((item) => normalizeHistoryItem(item, now)).filter(Boolean)
    : [];

  return {
    ingredients: ingredients as Ingredient[],
    recipes: recipes as Recipe[],
    history: history as QuoteHistoryItem[],
    settings
  };
}

export { createEmptyData };

function normalizeSettings(settings?: Partial<AppSettings>): AppSettings {
  return {
    defaultHourlyRate: roundCurrency(nonNegativeNumber(
      settings?.defaultHourlyRate,
      defaultSettings.defaultHourlyRate
    )),
    defaultSafetyMarginPercent: roundCurrency(nonNegativeNumber(
      settings?.defaultSafetyMarginPercent,
      defaultSettings.defaultSafetyMarginPercent
    )),
    defaultProfitMode: isProfitMode(settings?.defaultProfitMode)
      ? settings.defaultProfitMode
      : defaultSettings.defaultProfitMode,
    defaultProfitPercent: roundCurrency(nonNegativeNumber(
      settings?.defaultProfitPercent,
      defaultSettings.defaultProfitPercent
    )),
    defaultProfitFixed: roundCurrency(nonNegativeNumber(
      settings?.defaultProfitFixed,
      defaultSettings.defaultProfitFixed
    )),
    defaultEnergyCost: roundCurrency(nonNegativeNumber(
      settings?.defaultEnergyCost,
      defaultSettings.defaultEnergyCost
    )),
    defaultDeliveryCost: roundCurrency(nonNegativeNumber(
      settings?.defaultDeliveryCost,
      defaultSettings.defaultDeliveryCost
    )),
    defaultRoundTo: isRoundTo(settings?.defaultRoundTo)
      ? settings.defaultRoundTo
      : defaultSettings.defaultRoundTo
  };
}

function normalizeIngredient(value: Partial<Ingredient>, fallbackDate: string): Ingredient | null {
  if (!value.id || !value.name || !isUnit(value.unit)) {
    return null;
  }

  const packagePrice = roundCurrency(nonNegativeNumber(value.packagePrice, 0));
  const packageAmount = nonNegativeNumber(value.packageAmount, 0);

  if (packagePrice <= 0 || packageAmount <= 0) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    packagePrice,
    packageAmount,
    unit: value.unit,
    unitPrice: calculateIngredientUnitPrice(packagePrice, packageAmount, value.unit),
    store: value.store ?? '',
    notes: value.notes ?? '',
    updatedAt: value.updatedAt ?? fallbackDate
  };
}

function normalizeRecipe(value: Partial<Recipe>, fallbackDate: string): Recipe | null {
  if (!value.id || !value.name || !isRecipeCategory(value.category)) {
    return null;
  }

  const ingredients = Array.isArray(value.ingredients)
    ? value.ingredients
        .filter((ingredient) => ingredient.ingredientId && isUnit(ingredient.unit))
        .map((ingredient) => ({
          ingredientId: ingredient.ingredientId,
          amount: nonNegativeNumber(ingredient.amount, 0),
          unit: ingredient.unit
        }))
    : [];

  return {
    id: value.id,
    name: value.name,
    category: value.category,
    description: value.description ?? '',
    formSize: value.formSize ?? '',
    servings: optionalPositiveNumber(value.servings),
    finalWeightGrams: optionalPositiveNumber(value.finalWeightGrams),
    preparationTimeMinutes: nonNegativeNumber(value.preparationTimeMinutes, 0),
    bakingTimeMinutes: nonNegativeNumber(value.bakingTimeMinutes, 0),
    decorationTimeMinutes: nonNegativeNumber(value.decorationTimeMinutes, 0),
    cleaningTimeMinutes: nonNegativeNumber(value.cleaningTimeMinutes, 0),
    ingredients,
    createdAt: value.createdAt ?? fallbackDate,
    updatedAt: value.updatedAt ?? fallbackDate
  };
}

function normalizeHistoryItem(
  value: Partial<QuoteHistoryItem>,
  fallbackDate: string
): QuoteHistoryItem | null {
  if (!value.id || !value.recipeId || !value.recipeName || !value.result || !value.input) {
    return null;
  }

  const deliveryCost = roundCurrency(nonNegativeNumber(value.input.deliveryCost, 0));

  return {
    id: value.id,
    recipeId: value.recipeId,
    recipeName: value.recipeName,
    quoteName: value.quoteName?.trim() || value.recipeName,
    date: value.date ?? fallbackDate,
    result: {
      ...value.result,
      deliveryCost: roundCurrency(nonNegativeNumber(value.result.deliveryCost, 0))
    },
    input: {
      ...value.input,
      deliveryCost,
      includeDelivery: value.input.includeDelivery === true
    }
  };
}

function isUnit(value: unknown): value is Unit {
  return typeof value === 'string' && units.includes(value as Unit);
}

function isRecipeCategory(value: unknown): value is RecipeCategory {
  return typeof value === 'string' && recipeCategories.includes(value as RecipeCategory);
}

function isProfitMode(value: unknown): value is ProfitMode {
  return value === 'fixed' || value === 'percent';
}

function isRoundTo(value: unknown): value is RoundTo {
  return value === 1 || value === 5 || value === 10;
}

function nonNegativeNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function optionalPositiveNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}
