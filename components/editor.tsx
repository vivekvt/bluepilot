'use client';

import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { cn } from '@/lib/utils';

interface EditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
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
  const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (editorRef.current) {
      monacoRef.current = monaco.editor.create(editorRef.current, {
        value,
        language,
        theme: 'vs-dark',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        glyphMargin: false,
        folding: true,
        lineDecorationsWidth: 10,
        automaticLayout: true,
        tabSize: 2,
        readOnly,
        wordWrap: 'on',
        wrappingStrategy: 'advanced',
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible',
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
      });

      monacoRef.current.onDidChangeModelContent(() => {
        if (onChange) {
          onChange(monacoRef.current?.getValue());
        }
      });
    }

    return () => {
      monacoRef.current?.dispose();
    };
  }, []);

  // Update editor value when prop changes
  useEffect(() => {
    if (monacoRef.current) {
      const currentValue = monacoRef.current.getValue();
      if (value !== currentValue) {
        monacoRef.current.setValue(value);
      }
    }
  }, [value]);

  // Update editor language when prop changes
  useEffect(() => {
    if (monacoRef.current) {
      const model = monacoRef.current.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, language);
      }
    }
  }, [language]);

  return (
    <div
      ref={editorRef}
      className={cn('w-full h-full overflow-hidden', className)}
      style={{ position: 'relative' }}
    />
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
