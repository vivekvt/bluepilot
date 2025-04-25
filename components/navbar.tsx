'use client';

import React from 'react';
import { appConfig } from '../lib/config';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import Link from 'next/link';
import { User, Mail, Settings, LogOut, Folder } from 'lucide-react';
import { createClient } from '../lib/supabase/client';
import { redirect } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './sidebar';

export default function Navbar() {
  const { user, setUser } = useAuth();
  const client = createClient();

  const handleLogout = async () => {
    await client.auth.signOut();
    setUser(null);
    redirect('/auth');
  };

  return (
    <header className="container flex items-center justify-between py-3">
      <h1 className="text-xl font-bold">
        <Link href="/">{appConfig.title}</Link>
      </h1>
      <nav className="flex items-center gap-2">
        <ThemeToggle />
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Sidebar />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuItem>
                <Mail /> {user.email}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/projects">
                  <Folder />
                  Projects
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-red-500 hover:bg-red-600 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut />
                    Logout
                  </DropdownMenuItem>
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
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button size="sm" asChild>
            <Link href="/auth">Sign in</Link>
          </Button>
        )}
      </nav>
    </header>
  );
}
