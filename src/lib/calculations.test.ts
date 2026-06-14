import { describe, expect, it } from 'vitest';
import {
  calculateIngredientUnitPrice,
  calculateQuote,
  calculateRecipeIngredientsCost,
  generateShoppingList,
  roundPrice
} from './calculations';
import { createSampleData, mergeSampleCatalog } from './sampleData';
import { normalizeAppData } from './storage';
import type { Ingredient, Recipe } from './types';

const flour: Ingredient = {
  id: 'flour',
  name: 'Mąka pszenna',
  packagePrice: 4.5,
  packageAmount: 1,
  unit: 'kg',
  unitPrice: calculateIngredientUnitPrice(4.5, 1, 'kg'),
  updatedAt: '2026-01-01T00:00:00.000Z'
};

const milk: Ingredient = {
  id: 'milk',
  name: 'Mleko',
  packagePrice: 4,
  packageAmount: 1,
  unit: 'l',
  unitPrice: calculateIngredientUnitPrice(4, 1, 'l'),
  updatedAt: '2026-01-01T00:00:00.000Z'
};

const recipe: Recipe = {
  id: 'recipe',
  name: 'Testowe ciasto',
  category: 'ciasto',
  servings: 10,
  finalWeightGrams: 1000,
  preparationTimeMinutes: 60,
  bakingTimeMinutes: 40,
  decorationTimeMinutes: 30,
  cleaningTimeMinutes: 30,
  ingredients: [{ ingredientId: 'flour', amount: 100, unit: 'g' }],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
};

