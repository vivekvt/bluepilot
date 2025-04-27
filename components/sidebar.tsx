'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Folders, User, LogOut, Moon, Sun, Plus, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface SidebarProps {
  side?: 'left' | 'right';
}

export default function Sidebar({ side = 'right' }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const { user, setUser } = useAuth();
  const client = createClient();

  const handleLogout = async () => {
    await client.auth.signOut();
    setUser(null);
    redirect('/auth');
  };

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
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)}>
        <Menu />
      </Button>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side={side}
          className="p-0 w-[260px] h-full flex flex-col overflow-y-scroll"
        >
          <SheetHeader className="p-3 border-b">
            <SheetTitle className="text-left">
              <Link href="/">{appConfig.title}</Link>
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col flex-1">
            <div className="flex flex-col flex-1 px-3 gap-2">
              <Link href="/new-project" onClick={() => setIsOpen(false)}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <Plus className="mr-2 h-4 w-4" /> New Project
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
                    <span className="mr-2">{item.icon}</span> {item.label}
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
                        <Sun className="h-4 w-4 hidden dark:inline" />
                        <Moon className="h-4 w-4 dark:hidden" />
                        <span className="hidden dark:inline">Light Mode</span>
                        <span className="dark:hidden">Dark Mode</span>
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle theme</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex flex-col mt-auto p-3 gap-3">
              {user && (
                <Link href="/profile">
                  <div className="cursor-pointer border flex items-center gap-2 hover:bg-muted rounded-lg p-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.user_metadata?.avatar_url}
                        alt={user.user_metadata?.name || user.email || 'User'}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {<User className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                      {user.user_metadata?.name && (
                        <p className="font-medium truncate">
                          {user.user_metadata.name}
                        </p>
                      )}
                      {user.email && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )}
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
                      You'll need to sign in again to access your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout}>
                      Yes, logout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
