import { calculateIngredientUnitPrice } from './calculations';
import type { AppData, AppSettings, Ingredient, Recipe, Unit } from './types';

export const defaultSettings: AppSettings = {
  defaultHourlyRate: 40,
  defaultSafetyMarginPercent: 10,
  defaultProfitMode: 'fixed',
  defaultProfitPercent: 30,
  defaultProfitFixed: 80,
  defaultEnergyCost: 5,
  defaultDeliveryCost: 20,
  defaultRoundTo: 5
};

const ingredientIds = {
  flour: 'sample-flour',
  sugar: 'sample-sugar',
  butter: 'sample-butter',
  eggs: 'sample-eggs',
  mascarpone: 'sample-mascarpone',
  cream: 'sample-cream',
  chocolate: 'sample-chocolate',
  curd: 'sample-curd',
  cocoa: 'sample-cocoa',
  bakingPowder: 'sample-baking-powder',
  vanillaSugar: 'sample-vanilla-sugar',
  apples: 'sample-apples',
  cinnamon: 'sample-cinnamon',
  breadcrumbs: 'sample-breadcrumbs',
  poppySeed: 'sample-poppy-seed',
  honey: 'sample-honey',
  yeast: 'sample-yeast',
  raisins: 'sample-raisins',
  walnuts: 'sample-walnuts',
  powderedSugar: 'sample-powdered-sugar',
  milk: 'sample-milk',
  pudding: 'sample-pudding',
  potatoFlour: 'sample-potato-flour',
  carrots: 'sample-carrots',
  oil: 'sample-oil',
  bakingSoda: 'sample-baking-soda',
  gingerbreadSpice: 'sample-gingerbread-spice',
  creamCheese: 'sample-cream-cheese',
  strawberries: 'sample-strawberries',
  raspberries: 'sample-raspberries',
  cherries: 'sample-cherries',
  cherryJam: 'sample-cherry-jam',
  gelatin: 'sample-gelatin',
  lemon: 'sample-lemon',
  meringue: 'sample-meringue',
  almonds: 'sample-almonds'
};

export function createSampleData(now = new Date().toISOString()): AppData {
  const catalog = createSampleCatalog(now);

  return {
    ingredients: catalog.ingredients,
    recipes: catalog.recipes,
    history: [],
    settings: { ...defaultSettings }
  };
}

export function createEmptyData(): AppData {
  return {
    ingredients: [],
    recipes: [],
    history: [],
    settings: { ...defaultSettings }
  };
}

export function mergeSampleCatalog(data: AppData, now = new Date().toISOString()): AppData {
  const catalog = createSampleCatalog(now);
  const existingIngredientIds = new Set(data.ingredients.map((ingredient) => ingredient.id));
  const existingRecipeIds = new Set(data.recipes.map((recipe) => recipe.id));

  return {
    ...data,
    ingredients: [
      ...data.ingredients,
      ...catalog.ingredients.filter((ingredient) => !existingIngredientIds.has(ingredient.id))
    ],
    recipes: [
      ...data.recipes,
      ...catalog.recipes.filter((recipe) => !existingRecipeIds.has(recipe.id))
    ]
  };
}

function createSampleCatalog(now: string): Pick<AppData, 'ingredients' | 'recipes'> {
  return {
    ingredients: createSampleIngredients(now),
    recipes: createSampleRecipes(now)
  };
}

