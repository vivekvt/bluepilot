'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Code, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { appConfig } from '@/lib/config';
import { NeonGradientCard } from '@/components/magicui/neon-gradient-card';
import { AnimatedGridPattern } from '@/components/magicui/animated-grid-pattern';
import { apiClient } from '@/lib/utils/apiClient';
import { createClient } from '@/lib/supabase/client';
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
      }

      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      const { data } = await apiClient.post(
        '/api/project',
        { prompt },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!data?.project?.id) {
        throw new Error('Project creation failed');
      }
      router.push(`/chat/${data?.project?.id}`);
    } catch (error) {
      setLoading(false);
      alert('Project creation failed. Please try again.');
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navbar />
      <AnimatedGridPattern
        numSquares={0}
        maxOpacity={0.2}
        duration={3}
        repeatDelay={1}
        className={cn(
          '[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]',
          'inset-x-0  h-[100%]'
        )}
      />
      <main className="flex-1 flex flex-col items-center justify-center container max-w-5xl px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Generate Websites with AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Turn your ideas into code. Just describe what you want, and we'll
            generate a complete website for you.
          </p>
        </div>

        <div className="w-full max-w-2xl">
          <NeonGradientCard>
            <div className="p-3 bg-background rounded-3xl">
              <Input
                placeholder="Describe the website you want to create..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
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

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Sparkles className="h-8 w-8 text-primary" />,
              title: 'AI-Powered',
              description:
                'Our advanced AI understands your requirements and generates optimized code.',
            },
            {
              icon: <Code className="h-8 w-8 text-primary" />,
              title: 'Complete Code',
              description:
                'Get full code that you can download use right away.',
            },
            {
              icon: <ArrowRight className="h-8 w-8 text-primary" />,
              title: 'Instant Preview',
              description:
                'See your website come to life in real-time as the AI generates it.',
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
      </main>

      <footer className="border-tno py-6">
        <div className="container flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-muted-foreground">
            © 2025 {appConfig.title}. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Button variant="ghost" size="sm">
              Terms
            </Button>
            <Button variant="ghost" size="sm">
              Privacy
            </Button>
            <Button variant="ghost" size="sm">
              Contact
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
