# CakeCost

PWA do wyceny domowych ciast, tortów i innych wypieków. Aplikacja liczy koszt składników, opakowania, dodatków, energii, pracy, zapasu bezpieczeństwa oraz zysku, a potem podpowiada cenę sprzedaży w PLN.

W interfejsie i wynikach kalkulacji kwoty są prowadzone w pełnych złotówkach, bez groszy.

## Funkcje

- baza składników z automatyczną ceną jednostkową,
- przepisy z kosztami pozycji składnikowych,
- kalkulator wyceny z kosztem pracy, zapasem i zyskiem procentowym albo kwotowym,
- cena za porcję i za kilogram, jeśli przepis ma odpowiednie dane,
- historia zapisanych wycen,
- ustawienia domyślne,
- import i eksport danych do JSON,
- localStorage jako lokalna baza danych,
- manifest PWA i service worker.

## Uruchomienie

```bash
npm install
npm run dev
```

Po starcie Vite otwórz adres pokazany w terminalu, zwykle `http://127.0.0.1:5173`.

## Weryfikacja

```bash
npm test
npm run build
```

## Dane

Przy pierwszym uruchomieniu aplikacja dodaje przykładowe składniki oraz 10 popularnych receptur: 7 ciast i 3 torty. Jeśli aplikacja była już wcześniej uruchomiona, brakujące przykładowe składniki i przepisy są dosiewane bez kasowania istniejących danych. Wszystkie późniejsze zmiany są zapisywane w `localStorage` przeglądarki.

Eksport w ustawieniach zapisuje plik JSON w formacie:

```ts
type AppDataExport = {
  version: 1;
  exportedAt: string;
  ingredients: Ingredient[];
  recipes: Recipe[];
  history: QuoteHistoryItem[];
  settings: AppSettings;
};
```
