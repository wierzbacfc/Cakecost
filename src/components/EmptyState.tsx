import type { ReactNode } from 'react';

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ icon, title, children, action }: EmptyStateProps) {
  return (
    <div className="emptyState">
      {icon ? <div className="emptyStateIcon">{icon}</div> : null}
      <h2>{title}</h2>
      {children ? <p>{children}</p> : null}
      {action ? <div className="emptyStateAction">{action}</div> : null}
    </div>
  );
}
