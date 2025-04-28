import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

type Handler = (req: NextRequest, context?: any) => Promise<Response>;

export function withAuth(handler: Handler): Handler {
  return async (req, context) => {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      if (!data?.user?.id) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // If authenticated, call the original handler
      return handler(req, context);
    } catch (error) {
      console.error('Error in withAuth:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}