function createSampleIngredients(now: string): Ingredient[] {
  return [
    createIngredient(ingredientIds.flour, 'Mąka pszenna', 5, 1, 'kg', now),
    createIngredient(ingredientIds.sugar, 'Cukier', 5, 1, 'kg', now),
    createIngredient(ingredientIds.butter, 'Masło', 9, 200, 'g', now),
    createIngredient(ingredientIds.eggs, 'Jajka', 12, 10, 'szt', now),
    createIngredient(ingredientIds.mascarpone, 'Mascarpone', 14, 250, 'g', now),
    createIngredient(ingredientIds.cream, 'Śmietanka 30%', 8, 500, 'ml', now),
    createIngredient(ingredientIds.chocolate, 'Czekolada gorzka', 6, 100, 'g', now),
    createIngredient(ingredientIds.curd, 'Twaróg sernikowy', 17, 1, 'kg', now),
    createIngredient(ingredientIds.cocoa, 'Kakao', 7, 100, 'g', now),
    createIngredient(ingredientIds.bakingPowder, 'Proszek do pieczenia', 2, 30, 'g', now),
    createIngredient(ingredientIds.vanillaSugar, 'Cukier wanilinowy', 2, 32, 'g', now),
    createIngredient(ingredientIds.apples, 'Jabłka', 6, 1, 'kg', now),
    createIngredient(ingredientIds.cinnamon, 'Cynamon', 4, 20, 'g', now),
    createIngredient(ingredientIds.breadcrumbs, 'Bułka tarta', 4, 500, 'g', now),
    createIngredient(ingredientIds.poppySeed, 'Mak mielony', 18, 500, 'g', now),
    createIngredient(ingredientIds.honey, 'Miód', 18, 400, 'g', now),
    createIngredient(ingredientIds.yeast, 'Drożdże świeże', 3, 100, 'g', now),
    createIngredient(ingredientIds.raisins, 'Rodzynki', 9, 200, 'g', now),
    createIngredient(ingredientIds.walnuts, 'Orzechy włoskie', 16, 200, 'g', now),
    createIngredient(ingredientIds.powderedSugar, 'Cukier puder', 5, 400, 'g', now),
    createIngredient(ingredientIds.milk, 'Mleko', 4, 1, 'l', now),
    createIngredient(ingredientIds.pudding, 'Budyń waniliowy', 3, 40, 'g', now),
    createIngredient(ingredientIds.potatoFlour, 'Mąka ziemniaczana', 6, 500, 'g', now),
    createIngredient(ingredientIds.carrots, 'Marchew', 4, 1, 'kg', now),
    createIngredient(ingredientIds.oil, 'Olej rzepakowy', 11, 1, 'l', now),
    createIngredient(ingredientIds.bakingSoda, 'Soda oczyszczona', 3, 80, 'g', now),
    createIngredient(ingredientIds.gingerbreadSpice, 'Przyprawa do piernika', 4, 40, 'g', now),
    createIngredient(ingredientIds.creamCheese, 'Serek śmietankowy', 8, 200, 'g', now),
    createIngredient(ingredientIds.strawberries, 'Truskawki', 14, 500, 'g', now),
    createIngredient(ingredientIds.raspberries, 'Maliny', 16, 500, 'g', now),
    createIngredient(ingredientIds.cherries, 'Wiśnie', 12, 500, 'g', now),
    createIngredient(ingredientIds.cherryJam, 'Dżem wiśniowy', 8, 300, 'g', now),
    createIngredient(ingredientIds.gelatin, 'Żelatyna', 5, 50, 'g', now),
    createIngredient(ingredientIds.lemon, 'Cytryna', 3, 1, 'szt', now),
    createIngredient(ingredientIds.meringue, 'Beza gotowa', 18, 1, 'szt', now),
    createIngredient(ingredientIds.almonds, 'Migdały płatki', 10, 100, 'g', now)
  ];
}

function createIngredient(
  id: string,
  name: string,
  packagePrice: number,
  packageAmount: number,
  unit: Unit,
  updatedAt: string
): Ingredient {
  return {
    id,
    name,
    packagePrice,
    packageAmount,
    unit,
    unitPrice: calculateIngredientUnitPrice(packagePrice, packageAmount, unit),
    updatedAt
  };
}

