import { describe, expect, it } from 'vitest';
import {
  calculateIngredientUnitPrice,
  calculateQuote,
  calculateRecipeIngredientsCost,
  roundPrice
} from './calculations';
import { createSampleData } from './sampleData';
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

  it('ma spójny katalog startowy składników i przepisów', () => {
    const data = createSampleData('2026-01-01T00:00:00.000Z');

    expect(data.ingredients.length).toBeGreaterThanOrEqual(30);
    expect(data.recipes).toHaveLength(11);
    expect(data.recipes.map((sampleRecipe) => sampleRecipe.name)).toEqual([
      'Sernik nowojorski (przepis II)',
      'Sernik z mango',
      'Sernik z lemon curd',
      'Domowa szarlotka z budyniem',
      'Szarlotka z jabłek prażonych',
      'Szarlotka spod samiuśkich Tater',
      'Bezmączne ciasto czekoladowe',
      'Ciasto czekoladowe',
      'Kruche ciasto z malinami i lekką budyniową pianką',
      'Mini serniczki z truskawkami',
      'Ciasto marchewkowe, najlepsze'
    ]);

    data.recipes.forEach((sampleRecipe) => {
      const cost = calculateRecipeIngredientsCost(sampleRecipe, data.ingredients);
      expect(cost.errors, sampleRecipe.name).toHaveLength(0);
      expect(cost.total, sampleRecipe.name).toBeGreaterThan(0);
    });
  });
});
