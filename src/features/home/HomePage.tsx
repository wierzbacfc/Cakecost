import { BookOpen, Calculator, History, Package, Settings, ShoppingBasket } from 'lucide-react';
import type { Page } from '../../lib/navigation';

type HomePageProps = {
  ingredientCount: number;
  recipeCount: number;
  historyCount: number;
  onNavigate: (page: Page) => void;
};

const actions = [
  { page: 'quote' as const, label: 'Nowa wycena', icon: Calculator },
  { page: 'shopping' as const, label: 'Lista zakupów', icon: ShoppingBasket },
  { page: 'recipes' as const, label: 'Przepisy', icon: BookOpen },
  { page: 'ingredients' as const, label: 'Składniki', icon: Package },
  { page: 'history' as const, label: 'Historia wycen', icon: History },
  { page: 'settings' as const, label: 'Ustawienia', icon: Settings }
];

export function HomePage({
  ingredientCount,
  recipeCount,
  historyCount,
  onNavigate
}: HomePageProps) {
  return (
    <div className="pageStack">
      <section className="dashboardHeader">
        <div>
          <p className="eyebrow">Domowa pracownia</p>
          <h1>CakeCost</h1>
        </div>
        <button className="button buttonPrimary" type="button" onClick={() => onNavigate('quote')}>
          <Calculator size={20} />
          Nowa wycena
        </button>
      </section>

      <section className="statsGrid" aria-label="Podsumowanie danych">
        <article className="statTile">
          <span>Składniki</span>
          <strong>{ingredientCount}</strong>
        </article>
        <article className="statTile">
          <span>Przepisy</span>
          <strong>{recipeCount}</strong>
        </article>
        <article className="statTile">
          <span>Wyceny</span>
          <strong>{historyCount}</strong>
        </article>
      </section>

      <section className="actionGrid" aria-label="Skróty">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.page}
              className="actionTile"
              type="button"
              onClick={() => onNavigate(action.page)}
            >
              <Icon size={24} />
              <span>{action.label}</span>
            </button>
          );
        })}
      </section>
    </div>
  );
}
