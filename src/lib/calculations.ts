import type {
  BaseUnit,
  Ingredient,
  QuoteInput,
  QuoteResult,
  Recipe,
  RecipeIngredient,
  RoundTo,
  Unit
} from './types';

export type ConvertedAmount = {
  amount: number;
  unit: BaseUnit;
};

export type RecipeIngredientCostLine = {
  index: number;
  ingredient: Ingredient;
  amount: number;
  unit: Unit;
  baseAmount: number;
  baseUnit: BaseUnit;
  cost: number;
};

export type RecipeIngredientCostError = {
  index: number;
  message: string;
};

export type RecipeIngredientsCost = {
  total: number;
  lines: RecipeIngredientCostLine[];
  errors: RecipeIngredientCostError[];
};

const unitBaseMap: Record<Unit, BaseUnit> = {
  g: 'g',
  kg: 'g',
  ml: 'ml',
  l: 'ml',
  szt: 'szt'
};

export function getBaseUnit(unit: Unit): BaseUnit {
  return unitBaseMap[unit];
}

export function convertAmountToBaseUnit(amount: number, unit: Unit): ConvertedAmount {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('Ilość nie może być ujemna.');
  }

  if (unit === 'kg') {
    return { amount: amount * 1000, unit: 'g' };
  }

  if (unit === 'l') {
    return { amount: amount * 1000, unit: 'ml' };
  }

  return { amount, unit: getBaseUnit(unit) };
}

export function calculateIngredientUnitPrice(
  packagePrice: number,
  packageAmount: number,
  unit: Unit
): number {
  if (!Number.isFinite(packagePrice) || packagePrice <= 0) {
    throw new Error('Cena opakowania musi być większa od 0.');
  }

  if (!Number.isFinite(packageAmount) || packageAmount <= 0) {
    throw new Error('Ilość w opakowaniu musi być większa od 0.');
  }

  const convertedPackage = convertAmountToBaseUnit(packageAmount, unit);
  return packagePrice / convertedPackage.amount;
}

export function calculateRecipeIngredientsCost(
  recipe: Pick<Recipe, 'ingredients'> | RecipeIngredient[],
  ingredients: Ingredient[]
): RecipeIngredientsCost {
  const recipeIngredients = Array.isArray(recipe) ? recipe : recipe.ingredients;
  const lines: RecipeIngredientCostLine[] = [];
  const errors: RecipeIngredientCostError[] = [];

  recipeIngredients.forEach((recipeIngredient, index) => {
    const ingredient = ingredients.find((item) => item.id === recipeIngredient.ingredientId);

    if (!ingredient) {
      errors.push({
        index,
        message: 'Nie znaleziono składnika z przepisu w bazie składników.'
      });
      return;
    }

    if (recipeIngredient.amount <= 0) {
      errors.push({
        index,
        message: `Ilość składnika „${ingredient.name}” musi być większa od 0.`
      });
      return;
    }

    const recipeAmount = convertAmountToBaseUnit(recipeIngredient.amount, recipeIngredient.unit);
    const ingredientBaseUnit = getBaseUnit(ingredient.unit);

    if (recipeAmount.unit !== ingredientBaseUnit) {
      errors.push({
        index,
        message: `Nie można przeliczyć ${recipeIngredient.unit} na ${ingredientBaseUnit} dla składnika „${ingredient.name}”. Zmień jednostkę składnika albo ilość w przepisie.`
      });
      return;
    }

    lines.push({
      index,
      ingredient,
      amount: recipeIngredient.amount,
      unit: recipeIngredient.unit,
      baseAmount: recipeAmount.amount,
      baseUnit: recipeAmount.unit,
      cost: roundCurrency(recipeAmount.amount * ingredient.unitPrice)
    });
  });

  return {
    total: roundCurrency(lines.reduce((sum, line) => sum + line.cost, 0)),
    lines,
    errors
  };
}

