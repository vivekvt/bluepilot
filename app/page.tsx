import {
  ArrowRight,
  ArrowRightIcon,
  Code,
  Rocket,
  Sparkles,
} from 'lucide-react';
import { AnimatedGridPattern } from '@/components/magicui/animated-grid-pattern';
import Navbar from '@/components/navbar';
import { cn } from '@/lib/utils';
import { AuroraText } from '@/components/magicui/aurora-text';
import { AnimatedShinyText } from '@/components/magicui/animated-shiny-text';
import NewProjectForm from '@/components/new-project-form';
import Footer from '@/components/footer';

export default function LandingPage() {
  return (
    <div className="relative">
      <Navbar />
      <main className="relative h-[calc(100vh-64px)] min-h-96 flex-1 flex flex-col items-center justify-center mx-auto max-w-5xl px-4">
        <AnimatedGridPattern
          numSquares={0}
          maxOpacity={0.1}
          duration={3}
          repeatDelay={1}
          className={cn(
            '[mask-image:radial-gradient(350px_circle_at_center,white,transparent)] opacity-70',
            'inset-x-0 h-full'
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
              <span>✨ Open Source</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                className="w-4 h-4 fill-current mx-1.5"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>Give a Star</span>
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
          <NewProjectForm />
        </div>
      </main>
      <section className="mx-auto px-4 py-12 max-w-screen-xl">
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

      <Footer />
    </div>
  );
}
