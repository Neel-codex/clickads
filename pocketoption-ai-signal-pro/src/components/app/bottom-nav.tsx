'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LineChart, History, Star, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/app', label: 'Home', icon: LayoutDashboard },
  { href: '/app/markets', label: 'Markets', icon: LineChart },
  { href: '/app/history', label: 'History', icon: History },
  { href: '/app/favorites', label: 'Favorites', icon: Star },
  { href: '/app/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-safe">
      <div className="pointer-events-auto mx-auto mb-2 flex w-[calc(100%-1.5rem)] max-w-md items-center justify-around rounded-2xl border border-white/10 bg-card/80 px-2 py-2 backdrop-blur-2xl shadow-2xl shadow-black/40">
        {items.map((item) => {
          const active =
            item.href === '/app'
              ? pathname === '/app'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <item.icon className={cn('size-5', active && 'drop-shadow-[0_0_8px_hsl(var(--primary))]')} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
