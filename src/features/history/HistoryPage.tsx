import { History, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { Money } from '../../components/Money';
import { formatDate } from '../../lib/format';
import type { QuoteHistoryItem } from '../../lib/types';

type HistoryPageProps = {
  history: QuoteHistoryItem[];
  onDelete: (itemId: string) => void;
};

export function HistoryPage({ history, onDelete }: HistoryPageProps) {
  const [deleteTarget, setDeleteTarget] = useState<QuoteHistoryItem | null>(null);
  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [history]
  );

  return (
    <div className="pageStack">
      <section className="pageHeader">
        <div>
          <p className="eyebrow">Zapisane kalkulacje</p>
          <h1>Historia wycen</h1>
        </div>
      </section>

      {sortedHistory.length === 0 ? (
        <EmptyState icon={<History size={34} />} title="Brak zapisanych wycen" />
      ) : (
        <div className="listGrid">
          {sortedHistory.map((item) => (
            <article className="listItem" key={item.id}>
              <div className="listItemMain">
                <h2>{item.recipeName}</h2>
                <p>{formatDate(item.date)}</p>
                <div className="miniMetrics">
                  <span>
                    Koszt: <Money value={item.result.totalCost} />
                  </span>
                  <span>
                    Cena: <Money value={item.result.suggestedPrice} rounded />
                  </span>
                  <span>
                    Zysk: <Money value={item.result.profitValue} />
                  </span>
                </div>
              </div>
              <div className="itemActions">
                <button
                  className="iconButton danger"
                  type="button"
                  title="Usuń wpis"
                  onClick={() => setDeleteTarget(item)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Usunąć wycenę?"
        message={`Wpis „${deleteTarget?.recipeName ?? ''}” zostanie usunięty z historii.`}
        confirmLabel="Usuń"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDelete(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
