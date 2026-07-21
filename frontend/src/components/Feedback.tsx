import { ArrowClockwise, Package, WarningCircle } from '@phosphor-icons/react';

export function PageLoader({ label = 'Đang tải dữ liệu' }: { label?: string }) {
  return (
    <div className="skeleton-stack" aria-label={label} aria-busy="true">
      <div className="skeleton skeleton-title" />
      <div className="skeleton-grid">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    </div>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="state-panel state-error" role="alert">
      <WarningCircle size={28} />
      <div>
        <strong>Chưa thể tải nội dung</strong>
        <p>{message}</p>
      </div>
      {retry && (
        <button className="button button-secondary" type="button" onClick={retry}>
          <ArrowClockwise size={18} /> Thử lại
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Package size={30} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
