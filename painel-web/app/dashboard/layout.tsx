'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { FiHome, FiPlus, FiSettings, FiGrid } from 'react-icons/fi';

const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: FiHome },
  { label: 'Cadastrar', path: '/dashboard/registrar', icon: FiPlus },
  { label: 'Geral', path: '/dashboard/geral', icon: FiGrid },
  { label: 'Configurações', path: '/dashboard/configuracoes', icon: FiSettings },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background text-text-base">
      <aside className="w-20 hover:w-64 bg-primary-dark text-white transition-all duration-300 overflow-hidden group">
        <div className="flex items-center justify-center h-16 text-lg font-bold border-b border-border">
          SCC
        </div>
        <nav className="mt-4 space-y-1">
          {menuItems.map(({ label, path, icon: Icon }) => {
            const isActive =
              path === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(path);

            return (
              <Link
                key={path}
                href={path}
                className={cn(
                  'flex items-center gap-4 px-4 py-3 text-sm font-medium transition-all duration-200',
                  'hover:bg-primary',
                  isActive ? 'bg-primary text-white' : 'text-white/70',
                  'group-hover:justify-start'
                )}
              >
                <Icon className="min-w-[20px] text-lg" />
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
