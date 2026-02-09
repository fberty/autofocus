'use client';

import { useState, useEffect, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { User, LogOut } from 'lucide-react';

export default function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session?.user) return null;

  const initials = (session.user.name || session.user.email || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-medium hover:ring-2 hover:ring-blue-300 dark:hover:ring-blue-600 transition-all"
        title={session.user.name || session.user.email || ''}
      >
        {session.user.image ? (
          <img
            src={session.user.image}
            alt=""
            className="w-9 h-9 rounded-full"
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <div className="truncate">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {session.user.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {session.user.email}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-b-lg"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
