import { z } from 'zod';

export const stepsSchema = z.object({
  action: z
    .enum(['create', 'update', 'delete', 'run'])
    .describe('The action to perform'),
  path: z
    .string()
    .describe(
      'File path (e.g., "/src/App.tsx" or "/src/utils/api.ts") for create/update/delete, or command (e.g., "npm install", "npm install nanoid", "npm run dev") for run'
    ),
  content: z
    .string()
    .optional()
    .describe('File content for create/update; omitted for delete/run'),
});
