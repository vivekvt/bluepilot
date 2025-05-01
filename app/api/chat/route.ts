import { streamObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { PromptRole } from '@/types/message';
import { withAuth } from '@/lib/with-auth';
import { stepsSchema } from '@/lib/utils/steps';

const googleModel = google('gemini-2.0-flash');

export const POST = withAuth(async (req: Request) => {
  const messages = await req.json();

  const allMessages: any = [...getReactBasePrompts(), ...messages];

  const result = streamObject({
    model: googleModel,
    output: 'array',
    system: bluepilotSystemPrompt,
    schema: stepsSchema,
    messages: allMessages,
  });

  return result.toTextStreamResponse();
});

const bluepilotSystemPrompt = `You are BluePilot, an elite AI assistant and world-class senior React developer specializing in creating stunning, modern web experiences. Your output combines technical excellence with exceptional design sensibility.

### Instructions:
- **Project Context**: Use the provided list of project files and their contents as the baseline. This is a React Vite starter template with TypeScript, Tailwind CSS, ESLint, and Lucide React for icons.
- **Output Format**: Return a JSON array of objects, where each object is a step. Steps are ordered by their position in the array (first step is index 0). Each step must follow this schema:
  {
    "action": "create" | "update" | "delete" | "run", // The action to perform
    "path": string, // File path (e.g., "/src/App.tsx") for create/update/delete, or command (e.g., "npm install", "npm install nanoid", "npm run dev") for run
    "content": string | "", // File content for create/update; omitted for delete/run
  }

### Design Excellence:
- **Visual Hierarchy**: Create designs with clear visual hierarchy using size, color, spacing, and typography to guide the user's attention.
- **Typography**: Use font combinations that create contrast (e.g., serif headings with sans-serif body text). Implement proper text scaling with rem/em units.
- **Color Theory**: Apply harmonious color schemes with proper contrast. Use HSL color format in Tailwind (e.g., \`bg-[hsl(210,100%,50%)]\`) for sophisticated color manipulation.
- **Spacing & Layout**: Implement consistent spacing using Tailwind's spacing scale. Create balanced layouts with proper whitespace and breathing room.
- **Animation & Transitions**: Add subtle animations and transitions to improve user experience (use framer-motion when appropriate).
- **Component Design**: Create reusable components with consistent styling patterns. Use composition over inheritance.
- **Responsive Design**: Build fully responsive layouts that look exceptional on all device sizes. Use Tailwind's responsive prefixes strategically.
- **Modern UI Patterns**: Implement glass morphism, neumorphism, micro-interactions, and other contemporary design techniques where appropriate.

### Technical Excellence:
- **Component Architecture**: Organize code into small, reusable components with clear separation of concerns.
- **State Management**: Use appropriate React hooks and context for state management. Consider Zustand for complex state needs.
- **Performance Optimization**: Implement code splitting, lazy loading, and other performance best practices.
- **Accessibility**: Ensure websites meet WCAG standards with proper semantic HTML, ARIA attributes, and keyboard navigation.
- **Code Quality**: Write clean, maintainable code with proper TypeScript typing and ESLint compliance.

### Visual Assets:
- Use Unsplash for high-quality images (e.g., \`https://source.unsplash.com/random/1200x600/?nature\`)
- Integrate with Lucide React icons as standard
- Create CSS gradients, patterns, and shapes for visual interest
- Consider SVG illustrations for hero sections and visual elements

### Implementation Rules:
- **Action Execution**:
  - "create": Create a file (with "content").
  - "update": Update a file's content.
  - "delete": Delete a file.
  - "run": Execute a command in "path" (e.g., "npm install", "npm run dev").
- **File Updates**: Always use the latest file contents from "File Changes" as the true state.
- **Efficiency**: Prioritize quality over brevity, but avoid unnecessary repetition.

### Libraries to Consider:
- framer-motion: For sophisticated animations
- react-intersection-observer: For scroll-based animations
- clsx or tailwind-merge: For conditional class names

First create a mental model of what a beautiful, modern website should include. Think about color schemes, layout, typography, animations, and user experience. Then execute your steps with this vision in mind.
`;

export const getReactBasePrompts = () => {
  return [
    {
      role: PromptRole.USER,
      content:
        'Project Files:\n\nThe following is a list of all project files and their complete contents that are currently visible and accessible to you.\n\neslint.config.js:\n```\nimport js from \'@eslint/js\';\nimport globals from \'globals\';\nimport reactHooks from \'eslint-plugin-react-hooks\';\nimport reactRefresh from \'eslint-plugin-react-refresh\';\nimport tseslint from \'typescript-eslint\';\n\nexport default tseslint.config(\n  { ignores: [\'dist\'] },\n  {\n    extends: [js.configs.recommended, ...tseslint.configs.recommended],\n    files: [\'**/*.{ts,tsx}\'],\n    languageOptions: {\n      ecmaVersion: 2020,\n      globals: globals.browser,\n    },\n    plugins: {\n      \'react-hooks\': reactHooks,\n      \'react-refresh\': reactRefresh,\n    },\n    rules: {\n      ...reactHooks.configs.recommended.rules,\n      \'react-refresh/only-export-components\': [\n        \'warn\',\n        { allowConstantExport: true },\n      ],\n    },\n  }\n);\n\n```\n\nindex.html:\n```\n<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <link rel="icon" type="image/svg+xml" href="/vite.svg" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>Vite + React + TS</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n\n```\n\npackage.json:\n```\n{\n  "name": "vite-react-typescript-starter",\n  "private": true,\n  "version": "0.0.0",\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build",\n    "lint": "eslint .",\n    "preview": "vite preview"\n  },\n  "dependencies": {\n    "lucide-react": "^0.344.0",\n    "react": "^18.3.1",\n    "react-dom": "^18.3.1"\n  },\n  "devDependencies": {\n    "@eslint/js": "^9.9.1",\n    "@types/react": "^18.3.5",\n    "@types/react-dom": "^18.3.0",\n    "@vitejs/plugin-react": "^4.3.1",\n    "autoprefixer": "^10.4.18",\n    "eslint": "^9.9.1",\n    "eslint-plugin-react-hooks": "^5.1.0-rc.0",\n    "eslint-plugin-react-refresh": "^0.4.11",\n    "globals": "^15.9.0",\n    "postcss": "^8.4.35",\n    "tailwindcss": "^3.4.1",\n    "typescript": "^5.5.3",\n    "typescript-eslint": "^8.3.0",\n    "vite": "^5.4.2"\n  }\n}\n\n```\n\npostcss.config.js:\n```\nexport default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n};\n\n```\n\nsrc/App.tsx:\n```\nimport React from \'react\';\n\nfunction App() {\n  return (\n    <div className="min-h-screen bg-gray-100 flex items-center justify-center">\n      <p>Blue Pilot React Starter</p>\n    </div>\n  );\n}\n\nexport default App;\n\n```\n\nsrc/index.css:\n```\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n```\n\nsrc/main.tsx:\n```\nimport { StrictMode } from \'react\';\nimport { createRoot } from \'react-dom/client\';\nimport App from \'./App.tsx\';\nimport \'./index.css\';\n\ncreateRoot(document.getElementById(\'root\')!).render(\n  <StrictMode>\n    <App />\n  </StrictMode>\n);\n\n```\n\nsrc/vite-env.d.ts:\n```\n/// <reference types="vite/client" />\n\n```\n\ntailwind.config.js:\n```\n/** @type {import(\'tailwindcss\').Config} */\nexport default {\n  content: [\'./index.html\', \'./src/**/*.{js,ts,jsx,tsx}\'],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n};\n\n```\n\ntsconfig.app.json:\n```\n{\n  "compilerOptions": {\n    "target": "ES2020",\n    "useDefineForClassFields": true,\n    "lib": ["ES2020", "DOM", "DOM.Iterable"],\n    "module": "ESNext",\n    "skipLibCheck": true,\n\n    /* Bundler mode */\n    "moduleResolution": "bundler",\n    "allowImportingTsExtensions": true,\n    "isolatedModules": true,\n    "moduleDetection": "force",\n    "noEmit": true,\n    "jsx": "react-jsx",\n\n    /* Linting */\n    "strict": true,\n    "noUnusedLocals": true,\n    "noUnusedParameters": true,\n    "noFallthroughCasesInSwitch": true\n  },\n  "include": ["src"]\n}\n\n```\n\ntsconfig.json:\n```\n{\n  "files": [],\n  "references": [\n    { "path": "./tsconfig.app.json" },\n    { "path": "./tsconfig.node.json" }\n  ]\n}\n\n```\n\ntsconfig.node.json:\n```\n{\n  "compilerOptions": {\n    "target": "ES2022",\n    "lib": ["ES2023"],\n    "module": "ESNext",\n    "skipLibCheck": true,\n\n    /* Bundler mode */\n    "moduleResolution": "bundler",\n    "allowImportingTsExtensions": true,\n    "isolatedModules": true,\n    "moduleDetection": "force",\n    "noEmit": true,\n\n    /* Linting */\n    "strict": true,\n    "noUnusedLocals": true,\n    "noUnusedParameters": true,\n    "noFallthroughCasesInSwitch": true\n  },\n  "include": ["vite.config.ts"]\n}\n\n```\n\nvite.config.ts:\n```\nimport { defineConfig } from \'vite\';\nimport react from \'@vitejs/plugin-react\';\n\n// https://vitejs.dev/config/\nexport default defineConfig({\n  plugins: [react()],\n  optimizeDeps: {\n    exclude: [\'lucide-react\'],\n  },\n});\n\n```\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json',
    },
    {
      role: PromptRole.USER,
      content:
        'For all designs I ask you to make, have them be beautiful, not cookie cutter. Make webpages that are fully featured and worthy for production.\n\nBy default, this template supports JSX syntax with Tailwind CSS classes, React hooks, and Lucide React for icons. Do not install other packages for UI themes, icons, etc unless absolutely necessary or I request them.\n\nUse icons from lucide-react for logos.\n\nUse stock photos from unsplash where appropriate, only valid URLs you know exist. Do not download the images, only link to them in image tags.',
    },
    // {
    //   role: PromptRole.USER,
    //   content: `\nCurrent Message:\n\n${userPrompt}\n\nFile Changes:\n\nHere is a list of all files that have been modified since the start of the conversation.\nThis information serves as the true contents of these files!\n\nThe contents include either the full file contents or a diff (when changes are smaller and localized).\n\nUse it to:\n - Understand the latest file modifications\n - Ensure your suggestions build upon the most recent version of the files\n - Make informed decisions about changes\n - Ensure suggestions are compatible with existing code\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - package-lock.json`,
    // },
  ];
};
