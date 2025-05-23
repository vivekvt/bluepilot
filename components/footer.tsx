import React from 'react';
import { Button } from './ui/button';
import { appConfig } from '@/lib/config';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="pb-8 pt-2">
      <div className="mx-auto px-4 max-w-screen-xl">
        <div className="flex items-center gap-4 justify-center mb-1 md:mb-4">
          <div className="flex gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-gray-200 dark:hover:bg-gray-800"
            >
              Home
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-gray-200 dark:hover:bg-gray-800"
            >
              Terms
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-gray-200 dark:hover:bg-gray-800"
            >
              Privacy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-gray-200 dark:hover:bg-gray-800"
            >
              Contact
            </Button>
          </div>
        </div>
        <div className="justify-center flex items-center flex-col">
          <div className="text-sm text-muted-foreground">
            © 2025 {appConfig?.title}. All rights reserved.
          </div>
          <div className="justify-center flex items-center gap-1 text-sm text-muted-foreground mt-1">
            Made with{' '}
            <Heart className="h-4 w-4 text-red-500 fill-red-500 animate-pulse" />{' '}
            by{' '}
            <a
              href="https://www.vivekthakur.dev/"
              className="hover:underline font-medium"
            >
              Vivek Thakur
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
