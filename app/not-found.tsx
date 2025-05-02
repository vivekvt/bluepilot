import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { appConfig } from '@/lib/config';

export default function NotFound() {
  return (
    <div className="min-h-screen  flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl mx-auto text-center">
        {/* Logo */}
        <div className="mb-8">
          <Link href="/" className="inline-block">
            <Image
              src={appConfig.logo}
              alt={appConfig.title}
              width={120}
              height={40}
              className="mx-auto"
            />
          </Link>
        </div>

        {/* Error message */}
        <h1 className="text-4xl md:text-5xl font-bold  mb-4">404</h1>
        <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
          Page Not Found
        </h2>
        <p className="mb-8 max-w-lg mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Loading indicator */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-1  rounded-full overflow-hidden">
            <div className="h-full w-full bg-blue-600 dark:bg-blue-500 origin-left animate-[loading_5s_ease-in-out_1]"></div>
          </div>
        </div>

        {/* Back to home button */}
        <Button asChild size="lg">
          <Link href="/">Return to Homepage Now</Link>
        </Button>
      </div>
    </div>
  );
}
