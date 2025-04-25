'use client';

import type React from 'react';

import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Lock,
  Loader2,
  Smartphone,
  Maximize,
  X,
  Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isActive: boolean;
}

interface BrowserNavbarProps {
  url: string;
}

export function BrowserPreview({ url }: BrowserNavbarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState({ mode: 'desktop', fullscreen: false });

  return (
    <div
      className={`h-full w-full ${
        state.fullscreen ? 'fixed inset-0 z-50 bg-background p-4' : ''
      }`}
    >
      <div
        className={`h-full w-full flex flex-col ${
          state.fullscreen ? 'border rounded-lg' : ''
        }`}
      >
        {/* Navigation Bar */}
        <div className="flex w-full border-b bg-muted/40 items-center gap-1 p-1">
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled
                    className="h-8 w-8"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Back</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled
                    className="h-8 w-8"
                    aria-label="Go forward"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Forward</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isLoading}
                    className="h-8 w-8"
                    aria-label="Refresh page"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="relative flex-1">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
              <Lock className="h-3.5 w-3.5 text-green-600" />
            </div>
            <Input
              type="url"
              value={url}
              className="h-8 bg-background pl-8 pr-20"
              placeholder="Search or enter website name"
            />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="More options"
                  onClick={() =>
                    setState({
                      ...state,
                      mode: state.mode === 'desktop' ? 'mobile' : 'desktop',
                    })
                  }
                >
                  {state.mode === 'desktop' ? (
                    <Smartphone className="h-4 w-4" />
                  ) : (
                    <Monitor className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Switch to {state.mode === 'desktop' ? 'Mobile' : 'Desktop'}
                Mode
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setState({ ...state, fullscreen: !state.fullscreen })
                  }
                >
                  {state.fullscreen ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Full Screen</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div
          className={`flex-1 ${
            state.mode === 'mobile' ? 'w-80 m-auto' : 'w-full'
          }`}
        >
          {url ? (
            <iframe
              className={`h-full w-full border-none m-0 p-0`}
              src={url}
              frameBorder="0"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full w-full bg-muted/40">
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-6">
                    <div className="inline-block relative w-16 h-16">
                      <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-blue-400 mb-2">
                    Loading Preview
                    <span className="text-blue-300">...</span>
                  </h2>
                  <div className="mt-6 w-64 mx-auto">
                    <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full animate-pulse-subtle origin-left"
                        style={{ width: '80%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
