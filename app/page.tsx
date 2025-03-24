'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, Code, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { appConfig } from '@/src/config';
import { ShineBorder } from '@/src/components/magicui/shine-border';
import { Meteors } from '@/src/components/magicui/meteors';
import { NeonGradientCard } from '@/src/components/magicui/neon-gradient-card';

export default function LandingPage() {
  const [prompt, setPrompt] = useState('');
  const router = useRouter();

  const handleGenerate = () => {
    if (prompt.trim()) {
      router.push(`/generate?prompt=${encodeURIComponent(prompt)}`);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* <Meteors number={50} /> */}
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          {/* <Sparkles className="h-6 w-6 text-primary" /> */}
          <h1 className="text-xl font-bold">{appConfig.title}</h1>
        </div>
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="default">Sign In</Button>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center container max-w-5xl px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Generate Websites with AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Turn your ideas into code. Just describe what you want, and we'll
            generate a complete website for you.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-2xl "
        >
          <NeonGradientCard className="m-0 p-0">
            <div className="p-3 bg-card rounded-3xl">
              {/* <div className="relative flex flex-col md:flex-row gap-2 p-2 border rounded-lg bg-card shadow-sm"> */}
              {/* <ShineBorder shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']} /> */}
              <Input
                placeholder="Describe the website you want to create..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <Button onClick={handleGenerate} className="gap-2 w-full mt-2">
                Generate <ArrowRight className="h-4 w-4" />
              </Button>
              {/* </div> */}
            </div>
          </NeonGradientCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
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
                'Get production-ready HTML, CSS, and JavaScript code that you can use right away.',
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
        </motion.div>
      </main>

      <footer className="border-t py-6">
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