describe('calculations', () => {
  it('liczy cenę jednostkową dla kg, g, l, ml i sztuk', () => {
    expect(calculateIngredientUnitPrice(4.5, 1, 'kg')).toBeCloseTo(0.0045);
    expect(calculateIngredientUnitPrice(8.99, 200, 'g')).toBeCloseTo(0.04495);
    expect(calculateIngredientUnitPrice(7.5, 0.5, 'l')).toBeCloseTo(0.015);
    expect(calculateIngredientUnitPrice(12, 10, 'szt')).toBeCloseTo(1.2);
  });

  it('zaokrągla ceny w górę według ustawień', () => {
    expect(roundPrice(246.33, 1)).toBe(247);
    expect(roundPrice(246.33, 5)).toBe(250);
    expect(roundPrice(246.33, 10)).toBe(250);
    expect(roundPrice(251.24, 10)).toBe(260);
  });

  it('zwraca błąd przy niezgodnych jednostkach', () => {
    const result = calculateRecipeIngredientsCost(
      [{ ingredientId: 'flour', amount: 200, unit: 'ml' }],
      [flour]
    );

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('Nie można przeliczyć ml na g');
  });

  it('liczy pełną wycenę z pracą, dodatkowymi kosztami, zyskiem i ceną za porcję', () => {
    const result = calculateQuote(recipe, [flour, milk], {
      recipeId: recipe.id,
      packagingCost: 10,
      extrasCost: 5,
      energyBakingHourlyCost: 5,
      energyActivityHourlyCost: 2,
      deliveryCost: 25,
      includeDelivery: false,
      hourlyRate: 30,
      safetyMarginPercent: 10,
      profitMode: 'fixed',
      profitFixed: 20,
      profitPercent: 30,
      roundTo: 5
    });

    expect(result.ingredientsCost).toBe(1);
    expect(result.energyCost).toBe(8);
    expect(result.laborCost).toBe(60);
    expect(result.baseCost).toBe(84);
    expect(result.safetyMarginValue).toBe(9);
    expect(result.totalCost).toBe(93);
    expect(result.totalEarnings).toBe(80);
    expect(result.exactPrice).toBe(113);
    expect(result.suggestedPrice).toBe(115);
    expect(result.pricePerServing).toBe(12);
    expect(result.pricePerKg).toBe(115);
  });

  it('dolicza koszt dowozu tylko po wybraniu opcji z dowozem', () => {
    const result = calculateQuote(recipe, [flour], {
      recipeId: recipe.id,
      packagingCost: 10,
      extrasCost: 5,
      energyBakingHourlyCost: 5,
      energyActivityHourlyCost: 2,
      deliveryCost: 25,
      includeDelivery: true,
      hourlyRate: 30,
      safetyMarginPercent: 10,
      profitMode: 'fixed',
      profitFixed: 20,
      profitPercent: 30,
      roundTo: 5
    });

    expect(result.deliveryCost).toBe(25);
    expect(result.energyCost).toBe(8);
    expect(result.baseCost).toBe(109);
    expect(result.safetyMarginValue).toBe(11);
    expect(result.totalCost).toBe(120);
    expect(result.suggestedPrice).toBe(140);
  });

  it('generuje listę zakupów ze zsumowanymi składnikami', () => {
    const secondRecipe: Recipe = {
      ...recipe,
      id: 'second-recipe',
      name: 'Drugie ciasto',
      ingredients: [
        { ingredientId: 'flour', amount: 0.5, unit: 'kg' },
        { ingredientId: 'milk', amount: 250, unit: 'ml' }
      ]
    };

    const result = generateShoppingList([recipe, secondRecipe], [flour, milk], [
      { recipeId: recipe.id, quantity: 2 },
      { recipeId: secondRecipe.id, quantity: 1 }
    ]);

    expect(result.selectedRecipeCount).toBe(3);
    expect(result.issues).toHaveLength(0);
    expect(result.lines).toHaveLength(2);
    expect(result.lines.find((line) => line.ingredientId === 'flour')?.amount).toBe(700);
    expect(result.lines.find((line) => line.ingredientId === 'milk')?.amount).toBe(250);
    expect(result.totalEstimatedCost).toBe(5);
  });

  it('ma spójny katalog startowy składników i przepisów', () => {
    const data = createSampleData('2026-01-01T00:00:00.000Z');

    expect(data.ingredients.length).toBeGreaterThanOrEqual(30);
    expect(data.recipes).toHaveLength(14);
    expect(data.recipes.map((sampleRecipe) => sampleRecipe.name)).toEqual([
      'Sernik nowojorski (przepis II)',
      'Sernik z mango',
      'Sernik z lemon curd',
      'Cheesecake sticks, czyli serniczki na patyku',
      'Domowa szarlotka z budyniem',
      'Szarlotka z jabłek prażonych',
      'Szarlotka spod samiuśkich Tater',
      'Bezmączne ciasto czekoladowe',
      'Ciasto czekoladowe',
      'Kruche ciasto z malinami i lekką budyniową pianką',
      'Mini serniczki z truskawkami',
      'Babeczki jogurtowe z nutką cytrynową',
      'Ciastka owsiane',
      'Ciasto marchewkowe, najlepsze'
    ]);

    data.recipes.forEach((sampleRecipe) => {
      const cost = calculateRecipeIngredientsCost(sampleRecipe, data.ingredients);
      expect(cost.errors, sampleRecipe.name).toHaveLength(0);
      expect(cost.total, sampleRecipe.name).toBeGreaterThan(0);
    });
  });

  it('nie nadpisuje lokalnie edytowanych przepisów przy aktualizacji katalogu', () => {
    const data = createSampleData('2026-01-01T00:00:00.000Z');
    const editedRecipe = {
      ...data.recipes[0],
      name: 'Mój własny sernik',
      servings: 99,
      updatedAt: '2026-02-01T00:00:00.000Z'
    };

    const merged = mergeSampleCatalog(
      {
        ...data,
        recipes: [editedRecipe, ...data.recipes.slice(1)]
      },
      '2026-03-01T00:00:00.000Z',
      { replaceRecipes: true }
    );

    expect(merged.recipes.find((item) => item.id === editedRecipe.id)?.name).toBe('Mój własny sernik');
    expect(merged.recipes.find((item) => item.id === data.recipes[1].id)?.updatedAt).toBe(
      '2026-03-01T00:00:00.000Z'
    );
  });

  it('zachowuje odhaczone produkty w zapisanych listach zakupów po normalizacji danych', () => {
    const normalized = normalizeAppData({
      shoppingLists: [
        {
          id: 'shopping-list',
          name: 'Zakupy na weekend',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          selections: [{ recipeId: 'recipe', recipeName: 'Testowe ciasto', quantity: 2 }],
          lines: [
            {
              ingredientId: 'flour',
              ingredientName: 'Mąka pszenna',
              amount: 500,
              unit: 'g',
              estimatedCost: 3,
              recipeNames: ['Testowe ciasto'],
              purchased: true
            }
          ],
          totalEstimatedCost: 3
        }
      ]
    });

    expect(normalized.shoppingLists).toHaveLength(1);
    expect(normalized.shoppingLists[0].lines[0].purchased).toBe(true);
  });
});
