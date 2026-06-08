export const units = ['g', 'kg', 'ml', 'l', 'szt'] as const;
export type Unit = (typeof units)[number];
export type BaseUnit = 'g' | 'ml' | 'szt';

export const recipeCategories = ['ciasto', 'tort', 'babeczki', 'ciasteczka', 'inne'] as const;
export type RecipeCategory = (typeof recipeCategories)[number];

export type Ingredient = {
  id: string;
  name: string;
  packagePrice: number;
  packageAmount: number;
  unit: Unit;
  unitPrice: number;
  store?: string;
  notes?: string;
  updatedAt: string;
};

export type RecipeIngredient = {
  ingredientId: string;
  amount: number;
  unit: Unit;
};

export type Recipe = {
  id: string;
  name: string;
  category: RecipeCategory;
  description?: string;
  formSize?: string;
  servings?: number;
  finalWeightGrams?: number;
  preparationTimeMinutes: number;
  bakingTimeMinutes: number;
  decorationTimeMinutes: number;
  cleaningTimeMinutes: number;
  ingredients: RecipeIngredient[];
  createdAt: string;
  updatedAt: string;
};

export type ProfitMode = 'percent' | 'fixed';
export type RoundTo = 1 | 5 | 10;

export type QuoteInput = {
  recipeId: string;
  packagingCost: number;
  extrasCost: number;
  energyBakingHourlyCost: number;
  energyActivityHourlyCost: number;
  deliveryCost: number;
  includeDelivery: boolean;
  hourlyRate: number;
  safetyMarginPercent: number;
  profitMode: ProfitMode;
  profitPercent?: number;
  profitFixed?: number;
  roundTo: RoundTo;
};

export type QuoteResult = {
  ingredientsCost: number;
  laborCost: number;
  packagingCost: number;
  extrasCost: number;
  energyCost: number;
  deliveryCost: number;
  baseCost: number;
  safetyMarginValue: number;
  totalCost: number;
  profitValue: number;
  totalEarnings: number;
  exactPrice: number;
  suggestedPrice: number;
  pricePerServing?: number;
  pricePerKg?: number;
  effectiveHourlyProfit?: number;
};

export type QuoteHistoryItem = {
  id: string;
  recipeId: string;
  recipeName: string;
  quoteName: string;
  date: string;
  result: QuoteResult;
  input: QuoteInput;
};

export type AppSettings = {
  defaultHourlyRate: number;
  defaultSafetyMarginPercent: number;
  defaultProfitMode: ProfitMode;
  defaultProfitPercent: number;
  defaultProfitFixed: number;
  defaultEnergyBakingHourlyCost: number;
  defaultEnergyActivityHourlyCost: number;
  defaultDeliveryCost: number;
  defaultRoundTo: RoundTo;
};

export type AppData = {
  ingredients: Ingredient[];
  recipes: Recipe[];
  history: QuoteHistoryItem[];
  settings: AppSettings;
};

export type AppDataExport = AppData & {
  version: 1;
  exportedAt: string;
};
