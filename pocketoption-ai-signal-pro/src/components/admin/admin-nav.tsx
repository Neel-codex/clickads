'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, KeyRound, Users, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/admin', label: 'Overview', icon: LayoutGrid, exact: true },
  { href: '/admin/licenses', label: 'Licenses', icon: KeyRound },
  { href: '/admin/users', label: 'Users', icon: Users },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-6 flex items-center gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-card/60 p-1.5 backdrop-blur-xl">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-brand-gradient text-white shadow-lg shadow-primary/25'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
      <Link
        href="/app"
        className="ml-auto flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> App
      </Link>
    </nav>
  );
}
