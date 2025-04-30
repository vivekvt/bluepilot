'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowRightIcon,
  Code,
  Heart,
  Loader2,
  Rocket,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { appConfig } from '@/lib/config';
import { NeonGradientCard } from '@/components/magicui/neon-gradient-card';
import { AnimatedGridPattern } from '@/components/magicui/animated-grid-pattern';
import Navbar from '@/components/navbar';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { AuroraText } from '@/src/components/magicui/aurora-text';
import { AnimatedShinyText } from '@/src/components/magicui/animated-shiny-text';
import { DotPattern } from '@/src/components/magicui/dot-pattern';
import { createClient } from '@/lib/supabase/client';

export default function LandingPage() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    try {
      setLoading(true);
      if (!user) {
        alert('Please log in to create a project.');
        router.push(`/auth`);
        return;
      }

      const { data } = await axios.post('/api/project', { prompt });
      if (!data?.project?.id) {
        throw new Error('Project creation failed');
      }
      router.push(`/projects/${data?.project?.id}`);
    } catch (error: any) {
      setLoading(false);
      alert(
        error?.response?.data?.message ||
          'Project creation failed. Please try again.'
      );
    }
  };

  return (
    <div className="relative">
      <Navbar />
      <main className="relative h-[calc(100vh-64px)] min-h-[400px] flex-1 flex flex-col items-center justify-center container max-w-5xl">
        <AnimatedGridPattern
          numSquares={0}
          maxOpacity={0.1}
          duration={3}
          repeatDelay={1}
          className={cn(
            '[mask-image:radial-gradient(350px_circle_at_center,white,transparent)] opacity-50',
            'inset-x-0 nh-[100%]'
          )}
        />
        <a
          href="https://github.com/vivekvt/bluepilot"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div
            className={cn(
              'group rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800 mb-4'
            )}
          >
            <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
              <span>✨ Open Source - Star on GitHub</span>
              <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
            </AnimatedShinyText>
          </div>
        </a>
        <div className="text-center gap-4 flex flex-col mb-8">
          <h1 className="text-4xl font-bold tracking-tighter md:text-5xl lg:text-7xl">
            <AuroraText>AI Powered</AuroraText> Website Builder
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Describe your idea. Get a complete, ready-to-deploy website in
            minutes
          </p>
        </div>

        <div className="w-full max-w-2xl">
          <NeonGradientCard>
            <div className="p-3 bg-background rounded-2xl">
              <textarea
                rows={2}
                maxLength={200}
                placeholder="Describe the website you want to create..."
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 w-full px-2 p-1 border-0 bg-background resize-none focus:outline-none focus:ring-0 focus:ring-offset-0"
              />

              <Button
                disabled={loading}
                onClick={handleGenerate}
                className="gap-2 w-full mt-2"
              >
                {loading ? (
                  <>
                    Generating... <Loader2 className="animate-spin w-4 h-4" />
                  </>
                ) : (
                  <>
                    Generate <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </NeonGradientCard>
        </div>
      </main>
      <section className="container py-12">
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            {
              icon: <Sparkles className="h-8 w-8 text-primary" />,
              title: 'AI-Powered',
              description:
                'AI understands your requirements and generates optimized code.',
            },
            {
              icon: <Code className="h-8 w-8 text-primary" />,
              title: 'Complete Code',
              description:
                'Get full code that you can download and use right away.',
            },
            {
              icon: <ArrowRight className="h-8 w-8 text-primary" />,
              title: 'Instant Preview',
              description:
                'See your website come to life in real-time as the AI generates it.',
            },
            {
              icon: <Rocket className="h-8 w-8 text-primary" />,
              title: 'One-Click Deploy',
              description:
                'Deploy your project instantly with a single click to the web.',
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-4"
            >
              <div className="mb-4 p-3 rounded-full bg-primary/10">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-sm text-muted-foreground mb-4 md:mb-0">
              © 2025 {appConfig?.title}. All rights reserved.
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex gap-2 md:gap-4">
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
          </div>
          <div className="justify-center flex items-center gap-1 text-sm mt-4 sm:mt-0 sm:ml-6 text-muted-foreground">
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
      </footer>
    </div>
  );
}
