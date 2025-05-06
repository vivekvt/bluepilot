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
import { Loader2 } from 'lucide-react';
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
            <Button
              onClick={() => handleSignIn('github')}
              disabled={isLoading.github || isLoading.google}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 py-5"
            >
              {isLoading.github ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <GithubIcon />
              )}
              {isLoading.github ? 'Connecting...' : 'Continue with GitHub'}
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

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      className="w-5 h-5"
    >
      <path
        fill="#EA4335"
        d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"
      />
      <path
        fill="#34A853"
        d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"
      />
      <path
        fill="#4A90E2"
        d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      className="w-5 h-5 fill-current"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
