import { Link, useLocation } from 'react-router-dom';
import { Library, FlaskConical } from 'lucide-react';

interface Props {
  pendingCount: number;
}

export default function SiteNav({ pendingCount }: Props) {
  const { pathname } = useLocation();

  const itemClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-ochre-500 text-paper-50 shadow-paper'
        : 'text-ink-700/70 hover:text-ochre-600 hover:bg-ochre-100/60'
    }`;

  return (
    <nav className="sticky top-0 z-30 backdrop-blur-md bg-paper-50/70 border-b border-paper-200/70">
      <div className="container max-w-6xl flex items-center gap-2 py-2.5">
        <Link to="/" className={itemClass(pathname === '/')}>
          <Library className="w-4 h-4" />
          气味档案
        </Link>
        <Link to="/review" className={itemClass(pathname === '/review')}>
          <FlaskConical className="w-4 h-4" />
          复嗅复核台
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-brick-500 text-paper-50 text-[11px] font-semibold">
              {pendingCount}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
}
