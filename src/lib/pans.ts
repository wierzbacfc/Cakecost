import type { PanShape, Recipe } from './types';

export function getPanArea(pan?: PanShape): number | undefined {
  if (!pan) {
    return undefined;
  }

  if (pan.type === 'round') {
    return pan.diameterCm > 0 ? Math.PI * (pan.diameterCm / 2) ** 2 : undefined;
  }

  return pan.widthCm > 0 && pan.heightCm > 0 ? pan.widthCm * pan.heightCm : undefined;
}

export function calculatePanScale(sourcePan?: PanShape, targetPan?: PanShape): number {
  const sourceArea = getPanArea(sourcePan);
  const targetArea = getPanArea(targetPan);

  if (!sourceArea || !targetArea) {
    return 1;
  }

  return targetArea / sourceArea;
}

export function scaleRecipeForPan(recipe: Recipe, targetPan?: PanShape) {
  const scale = calculatePanScale(recipe.pan, targetPan);

  if (scale === 1) {
    return { recipe, scale };
  }

  return {
    scale,
    recipe: {
      ...recipe,
      ingredients: recipe.ingredients.map((ingredient) => ({
        ...ingredient,
        amount: roundScaledAmount(ingredient.amount * scale)
      })),
      servings: recipe.servings ? Math.max(1, Math.round(recipe.servings * scale)) : undefined,
      finalWeightGrams: recipe.finalWeightGrams
        ? Math.max(1, Math.round(recipe.finalWeightGrams * scale))
        : undefined
    }
  };
}

export function scalePanShape(pan: PanShape, scale: number): PanShape {
  if (!Number.isFinite(scale) || scale <= 0) {
    return pan;
  }

  const dimensionScale = Math.sqrt(scale);

  if (pan.type === 'round') {
    return {
      type: 'round',
      diameterCm: roundDimension(pan.diameterCm * dimensionScale)
    };
  }

  return {
    type: 'rectangular',
    widthCm: roundDimension(pan.widthCm * dimensionScale),
    heightCm: roundDimension(pan.heightCm * dimensionScale)
  };
}

export function formatPanShape(pan?: PanShape): string {
  if (!pan) {
    return 'brak danych';
  }

  if (pan.type === 'round') {
    return `okrągła ${formatDimension(pan.diameterCm)} cm`;
  }

  return `prostokątna ${formatDimension(pan.widthCm)} x ${formatDimension(pan.heightCm)} cm`;
}

export function inferPanFromText(value?: string): PanShape | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(',', '.');
  const rectangularMatch = normalized.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);

  if (rectangularMatch) {
    return {
      type: 'rectangular',
      widthCm: Number(rectangularMatch[1]),
      heightCm: Number(rectangularMatch[2])
    };
  }

  const roundMatch = normalized.match(/(\d+(?:\.\d+)?)\s*cm/i);

  if (roundMatch) {
    return {
      type: 'round',
      diameterCm: Number(roundMatch[1])
    };
  }

  return undefined;
}

export function isValidPanShape(value: unknown): value is PanShape {
  const candidate = value as Partial<PanShape>;

  if (!candidate || typeof candidate !== 'object') {
    return false;
  }

  if (candidate.type === 'round') {
    return isPositiveNumber(candidate.diameterCm);
  }

  if (candidate.type === 'rectangular') {
    return isPositiveNumber(candidate.widthCm) && isPositiveNumber(candidate.heightCm);
  }

  return false;
}

function roundScaledAmount(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.round(value * 100) / 100;
}

function formatDimension(value: number) {
  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(value);
}

function roundDimension(value: number) {
  return Math.round(value * 10) / 10;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
