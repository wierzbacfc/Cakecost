import { Calculator, Check, Edit3, History, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { Money } from '../../components/Money';
import { formatDate } from '../../lib/format';
import { formatPanShape } from '../../lib/pans';
import type { QuoteHistoryItem } from '../../lib/types';

type HistoryPageProps = {
  history: QuoteHistoryItem[];
  onDelete: (itemId: string) => void;
  onRename: (itemId: string, quoteName: string) => void;
  onEdit: (item: QuoteHistoryItem) => void;
};

export function HistoryPage({ history, onDelete, onRename, onEdit }: HistoryPageProps) {
  const [deleteTarget, setDeleteTarget] = useState<QuoteHistoryItem | null>(null);
  const [editingId, setEditingId] = useState('');
  const [editingName, setEditingName] = useState('');
  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [history]
  );

  function startRenaming(item: QuoteHistoryItem) {
    setEditingId(item.id);
    setEditingName(item.quoteName);
  }

  function cancelRenaming() {
    setEditingId('');
    setEditingName('');
  }

  function saveRenaming(item: QuoteHistoryItem) {
    onRename(item.id, editingName);
    cancelRenaming();
  }

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
                {editingId === item.id ? (
                  <div className="historyNameEditor">
                    <input
                      value={editingName}
                      aria-label="Nazwa wyceny"
                      onChange={(event) => setEditingName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          saveRenaming(item);
                        }
                        if (event.key === 'Escape') {
                          cancelRenaming();
                        }
                      }}
                    />
                    <button
                      className="iconButton"
                      type="button"
                      title="Zapisz nazwę"
                      onClick={() => saveRenaming(item)}
                    >
                      <Check size={18} />
                    </button>
                    <button
                      className="iconButton"
                      type="button"
                      title="Anuluj"
                      onClick={cancelRenaming}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <h2>{item.quoteName}</h2>
                )}
                <p>
                  {item.recipeName} · {formatDate(item.date)}
                </p>
                <div className="miniMetrics">
                  <span className="miniMetricCost">
                    Koszt: <Money value={item.result.totalCost} />
                  </span>
                  <span className="miniMetricPrice">
                    Cena: <Money value={item.result.suggestedPrice} rounded />
                  </span>
                  <span className="miniMetricEarning">
                    Zysk: <Money value={item.result.profitValue} />
                  </span>
                  {(item.panScaleEnabled ?? item.input.panScaleEnabled) && (item.targetPan ?? item.input.targetPan) ? (
                    <span className="miniMetricPrice">
                      Foremka: {formatPanShape(item.targetPan ?? item.input.targetPan)}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="itemActions">
                <button
                  className="iconButton"
                  type="button"
                  title="Edytuj wycenę"
                  onClick={() => onEdit(item)}
                >
                  <Calculator size={18} />
                </button>
                <button
                  className="iconButton"
                  type="button"
                  title="Zmień nazwę wyceny"
                  onClick={() => startRenaming(item)}
                >
                  <Edit3 size={18} />
                </button>
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
        message={`Wpis „${deleteTarget?.quoteName ?? ''}” zostanie usunięty z historii.`}
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
