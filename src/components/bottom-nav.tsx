'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, BarChart3, Info } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/about', label: 'About', icon: Info },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/60 glass-nav shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
      {/* Safe area spacer for notched phones */}
      <div className="flex items-center justify-around px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 min-w-[56px] min-h-[48px] rounded-xl transition-all duration-200 tap-scale ${
                isActive
                  ? 'text-orange-600 font-semibold'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <item.icon
                className={`h-5 w-5 transition-all duration-200 ${
                  isActive ? 'animate-subtle-bounce stroke-[2.5]' : 'stroke-[1.8]'
                }`}
              />
              <span
                className={`text-[10px] leading-tight ${
                  isActive ? 'font-bold text-orange-600' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-b-full bg-gradient-to-r from-orange-400 to-orange-600" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
