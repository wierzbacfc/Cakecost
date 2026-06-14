import { describe, expect, it } from 'vitest';
import {
  createRecipeDraftFromGemini,
  matchIngredientByName,
  normalizeGeminiRecipe
} from './geminiRecipeImport';
import type { Ingredient } from './types';

const ingredients: Ingredient[] = [
  createIngredient('flour', 'Maka pszenna', 'kg'),
  createIngredient('sugar', 'Cukier', 'kg'),
  createIngredient('powdered-sugar', 'Cukier puder', 'g'),
  createIngredient('butter', 'Maslo', 'g')
];

describe('geminiRecipeImport', () => {
  it('matches the most specific ingredient name', () => {
    expect(matchIngredientByName('cukier puder', ingredients)).toBe('powdered-sugar');
    expect(matchIngredientByName('drobny cukier', ingredients)).toBe('sugar');
  });

  it('normalizes extracted recipes and validates suggested ingredient ids', () => {
    const recipe = normalizeGeminiRecipe(
      {
        name: 'Sernik',
        category: 'tort',
        description: 'Opis',
        formSize: 'tortownica 24 cm',
        panType: 'round',
        panDiameterCm: 24,
        panWidthCm: 0,
        panHeightCm: 0,
        servings: 12,
        finalWeightGrams: 1800,
        preparationTimeMinutes: 30,
        bakingTimeMinutes: 60,
        decorationTimeMinutes: 15,
        cleaningTimeMinutes: 10,
        instructions: ['Wymieszaj.', 'Upiecz.'],
        ingredients: [
          {
            name: 'cukier puder',
            amount: 120,
            unit: 'g',
            originalAmountText: '120 g cukru pudru',
            suggestedIngredientId: 'missing-id',
            confidence: 'high',
            notes: ''
          }
        ],
        warnings: ['Sprawdz temperature pieczenia.']
      },
      ingredients
    );

    expect(recipe.category).toBe('tort');
    expect(recipe.ingredients[0].suggestedIngredientId).toBe('powdered-sugar');
    expect(recipe.instructions).toHaveLength(2);
  });

  it('creates an editable recipe draft from mapped ingredients', () => {
    const extracted = normalizeGeminiRecipe(
      {
        name: 'Ciasto testowe',
        category: 'ciasto',
        description: '',
        formSize: '24 cm',
        panType: 'round',
        panDiameterCm: 24,
        panWidthCm: 0,
        panHeightCm: 0,
        servings: 10,
        finalWeightGrams: 900,
        preparationTimeMinutes: 20,
        bakingTimeMinutes: 40,
        decorationTimeMinutes: 0,
        cleaningTimeMinutes: 10,
        instructions: [],
        ingredients: [
          {
            name: 'maka',
            amount: 250,
            unit: 'g',
            originalAmountText: '250 g maki',
            suggestedIngredientId: '',
            confidence: 'medium',
            notes: ''
          }
        ],
        warnings: []
      },
      ingredients
    );

    const draft = createRecipeDraftFromGemini(extracted, { 0: 'flour' }, {
      type: 'text',
      value: 'test'
    });

    expect(draft.name).toBe('Ciasto testowe');
    expect(draft.pan).toEqual({ type: 'round', diameterCm: 24 });
    expect(draft.ingredients).toEqual([{ ingredientId: 'flour', amount: 250, unit: 'g' }]);
  });
});

function createIngredient(id: string, name: string, unit: Ingredient['unit']): Ingredient {
  return {
    id,
    name,
    packagePrice: 1,
    packageAmount: 1,
    unit,
    unitPrice: 1,
    updatedAt: '2026-06-13T00:00:00.000Z'
  };
}
