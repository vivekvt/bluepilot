'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Loader2, Github } from 'lucide-react';
import { ShineBorder } from '@/components/magicui/shine-border';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/navbar';
import { Provider } from '@supabase/supabase-js';

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState({
    github: false,
    google: false,
  });

  const handleSignIn = async (provider: Provider) => {
    try {
      setIsLoading((prev) => ({ ...prev, [provider]: true }));
      const client = createClient();
      const { error } = await client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
    } finally {
      setIsLoading((prev) => ({ ...prev, [provider]: false }));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="relative w-full max-w-sm mx-auto shadow-lg">
          <ShineBorder shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']} />
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => handleSignIn('github')}
              disabled={isLoading.github || isLoading.google}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 py-5"
            >
              {isLoading.github ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <Github className="w-5 h-5" />
              )}
              {isLoading.github ? 'Connecting...' : 'Continue with GitHub'}
            </Button>

            <Button
              onClick={() => handleSignIn('google')}
              disabled={isLoading.github || isLoading.google}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 py-5"
            >
              {isLoading.google ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <GoogleIcon />
              )}
              {isLoading.google ? 'Connecting...' : 'Continue with Google'}
            </Button>
          </CardContent>
          <CardFooter className="justify-center text-sm text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// Google icon component since it's not included in lucide-react
function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z" />
    </svg>
  );
}
