'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Folders, User, LogOut, Moon, Sun, Plus, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { appConfig } from '@/lib/config';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  side?: 'left' | 'right';
}

export default function Sidebar({ side = 'right' }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { user, setUser } = useAuth();
  const client = createClient();

  const handleLogout = async () => {
    await client.auth.signOut();
    setUser(null);
    redirect('/auth');
  };

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const navigationItems = [
    {
      href: '/projects',
      icon: <Folders className="h-4 w-4" />,
      label: 'Projects',
    },
    { href: '/profile', icon: <User className="h-4 w-4" />, label: 'Profile' },
  ];

  return (
    <Sheet>
      <SheetTrigger>
        <Button variant="outline" size="sm">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side={side} className="p-0 w-[260px] h-full flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="text-left">
            <Link href="/">{appConfig.title}</Link>
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col flex-1">
          <div className="flex flex-col flex-1 px-3 gap-2">
            <Link href="/" onClick={() => setIsOpen(false)}>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start"
              >
                <Plus /> New Project
              </Button>
            </Link>
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                onClick={() => setIsOpen(false)}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  {item.icon} {item.label}
                </Button>
              </Link>
            ))}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={toggleTheme}
                    size="sm"
                  >
                    <span className="flex items-center gap-2">
                      {mounted && theme === 'dark' ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                      {mounted && theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle theme</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="border- mt-auto p-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full justify-start"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Are you sure you want to logout?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    You’ll need to sign in again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLogout}
                    className="text-red-500 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Yes, logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
