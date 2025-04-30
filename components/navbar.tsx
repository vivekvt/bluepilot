'use client';

import React from 'react';
import { appConfig } from '../lib/config';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User, Mail, Settings, LogOut, Folder } from 'lucide-react';
import { createClient } from '../lib/supabase/client';
import { redirect } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './sidebar';
import { AuroraText } from '@/src/components/magicui/aurora-text';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="container flex items-center justify-between py-4">
      <h1 className="text-xl font-bold">
        <Link href="/">{appConfig.title}</Link>
      </h1>
      <nav className="flex items-center gap-2">
        <ThemeToggle />
        {user ? (
          <Sidebar />
        ) : (
          <Button size="sm" asChild>
            <Link href="/auth">Sign in</Link>
          </Button>
        )}
      </nav>
    </header>
  );
}
