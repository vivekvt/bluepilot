'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu,
  X,
  Home,
  FolderPlus,
  Folders,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { appConfig } from '@/lib/config';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (newValue: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  const closeDrawer = () => {
    setIsOpen(false);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40 transition-opacity duration-300"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-[220px] bg-background border-r shadow-lg transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-3 border-b">
            <Link href="/" className="text-xl font-bold" onClick={closeDrawer}>
              {appConfig.title}
            </Link>
            <Button variant="ghost" size="icon" onClick={closeDrawer}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>

          <nav className="flex-1 overflow-auto p-2">
            <ul className="space-y-1">
              <li>
                <Link
                  href="/"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={closeDrawer}
                >
                  <FolderPlus className="h-4 w-4" />
                  New Project
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={closeDrawer}
                >
                  <Home className="h-4 w-4" />
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/projects"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={closeDrawer}
                >
                  <Folders className="h-4 w-4" />
                  Projects
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={closeDrawer}
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={closeDrawer}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </li>
            </ul>
          </nav>

          <div className="border-t p-2 space-y-1">
            <button
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={toggleTheme}
            >
              <span className="flex items-center gap-2">
                {mounted && theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                {mounted && theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>
            <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
