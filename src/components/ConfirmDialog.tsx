import { AlertTriangle } from 'lucide-react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Potwierdź',
  cancelLabel = 'Anuluj',
  destructive,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="dialogBackdrop" role="presentation">
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="dialogIcon" aria-hidden="true">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h2 id="dialog-title">{title}</h2>
          <p>{message}</p>
        </div>
        <div className="dialogActions">
          <button className="button buttonGhost" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={destructive ? 'button buttonDanger' : 'button buttonPrimary'}
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
