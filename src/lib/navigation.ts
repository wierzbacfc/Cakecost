import {
  BookOpen,
  Calculator,
  History,
  Home,
  Package,
  Settings,
  type LucideIcon
} from 'lucide-react';

export type Page = 'home' | 'quote' | 'recipes' | 'ingredients' | 'history' | 'settings';

export type NavItem = {
  page: Page;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { page: 'home', label: 'Start', icon: Home },
  { page: 'quote', label: 'Nowa wycena', icon: Calculator },
  { page: 'recipes', label: 'Przepisy', icon: BookOpen },
  { page: 'ingredients', label: 'Składniki', icon: Package },
  { page: 'history', label: 'Historia wycen', icon: History },
  { page: 'settings', label: 'Ustawienia', icon: Settings }
];

export function getPageTitle(page: Page) {
  return navItems.find((item) => item.page === page)?.label ?? 'CakeCost';
}
