import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { withAuth } from '@/lib/with-auth';
import { PromptRole } from '@/types/message';
import { createClient } from '@/lib/supabase/server';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// const googleLiteModel = google('gemini-2.0-flash-lite');
const googleModel = google('gemini-2.5-flash-preview-04-17');
const openrouterClaude35 = openrouter('anthropic/claude-3.5-sonnet');

export const POST = withAuth(async (request: Request) => {
  // Parse the request body
  const body = await request.json();
  const { prompt } = body;

  const { object } = await generateObject({
    model: openrouterClaude35, //googleModel,
    system: systemPrompt,
    schema: z.object({
      template: z
        .enum(['react-vite', 'error'])
        .describe(
          'Use "error" if the prompt is not a valid app idea or does not clearly map to a template.'
        ),
      title: z
        .string()
        .max(30)
        .optional()
        .describe(
          'A short project title, only if a valid template is selected'
        ),
    }),
    messages: [
      {
        role: PromptRole.USER,
        content: prompt,
      },
    ],
  });

  const { template, title } = object;

  if (!title || template !== 'react-vite') {
    return new Response(
      JSON.stringify({
        error: 'Invalid app request',
        message:
          'Please provide a specific website or web application idea that can be built with React.',
        status: 'validation_error',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const supabaseClient = await createClient();

  const { data: templateData, error: templateError } = await supabaseClient
    .from('templates')
    .select('files')
    .eq('title', template)
    .single();

  if (templateError) throw new Error('Failed to get the project template');

  const { data, error } = await supabaseClient
    .from('projects')
    .insert([
      {
        title,
        template,
        prompt,
        files: templateData.files, // using files from the fetched template
      },
    ])
    .select();
  const project = data?.[0];

  if (error || !project?.id) throw new Error('Failed to create project');

  const { error: messageError } = await supabaseClient.from('messages').insert([
    {
      role: PromptRole.USER,
      text: prompt,
      project_id: project.id,
    },
  ]);

  if (messageError) throw new Error('Failed to create message');

  return new Response(JSON.stringify({ project: { id: project?.id } }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
});

const systemPrompt = `You're an assistant that helps identify if a user prompt is suitable for building a website using the React-Vite template.

Supported template:
- "react-vite": for frontend web applications with UI components.

ACCEPT prompts that:
- Describe a clear web application or website idea
- Can be reasonably implemented with frontend React components
- Are specific enough to understand the purpose of the website

REJECT prompts (return "error" as template) that:
- Are vague or unclear
- Describe backend-heavy applications with minimal UI
- Request inappropriate or harmful content
- Are not related to website/web application development
- Would require technologies beyond what React-Vite can provide

Do NOT guess or force-fit a template. Your only goal is to classify valid website ideas. Return a short app title only if the template is valid.`;
