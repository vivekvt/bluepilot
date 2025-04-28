'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
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
      <AnimatedGridPattern
        numSquares={0}
        maxOpacity={0.2}
        duration={3}
        repeatDelay={1}
        className={cn(
          '[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]',
          'inset-x-0 h-[100%]'
        )}
      />
      <main className="h-[calc(100vh-56px)] min-h-[500px] flex-1 flex flex-col items-center justify-center container max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            AI Powered Website Builder
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Describe your idea. Get a complete, ready-to-deploy website in
            minutes
          </p>
        </div>

        <div className="w-full max-w-2xl">
          <NeonGradientCard>
            <div className="p-3 bg-background rounded-3xl">
              <Input
                placeholder="Describe the website you want to create..."
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
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
