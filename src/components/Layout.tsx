import type { ReactNode } from 'react';
import { getPageTitle, navItems, type Page } from '../lib/navigation';

type LayoutProps = {
  activePage: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
  toast?: string;
};

export function Layout({ activePage, onNavigate, children, toast }: LayoutProps) {
  return (
    <div className="appShell">
      <header className="topBar">
        <button className="brand" type="button" onClick={() => onNavigate('home')}>
          <span className="brandMark" aria-hidden="true">
            <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" className="brandIcon" />
          </span>
          <span>
            <strong>CakeCost</strong>
            <small>{getPageTitle(activePage)}</small>
          </span>
        </button>
        <nav className="topNav" aria-label="Główna nawigacja">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.page}
                className={item.page === activePage ? 'navButton active' : 'navButton'}
                type="button"
                aria-current={item.page === activePage ? 'page' : undefined}
                title={item.label}
                onClick={() => onNavigate(item.page)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mainContent">{children}</main>

      <nav className="bottomNav" aria-label="Nawigacja mobilna">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.page}
              className={item.page === activePage ? 'bottomNavButton active' : 'bottomNavButton'}
              type="button"
              aria-current={item.page === activePage ? 'page' : undefined}
              title={item.label}
              onClick={() => onNavigate(item.page)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
