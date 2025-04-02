'use client';

import { useEffect, useRef } from 'react';
// import * as monaco from 'monaco-editor';
import MonacoEditor from '@monaco-editor/react';
import { cn } from '@/lib/utils';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  className?: string;
  readOnly?: boolean;
}

export function Editor({
  value,
  onChange,
  language = 'javascript',
  className,
  readOnly = false,
}: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <MonacoEditor
        className={cn('w-full h-full overflow-hidden', className)}
        defaultLanguage={language}
        defaultValue={value}
        onChange={(newValue: string = '') => onChange(newValue || '')}
      />
    </>
  );
}

function getFileExtension(filename: string) {
  if (!filename) return '';

  // Handle cases where filename might be a path
  const basename = filename.split('/').pop();

  // Get the part after the last dot
  const parts = basename?.split('.');
  if (parts?.length === 1) return ''; // No extension

  return parts?.pop()?.toLowerCase();
}

export const getLanguageForFile = (filename: string) => {
  const extension = getFileExtension(filename);
  switch (extension) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'sh':
      return 'shell';
    case 'sql':
      return 'sql';
    default:
      return 'text';
  }
};
