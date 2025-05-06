'use client';

import React from 'react';
import { appConfig } from '../lib/config';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './sidebar';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="mx-auto w-full max-w-screen-xl px-4 py-4 flex items-center justify-between">
      <h1 className="text-xl font-bold">
        <Link href="/">{appConfig.title}</Link>
      </h1>
      <nav className="flex items-center gap-2">
        <ThemeToggle />
        {user ? (
          <Sidebar />
        ) : (
          <Button size="sm" className="cursor-pointer" asChild>
            <Link href="/auth">Sign in</Link>
          </Button>
        )}
      </nav>
    </header>
  );
}