function createSampleRecipes(now: string): Recipe[] {
  return [
    {
      id: 'sample-cheesecake',
      name: 'Sernik klasyczny 24 cm',
      category: 'ciasto',
      description: 'Domowy sernik z masła, twarogu i kruchej nuty.',
      formSize: '24 cm',
      servings: 12,
      finalWeightGrams: 1800,
      preparationTimeMinutes: 45,
      bakingTimeMinutes: 60,
      decorationTimeMinutes: 15,
      cleaningTimeMinutes: 20,
      ingredients: [
        { ingredientId: ingredientIds.curd, amount: 1000, unit: 'g' },
        { ingredientId: ingredientIds.eggs, amount: 5, unit: 'szt' },
        { ingredientId: ingredientIds.sugar, amount: 180, unit: 'g' },
        { ingredientId: ingredientIds.butter, amount: 100, unit: 'g' },
        { ingredientId: ingredientIds.flour, amount: 40, unit: 'g' }
      ],
      createdAt: now,
      updatedAt: now
    },
    createRecipe(now, 'sample-apple-pie', 'Szarlotka domowa 25x35', 'ciasto', 'blacha 25x35', 16, 2100, 55, 50, 10, 25, [
      { ingredientId: ingredientIds.flour, amount: 450, unit: 'g' },
      { ingredientId: ingredientIds.butter, amount: 250, unit: 'g' },
      { ingredientId: ingredientIds.eggs, amount: 2, unit: 'szt' },
      { ingredientId: ingredientIds.sugar, amount: 180, unit: 'g' },
      { ingredientId: ingredientIds.apples, amount: 1800, unit: 'g' },
      { ingredientId: ingredientIds.cinnamon, amount: 8, unit: 'g' },
      { ingredientId: ingredientIds.breadcrumbs, amount: 40, unit: 'g' }
    ]),
    createRecipe(now, 'sample-poppy-seed-roll', 'Makowiec zawijany', 'ciasto', '2 rolady', 20, 1900, 80, 45, 15, 30, [
      { ingredientId: ingredientIds.flour, amount: 500, unit: 'g' },
      { ingredientId: ingredientIds.yeast, amount: 40, unit: 'g' },
      { ingredientId: ingredientIds.milk, amount: 250, unit: 'ml' },
      { ingredientId: ingredientIds.butter, amount: 120, unit: 'g' },
      { ingredientId: ingredientIds.eggs, amount: 3, unit: 'szt' },
      { ingredientId: ingredientIds.sugar, amount: 160, unit: 'g' },
      { ingredientId: ingredientIds.poppySeed, amount: 600, unit: 'g' },
      { ingredientId: ingredientIds.honey, amount: 120, unit: 'g' },
      { ingredientId: ingredientIds.raisins, amount: 120, unit: 'g' },
      { ingredientId: ingredientIds.walnuts, amount: 80, unit: 'g' }
    ]),
    createRecipe(now, 'sample-gingerbread', 'Piernik staropolski', 'ciasto', 'keksówka', 14, 1400, 45, 55, 20, 20, [
      { ingredientId: ingredientIds.flour, amount: 420, unit: 'g' },
      { ingredientId: ingredientIds.honey, amount: 250, unit: 'g' },
      { ingredientId: ingredientIds.sugar, amount: 160, unit: 'g' },
      { ingredientId: ingredientIds.butter, amount: 120, unit: 'g' },
      { ingredientId: ingredientIds.eggs, amount: 3, unit: 'szt' },
      { ingredientId: ingredientIds.cocoa, amount: 30, unit: 'g' },
      { ingredientId: ingredientIds.bakingSoda, amount: 8, unit: 'g' },
      { ingredientId: ingredientIds.gingerbreadSpice, amount: 25, unit: 'g' },
      { ingredientId: ingredientIds.cherryJam, amount: 200, unit: 'g' }
    ]),
    createRecipe(now, 'sample-karpatka', 'Karpatka', 'ciasto', 'blacha 25x35', 16, 1600, 65, 35, 20, 25, [
      { ingredientId: ingredientIds.flour, amount: 220, unit: 'g' },
      { ingredientId: ingredientIds.butter, amount: 300, unit: 'g' },
      { ingredientId: ingredientIds.eggs, amount: 6, unit: 'szt' },
      { ingredientId: ingredientIds.milk, amount: 750, unit: 'ml' },
      { ingredientId: ingredientIds.sugar, amount: 160, unit: 'g' },
      { ingredientId: ingredientIds.pudding, amount: 80, unit: 'g' },
      { ingredientId: ingredientIds.powderedSugar, amount: 30, unit: 'g' }
    ]),
    createRecipe(now, 'sample-wuzetka', 'Wuzetka', 'ciasto', 'blacha 25x35', 18, 1800, 60, 35, 30, 25, [
      { ingredientId: ingredientIds.flour, amount: 280, unit: 'g' },
      { ingredientId: ingredientIds.eggs, amount: 6, unit: 'szt' },
      { ingredientId: ingredientIds.sugar, amount: 260, unit: 'g' },
      { ingredientId: ingredientIds.cocoa, amount: 55, unit: 'g' },
      { ingredientId: ingredientIds.bakingPowder, amount: 10, unit: 'g' },
      { ingredientId: ingredientIds.cream, amount: 1000, unit: 'ml' },
      { ingredientId: ingredientIds.gelatin, amount: 20, unit: 'g' },
      { ingredientId: ingredientIds.cherryJam, amount: 280, unit: 'g' },
      { ingredientId: ingredientIds.chocolate, amount: 150, unit: 'g' }
    ]),
    createRecipe(now, 'sample-carrot-cake', 'Ciasto marchewkowe', 'ciasto', '24 cm', 12, 1500, 45, 45, 25, 20, [
      { ingredientId: ingredientIds.flour, amount: 300, unit: 'g' },
      { ingredientId: ingredientIds.carrots, amount: 450, unit: 'g' },
      { ingredientId: ingredientIds.eggs, amount: 4, unit: 'szt' },
      { ingredientId: ingredientIds.sugar, amount: 220, unit: 'g' },
      { ingredientId: ingredientIds.oil, amount: 220, unit: 'ml' },
      { ingredientId: ingredientIds.bakingPowder, amount: 12, unit: 'g' },
      { ingredientId: ingredientIds.bakingSoda, amount: 6, unit: 'g' },
      { ingredientId: ingredientIds.cinnamon, amount: 10, unit: 'g' },
      { ingredientId: ingredientIds.walnuts, amount: 120, unit: 'g' },
      { ingredientId: ingredientIds.creamCheese, amount: 300, unit: 'g' },
      { ingredientId: ingredientIds.powderedSugar, amount: 120, unit: 'g' }
    ]),
    createRecipe(now, 'sample-chocolate-cake', 'Tort czekoladowy 20 cm', 'tort', '20 cm', 12, 2200, 75, 40, 90, 30, [
      { ingredientId: ingredientIds.flour, amount: 260, unit: 'g' },
      { ingredientId: ingredientIds.eggs, amount: 6, unit: 'szt' },
      { ingredientId: ingredientIds.sugar, amount: 280, unit: 'g' },
      { ingredientId: ingredientIds.cocoa, amount: 70, unit: 'g' },
      { ingredientId: ingredientIds.bakingPowder, amount: 12, unit: 'g' },
      { ingredientId: ingredientIds.cream, amount: 800, unit: 'ml' },
      { ingredientId: ingredientIds.mascarpone, amount: 500, unit: 'g' },
      { ingredientId: ingredientIds.chocolate, amount: 300, unit: 'g' },
      { ingredientId: ingredientIds.butter, amount: 100, unit: 'g' }
    ]),
    createRecipe(now, 'sample-strawberry-cream-cake', 'Tort śmietankowo-truskawkowy 22 cm', 'tort', '22 cm', 14, 2400, 70, 35, 85, 30, [
      { ingredientId: ingredientIds.flour, amount: 220, unit: 'g' },
      { ingredientId: ingredientIds.potatoFlour, amount: 60, unit: 'g' },
      { ingredientId: ingredientIds.eggs, amount: 7, unit: 'szt' },
      { ingredientId: ingredientIds.sugar, amount: 260, unit: 'g' },
      { ingredientId: ingredientIds.cream, amount: 1000, unit: 'ml' },
      { ingredientId: ingredientIds.mascarpone, amount: 500, unit: 'g' },
      { ingredientId: ingredientIds.strawberries, amount: 900, unit: 'g' },
      { ingredientId: ingredientIds.gelatin, amount: 18, unit: 'g' },
      { ingredientId: ingredientIds.lemon, amount: 1, unit: 'szt' }
    ]),
    createRecipe(now, 'sample-raspberry-meringue-cake', 'Tort bezowy z malinami', 'tort', '24 cm', 10, 1300, 55, 90, 45, 25, [
      { ingredientId: ingredientIds.meringue, amount: 2, unit: 'szt' },
      { ingredientId: ingredientIds.cream, amount: 600, unit: 'ml' },
      { ingredientId: ingredientIds.mascarpone, amount: 250, unit: 'g' },
      { ingredientId: ingredientIds.powderedSugar, amount: 80, unit: 'g' },
      { ingredientId: ingredientIds.raspberries, amount: 500, unit: 'g' },
      { ingredientId: ingredientIds.almonds, amount: 60, unit: 'g' },
      { ingredientId: ingredientIds.lemon, amount: 1, unit: 'szt' }
    ])
  ];
}

function createRecipe(
  now: string,
  id: string,
  name: string,
  category: Recipe['category'],
  formSize: string,
  servings: number,
  finalWeightGrams: number,
  preparationTimeMinutes: number,
  bakingTimeMinutes: number,
  decorationTimeMinutes: number,
  cleaningTimeMinutes: number,
  ingredients: Recipe['ingredients']
): Recipe {
  return {
    id,
    name,
    category,
    description: '',
    formSize,
    servings,
    finalWeightGrams,
    preparationTimeMinutes,
    bakingTimeMinutes,
    decorationTimeMinutes,
    cleaningTimeMinutes,
    ingredients,
    createdAt: now,
    updatedAt: now
  };
}
