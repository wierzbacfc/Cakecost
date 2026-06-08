import { calculateIngredientUnitPrice } from './calculations';
import type { AppData, AppSettings, Ingredient, Recipe, Unit } from './types';

export const recipeSeedVersion = 'moje-wypieki-links-2026-06-08';

export const defaultSettings: AppSettings = {
  defaultHourlyRate: 40,
  defaultSafetyMarginPercent: 10,
  defaultProfitMode: 'fixed',
  defaultProfitPercent: 30,
  defaultProfitFixed: 80,
  defaultEnergyBakingHourlyCost: 5,
  defaultEnergyActivityHourlyCost: 2,
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
  almonds: 'sample-almonds',
  digestiveCookies: 'sample-digestive-cookies',
  sourCream: 'sample-sour-cream',
  vanillaExtract: 'sample-vanilla-extract',
  lemonJuice: 'sample-lemon-juice',
  yolks: 'sample-yolks',
  mangoPuree: 'sample-mango-puree',
  pomegranate: 'sample-pomegranate',
  roastedApples: 'sample-roasted-apples',
  salt: 'sample-salt',
  espresso: 'sample-espresso',
  baileys: 'sample-baileys',
  cream36: 'sample-cream-36',
  dessertChocolate: 'sample-dessert-chocolate'
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

export function mergeSampleCatalog(
  data: AppData,
  now = new Date().toISOString(),
  options: { replaceRecipes?: boolean } = {}
): AppData {
  const catalog = createSampleCatalog(now);
  const existingIngredientIds = new Set(data.ingredients.map((ingredient) => ingredient.id));
  const existingRecipeIds = new Set(data.recipes.map((recipe) => recipe.id));

  return {
    ...data,
    ingredients: [
      ...data.ingredients,
      ...catalog.ingredients.filter((ingredient) => !existingIngredientIds.has(ingredient.id))
    ],
    recipes: options.replaceRecipes
      ? catalog.recipes
      : [
          ...data.recipes,
          ...catalog.recipes.filter((recipe) => !existingRecipeIds.has(recipe.id))
        ]
  };
}

function createSampleCatalog(now: string): Pick<AppData, 'ingredients' | 'recipes'> {
  return {
    ingredients: createSampleIngredients(now),
    recipes: createMojeWypiekiRecipes(now)
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
    createIngredient(ingredientIds.pudding, 'Budyń śmietankowy w proszku', 3, 40, 'g', now),
    createIngredient(ingredientIds.potatoFlour, 'Skrobia ziemniaczana', 6, 500, 'g', now),
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
    createIngredient(ingredientIds.almonds, 'Migdały płatki', 10, 100, 'g', now),
    createIngredient(ingredientIds.digestiveCookies, 'Ciastka digestive', 8, 200, 'g', now),
    createIngredient(ingredientIds.sourCream, 'Kwaśna śmietana 18%', 4, 400, 'ml', now),
    createIngredient(ingredientIds.vanillaExtract, 'Ekstrakt z wanilii', 12, 30, 'ml', now),
    createIngredient(ingredientIds.lemonJuice, 'Sok z cytryny', 5, 200, 'ml', now),
    createIngredient(ingredientIds.yolks, 'Żółtka', 12, 10, 'szt', now),
    createIngredient(ingredientIds.mangoPuree, 'Puree z mango', 12, 850, 'g', now),
    createIngredient(ingredientIds.pomegranate, 'Ziarenka granatu', 8, 100, 'g', now),
    createIngredient(ingredientIds.roastedApples, 'Jabłka prażone', 10, 900, 'g', now),
    createIngredient(ingredientIds.salt, 'Sól', 2, 1, 'kg', now),
    createIngredient(ingredientIds.espresso, 'Espresso', 2, 60, 'ml', now),
    createIngredient(ingredientIds.baileys, 'Likier Baileys', 60, 700, 'ml', now),
    createIngredient(ingredientIds.cream36, 'Śmietanka kremówka 36%', 9, 500, 'ml', now),
    createIngredient(ingredientIds.dessertChocolate, 'Czekolada deserowa', 6, 100, 'g', now)
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

function createMojeWypiekiRecipes(now: string): Recipe[] {
  return [
    createRecipe(
      now,
      'mojewypieki-sernik-nowojorski-przepis-ii',
      'Sernik nowojorski (przepis II)',
      'tortownica 23 cm',
      12,
      1900,
      45,
      55,
      15,
      20,
      [
        { ingredientId: ingredientIds.digestiveCookies, amount: 150, unit: 'g' },
        { ingredientId: ingredientIds.butter, amount: 50, unit: 'g' },
        { ingredientId: ingredientIds.curd, amount: 900, unit: 'g' },
        { ingredientId: ingredientIds.sugar, amount: 262, unit: 'g' },
        { ingredientId: ingredientIds.vanillaExtract, amount: 7.5, unit: 'ml' },
        { ingredientId: ingredientIds.lemon, amount: 1, unit: 'szt' },
        { ingredientId: ingredientIds.lemonJuice, amount: 17.5, unit: 'ml' },
        { ingredientId: ingredientIds.eggs, amount: 3, unit: 'szt' },
        { ingredientId: ingredientIds.yolks, amount: 1, unit: 'szt' },
        { ingredientId: ingredientIds.sourCream, amount: 420, unit: 'ml' },
        { ingredientId: ingredientIds.flour, amount: 27, unit: 'g' }
      ],
      [
        'Źródło: Moje Wypieki, https://mojewypieki.com/przepis/sernik-nowojorski-przepis-ii',
        'Oryginalne składniki:',
        'Spód: 150 g ciastek digestive lub pełnoziarnistych; 50 g roztopionego masła.',
        'Masa serowa: 900 g twarogu lub serka typu philadelphia; 250 g drobnego cukru; 1,5 łyżeczki ekstraktu z wanilii; skórka z 1 cytryny; 1,5 łyżeczki soku z cytryny; 3 duże jajka; 1 żółtko; 200 ml kwaśnej śmietany 18%; 3 łyżki mąki pszennej.',
        'Polewa: 220 ml kwaśnej śmietany 18%; 1 łyżka drobnego cukru; 2 łyżeczki soku z cytryny.',
        'Czasy ze źródła: chłodzenie spodu 30 min, pieczenie 10 min w 180°C + 45 min lub dłużej w 110°C, studzenie w piekarniku 1 h, chłodzenie minimum 12 h.'
      ]
    ),
    createRecipe(
      now,
      'mojewypieki-sernik-z-mango',
      'Sernik z mango',
      'tortownica 23 cm',
      12,
      1900,
      45,
      88,
      20,
      20,
      [
        { ingredientId: ingredientIds.digestiveCookies, amount: 160, unit: 'g' },
        { ingredientId: ingredientIds.butter, amount: 50, unit: 'g' },
        { ingredientId: ingredientIds.mangoPuree, amount: 430, unit: 'g' },
        { ingredientId: ingredientIds.curd, amount: 800, unit: 'g' },
        { ingredientId: ingredientIds.sugar, amount: 180, unit: 'g' },
        { ingredientId: ingredientIds.eggs, amount: 6, unit: 'szt' },
        { ingredientId: ingredientIds.lemonJuice, amount: 20, unit: 'ml' },
        { ingredientId: ingredientIds.flour, amount: 18, unit: 'g' },
        { ingredientId: ingredientIds.potatoFlour, amount: 11, unit: 'g' },
        { ingredientId: ingredientIds.mascarpone, amount: 125, unit: 'g' },
        { ingredientId: ingredientIds.cream36, amount: 100, unit: 'ml' },
        { ingredientId: ingredientIds.pomegranate, amount: 50, unit: 'g' }
      ],
      [
        'Źródło: Moje Wypieki, https://mojewypieki.com/przepis/sernik-z-mango-2',
        'Oryginalne składniki:',
        'Spód: 160 g ciastek digestive lub zbożowych; 50 g roztopionego masła.',
        'Masa serowa: 400 g puree z mango; 800 g twarogu lub serka typu philadelphia; 180 g drobnego cukru; 6 dużych jajek; 20 ml soku z cytryny; 2 łyżki mąki pszennej; 1 łyżka skrobi ziemniaczanej.',
        'Krem: 125 g mascarpone; 100 ml śmietanki kremówki 36%; 30 g puree z mango; ziarenka granatu do posypania.',
        'Czasy ze źródła: podpieczenie spodu ok. 8 min w 180°C, pieczenie sernika ok. 1 h 20 min w 160°C, chłodzenie w lodówce ok. 12 h.'
      ]
    ),
    createRecipe(
      now,
      'mojewypieki-domowa-szarlotka-z-budyniem',
      'Domowa szarlotka z budyniem',
      'blacha 34 x 23 cm',
      16,
      2600,
      70,
      55,
      10,
      25,
      [
        { ingredientId: ingredientIds.flour, amount: 400, unit: 'g' },
        { ingredientId: ingredientIds.butter, amount: 250, unit: 'g' },
        { ingredientId: ingredientIds.bakingPowder, amount: 5, unit: 'g' },
        { ingredientId: ingredientIds.powderedSugar, amount: 56, unit: 'g' },
        { ingredientId: ingredientIds.yolks, amount: 5, unit: 'szt' },
        { ingredientId: ingredientIds.apples, amount: 1300, unit: 'g' },
        { ingredientId: ingredientIds.sugar, amount: 24, unit: 'g' },
        { ingredientId: ingredientIds.lemon, amount: 1, unit: 'szt' },
        { ingredientId: ingredientIds.cinnamon, amount: 3, unit: 'g' },
        { ingredientId: ingredientIds.potatoFlour, amount: 18, unit: 'g' },
        { ingredientId: ingredientIds.pudding, amount: 80, unit: 'g' },
        { ingredientId: ingredientIds.milk, amount: 1, unit: 'l' }
      ],
      [
        'Źródło: Moje Wypieki, https://mojewypieki.com/przepis/domowa-szarlotka-z-budyniem',
        'Oryginalne składniki:',
        'Kruche ciasto: 2,5 szklanki mąki pszennej; 250 g zimnego masła; 1 łyżeczka proszku do pieczenia; 3 łyżki cukru pudru; 5 żółtek.',
        'Nadzienie jabłkowe: 1,3 kg jabłek; 2 łyżki cukru; sok z 1 małej cytryny; 1 łyżeczka cynamonu; 1,5 łyżki skrobi ziemniaczanej.',
        'Budyń: 2 opakowania budyniu śmietankowego z cukrem, każde na 500 ml mleka; 1 litr mleka. Ponadto: cukier puder do oprószenia.',
        'Czasy ze źródła: mrożenie ciasta bez dokładnej długości, podpieczenie spodu 15-17 min w 180°C, pieczenie całości 35-40 min w 180°C.'
      ]
    ),
    createRecipe(
      now,
      'mojewypieki-szarlotka-z-jablek-prazonych',
      'Szarlotka z jabłek prażonych',
      'blacha 22 x 32 cm',
      16,
      2600,
      35,
      60,
      5,
      20,
      [
        { ingredientId: ingredientIds.flour, amount: 450, unit: 'g' },
        { ingredientId: ingredientIds.bakingPowder, amount: 5, unit: 'g' },
        { ingredientId: ingredientIds.butter, amount: 230, unit: 'g' },
        { ingredientId: ingredientIds.powderedSugar, amount: 100, unit: 'g' },
        { ingredientId: ingredientIds.eggs, amount: 1, unit: 'szt' },
        { ingredientId: ingredientIds.salt, amount: 1, unit: 'g' },
        { ingredientId: ingredientIds.roastedApples, amount: 1800, unit: 'g' },
        { ingredientId: ingredientIds.cinnamon, amount: 3, unit: 'g' }
      ],
      [
        'Źródło: Moje Wypieki, https://mojewypieki.com/przepis/szarlotka-z-jablek-prazonych',
        'Oryginalne składniki:',
        'Kruche ciasto: 450 g mąki pszennej; 1 łyżeczka proszku do pieczenia; 230 g zimnego masła; 100 g cukru pudru; 1 jajko; szczypta soli.',
        'Ponadto: 2 słoiki jabłek prażonych, każdy ok. 900 g; opcjonalnie cynamon do smaku.',
        'Czasy ze źródła: schłodzenie ciasta w lodówce 30 min, pieczenie ok. 60 min w 175-180°C.'
      ]
    ),
    createRecipe(
      now,
      'mojewypieki-szarlotka-spod-samiuskich-tater',
      'Szarlotka spod samiuśkich Tater',
      'blacha 25 x 40 cm',
      20,
      3600,
      80,
      75,
      10,
      30,
      [
        { ingredientId: ingredientIds.flour, amount: 500, unit: 'g' },
        { ingredientId: ingredientIds.butter, amount: 250, unit: 'g' },
        { ingredientId: ingredientIds.powderedSugar, amount: 70, unit: 'g' },
        { ingredientId: ingredientIds.bakingPowder, amount: 10, unit: 'g' },
        { ingredientId: ingredientIds.yolks, amount: 2, unit: 'szt' },
        { ingredientId: ingredientIds.sourCream, amount: 30, unit: 'ml' },
        { ingredientId: ingredientIds.apples, amount: 2500, unit: 'g' },
        { ingredientId: ingredientIds.cinnamon, amount: 9, unit: 'g' },
        { ingredientId: ingredientIds.sugar, amount: 50, unit: 'g' },
        { ingredientId: ingredientIds.breadcrumbs, amount: 16, unit: 'g' }
      ],
      [
        'Źródło: Moje Wypieki, https://mojewypieki.com/przepis/szarlotka-spod-samiuskich-tater',
        'Oryginalne składniki:',
        'Kruche ciasto: 500 g mąki pszennej; 250 g zimnego masła; 70 g cukru pudru; 2 łyżeczki proszku do pieczenia; 2 żółtka z dużych jajek; 2 łyżki kwaśnej śmietany 18%.',
        'Nadzienie: 2,5-3 kg jabłek odmiany szarlotkowej; 3 łyżeczki cynamonu; cukier do smaku, ok. 1/4 szklanki. Ponadto: 2 łyżki bułki tartej.',
        'Czasy ze źródła: chłodzenie ciasta ok. 2 h, podpieczenie spodu 10-15 min w 175°C, pieczenie całości ok. 1 h w 170°C.'
      ]
    ),
    createRecipe(
      now,
      'mojewypieki-bezmaczne-ciasto-czekoladowe',
      'Bezmączne ciasto czekoladowe',
      'tortownica 23 cm',
      12,
      1400,
      45,
      55,
      15,
      20,
      [
        { ingredientId: ingredientIds.chocolate, amount: 375, unit: 'g' },
        { ingredientId: ingredientIds.espresso, amount: 60, unit: 'ml' },
        { ingredientId: ingredientIds.baileys, amount: 75, unit: 'ml' },
        { ingredientId: ingredientIds.eggs, amount: 4, unit: 'szt' },
        { ingredientId: ingredientIds.sugar, amount: 125, unit: 'g' },
        { ingredientId: ingredientIds.cream36, amount: 435, unit: 'ml' },
        { ingredientId: ingredientIds.sugar, amount: 55, unit: 'g' },
        { ingredientId: ingredientIds.vanillaExtract, amount: 5, unit: 'ml' },
        { ingredientId: ingredientIds.powderedSugar, amount: 12, unit: 'g' },
        { ingredientId: ingredientIds.strawberries, amount: 100, unit: 'g' }
      ],
      [
        'Źródło: Moje Wypieki, https://mojewypieki.com/przepis/bezmaczne-ciasto-czekoladowe2',
        'Oryginalne składniki:',
        'Ciasto: 375 g gorzkiej czekolady; 60 ml espresso; 3 łyżki likieru Baileys; 4 duże jajka; 125 g cukru; 185 ml śmietany kremówki 36%; 55 g drobnego cukru; 1 łyżeczka ekstraktu z wanilii.',
        'Dodatki: 250 ml śmietany kremówki 36%; 1 łyżka cukru pudru; 2 łyżki likieru Baileys; 100 g truskawek.',
        'Czasy ze źródła: pieczenie w kąpieli wodnej 50-60 min w 180°C, chłodzenie w lodówce przez noc.'
      ]
    ),
    createRecipe(
      now,
      'mojewypieki-ciasto-czekoladowe',
      'Ciasto czekoladowe',
      'blacha 34 x 23 cm',
      16,
      1900,
      40,
      40,
      10,
      20,
      [
        { ingredientId: ingredientIds.butter, amount: 120, unit: 'g' },
        { ingredientId: ingredientIds.sugar, amount: 330, unit: 'g' },
        { ingredientId: ingredientIds.eggs, amount: 2, unit: 'szt' },
        { ingredientId: ingredientIds.vanillaExtract, amount: 5, unit: 'ml' },
        { ingredientId: ingredientIds.chocolate, amount: 110, unit: 'g' },
        { ingredientId: ingredientIds.flour, amount: 260, unit: 'g' },
        { ingredientId: ingredientIds.cocoa, amount: 35, unit: 'g' },
        { ingredientId: ingredientIds.bakingPowder, amount: 10, unit: 'g' },
        { ingredientId: ingredientIds.milk, amount: 375, unit: 'ml' },
        { ingredientId: ingredientIds.cream, amount: 120, unit: 'ml' },
        { ingredientId: ingredientIds.dessertChocolate, amount: 140, unit: 'g' }
      ],
      [
        'Źródło: Moje Wypieki, https://mojewypieki.com/przepis/ciasto-czekoladowe',
        'Oryginalne składniki:',
        'Ciasto: 120 g masła; 1,5 szklanki drobnego cukru do wypieków; 2 duże jajka; 1 łyżeczka ekstraktu z wanilii; 110 g gorzkiej czekolady; 260 g mąki pszennej; 35 g kakao; 2 łyżeczki proszku do pieczenia; 1,5 szklanki mleka.',
        'Polewa: 120 ml śmietany kremówki 30% lub 36%; 140 g czekolady deserowej.',
        'Czasy ze źródła: pieczenie ok. 40 min lub dłużej w 165°C; stężenie polewy bez podanej długości.'
      ]
    )
  ];
}

function createRecipe(
  now: string,
  id: string,
  name: string,
  formSize: string,
  servings: number,
  finalWeightGrams: number,
  preparationTimeMinutes: number,
  bakingTimeMinutes: number,
  decorationTimeMinutes: number,
  cleaningTimeMinutes: number,
  ingredients: Recipe['ingredients'],
  descriptionLines: string[]
): Recipe {
  return {
    id,
    name,
    category: 'ciasto',
    description: descriptionLines.join('\n'),
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
