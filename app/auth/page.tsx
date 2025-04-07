'use client';

import type React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Github } from 'lucide-react';
import { ShineBorder } from '@/components/magicui/shine-border';
import { createClient } from '@/lib/supabase/client';

export default function AuthPage() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      const client = createClient();
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <Card className="relative w-full max-w-sm mx-auto text-center">
        <ShineBorder shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']} />
        <CardHeader>
          <CardTitle>{'Login'}</CardTitle>
          <CardDescription className="mt-4">
            Login with your GitHub account to access the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )} */}

          <Button
            onClick={handleSignIn}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2 mx-auto"
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <Github className="w-5 h-5" />
            )}

            {loading ? 'Loading...' : 'Sign in with GitHub'}
          </Button>
        </CardContent>
        {/* <CardFooter className="flex justify-center">
          {otpSent && (
            <Button
              variant="link"
              onClick={() => {
                setOtpSent(false);
                setUserId(null);
              }}
            >
              Use a different email
            </Button>
          )}
        </CardFooter> */}
      </Card>
    </div>
  );
}
