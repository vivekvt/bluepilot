import { z } from 'zod';

export const stepsSchema = z.object({
  action: z
    .enum(['explain', 'create', 'update', 'delete', 'run'])
    .describe('The action to perform'),
  path: z
    .string()
    .describe(
      'File path (e.g., "/src/App.tsx" or "/src/utils/api.ts") for create/update/delete, or command (e.g., "npm install", "npm install nanoid", "npm run dev") for run; omitted for explain'
    ),
  content: z
    .string()
    .optional()
    .describe(
      'File content for create/update; Short Explanation/Plan(max 50 words) for action=explain; omitted for delete/run'
    ),
});
