'use client';

import { useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { cn } from '@/lib/utils';
import { SelectedFileInfo } from './chat';
import { FileSystemTree } from '@webcontainer/api';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  className?: string;
  readOnly?: boolean;
}

export function EditorChild({
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
        value={value}
        path="file.js"
        theme="vs-dark"
        options={{
          fontSize: 12,
          fontFamily: 'Fira Code, monospace',
          readOnly,
          minimap: {
            enabled: false,
          },
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
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

export default function Editor({
  selectedFile,
  setSelectedFile,
  updateFileTree,
  setFiles,
}: {
  selectedFile: SelectedFileInfo | null;
  setSelectedFile: (file: SelectedFileInfo) => void;
  updateFileTree: (
    files: any,
    path: string,
    action: string,
    content?: string
  ) => any;
  setFiles: (files: any) => void;
}) {
  return (
    <div className="flex-1 overflow-hidden relative">
      <div className="absolute inset-0">
        {selectedFile && (
          <div className="flex items-center px-4 py-1 text-xs text-muted-foreground border-b py-2">
            <span>{selectedFile.path}</span>
          </div>
        )}
        {selectedFile && (
          <div className="h-[calc(100%-25px)]">
            <EditorChild
              value={selectedFile.content || ''}
              language={getLanguageForFile(selectedFile.path)}
              onChange={(value) => {
                if (selectedFile) {
                  // Update the file content in the WebContainer file structure
                  setSelectedFile({
                    ...selectedFile,
                    content: value || '',
                  });

                  setFiles((prev: FileSystemTree) =>
                    updateFileTree(prev, selectedFile.path, 'update', value)
                  );
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
