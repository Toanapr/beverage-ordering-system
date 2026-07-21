import { Coffee } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" to="/" aria-label="Mộc - Trang chủ">
      <span className="brand-mark"><Coffee size={compact ? 19 : 22} weight="fill" /></span>
      {!compact && <span>Mộc</span>}
    </Link>
  );
}