export function getActiveLaborMinutes(recipe: Recipe): number {
  return (
    recipe.preparationTimeMinutes + recipe.decorationTimeMinutes + recipe.cleaningTimeMinutes
  );
}

export function calculateLaborCost(recipe: Recipe, hourlyRate: number): number {
  if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
    throw new Error('Stawka godzinowa nie może być ujemna.');
  }

  return roundCurrency((getActiveLaborMinutes(recipe) / 60) * hourlyRate);
}

export function roundPrice(price: number, roundTo: RoundTo): number {
  if (!Number.isFinite(price) || price < 0) {
    throw new Error('Cena do zaokrąglenia nie może być ujemna.');
  }

  return Math.ceil(price / roundTo) * roundTo;
}

export function calculateQuote(
  recipe: Recipe,
  ingredients: Ingredient[],
  input: QuoteInput
): QuoteResult {
  assertNonNegative(input.packagingCost, 'Koszt opakowania');
  assertNonNegative(input.extrasCost, 'Koszt dodatków');
  assertNonNegative(input.energyCost, 'Koszt energii');
  assertNonNegative(input.deliveryCost, 'Koszt dowozu');
  assertNonNegative(input.hourlyRate, 'Stawka godzinowa');
  assertNonNegative(input.safetyMarginPercent, 'Dodatkowe koszty (%)');
  assertNonNegative(input.profitPercent ?? 0, 'Zysk procentowy');
  assertNonNegative(input.profitFixed ?? 0, 'Zysk kwotowy');

  const ingredientsCost = calculateRecipeIngredientsCost(recipe, ingredients);

  if (ingredientsCost.errors.length > 0) {
    throw new Error(ingredientsCost.errors.map((error) => error.message).join('\n'));
  }

  const laborCost = calculateLaborCost(recipe, input.hourlyRate);
  const deliveryCost = input.includeDelivery ? roundCurrency(input.deliveryCost) : 0;
  const baseCost = roundCurrency(
    ingredientsCost.total +
      input.packagingCost +
      input.extrasCost +
      input.energyCost +
      deliveryCost +
      laborCost
  );
  const safetyMarginValue = roundCurrency((baseCost * input.safetyMarginPercent) / 100);
  const totalCost = roundCurrency(baseCost + safetyMarginValue);
  const profitValue =
    input.profitMode === 'percent'
      ? roundCurrency((totalCost * (input.profitPercent ?? 0)) / 100)
      : roundCurrency(input.profitFixed ?? 0);
  const exactPrice = roundCurrency(totalCost + profitValue);
  const suggestedPrice = roundPrice(exactPrice, input.roundTo);
  const activeHours = getActiveLaborMinutes(recipe) / 60;

  return {
    ingredientsCost: ingredientsCost.total,
    laborCost,
    packagingCost: roundCurrency(input.packagingCost),
    extrasCost: roundCurrency(input.extrasCost),
    energyCost: roundCurrency(input.energyCost),
    deliveryCost,
    baseCost,
    safetyMarginValue,
    totalCost,
    profitValue,
    exactPrice,
    suggestedPrice,
    pricePerServing:
      recipe.servings && recipe.servings > 0
        ? roundCurrency(suggestedPrice / recipe.servings)
        : undefined,
    pricePerKg:
      recipe.finalWeightGrams && recipe.finalWeightGrams > 0
        ? roundCurrency(suggestedPrice / (recipe.finalWeightGrams / 1000))
        : undefined,
    effectiveHourlyProfit:
      activeHours > 0 ? roundCurrency(profitValue / activeHours) : undefined
  };
}

export function roundCurrency(value: number): number {
  if (!Number.isFinite(value) || value === 0) {
    return 0;
  }

  return value > 0
    ? Math.ceil(value - Number.EPSILON)
    : Math.floor(value + Number.EPSILON);
}

function assertNonNegative(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} nie może być ujemny.`);
  }
}
