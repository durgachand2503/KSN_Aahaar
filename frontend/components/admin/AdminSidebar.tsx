'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

/* ── Icons ── */
function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="4" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="11" width="7" height="10" rx="1" />
    </svg>
  );
}

function OrdersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" /><path d="M15 3v4a2 2 0 0 0 2 2h4" /><path d="M10 13H8" /><path d="M16 17H8" /><path d="M16 13h-2" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: DashboardIcon, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: OrdersIcon, exact: false },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAdminAuth();

  return (
    <aside className="w-64 bg-forest-dark min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center text-white font-bold text-sm">K</div>
          <div>
            <h1 className="text-white font-heading font-bold text-sm">KSN AAHAAR</h1>
            <p className="text-white/50 text-[10px] uppercase tracking-wider">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Admin Info & Logout */}
      <div className="p-3 border-t border-white/10">
        {admin && (
          <div className="px-3 py-2 mb-2">
            <p className="text-white text-xs font-medium truncate">{admin.name}</p>
            <p className="text-white/40 text-[10px] truncate">{admin.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-all"
        >
          <LogoutIcon className="w-5 h-5 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
