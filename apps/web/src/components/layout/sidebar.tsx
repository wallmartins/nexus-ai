'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  FileText,
  BarChart3,
  FlaskConical,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Chat', href: '/chat', icon: MessageSquare },
  { label: 'Documents', href: '/documents', icon: FileText },
  { label: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { label: 'Evaluations', href: '/evaluations', icon: FlaskConical },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-md bg-surface-2 text-text-secondary lg:hidden"
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r border-border-subtle bg-surface-1 transition-transform duration-base ease-emphasized lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-border-subtle px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-2 text-sm font-semibold text-brand-lime">
            NX
          </div>
          <span className="text-sm font-semibold text-text-primary">
            Nexus AI
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main navigation">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-lime text-bg-canvas'
                    : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2">
                  <Icon size={16} className={active ? 'text-bg-canvas' : 'text-text-secondary'} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border-subtle px-5 py-4">
          <p className="text-xs text-text-muted">v0.1.0</p>
        </div>
      </aside>
    </>
  );
}
