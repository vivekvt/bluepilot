'use client';

import type { DirectoryNode, FileNode, SymlinkNode } from '@webcontainer/api';
import {
  ChevronDown,
  ChevronRight,
  FileCode,
  Folder,
  FolderOpen,
  Loader,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface DirectoryEntry {
  directory: Record<string, FileSystemEntryType>;
}

interface FileEntry {
  file: {
    contents: string;
  };
}

type FileSystemEntryType =
  | FileEntry
  | DirectoryEntry
  | DirectoryNode
  | FileNode
  | SymlinkNode;

interface FileTreeProps {
  name: string;
  path: string;
  entry: FileSystemEntryType;
  onFileClick: (path: string, content: string) => void;
  selectedPath?: string;
  level?: number;
  isUpdatingFile?: boolean;
}

// Helper function to check if a path is a parent of another path
const isParentPath = (parentPath: string, childPath: string) => {
  // Normalize paths to ensure consistent comparison
  const normalizedParent = parentPath.endsWith('/')
    ? parentPath
    : `${parentPath}/`;
  return childPath.startsWith(normalizedParent);
};

export default function FileTree({
  name,
  path,
  entry,
  onFileClick,
  selectedPath = '',
  level = 0,
  isUpdatingFile,
}: FileTreeProps) {
  const isDirectory = 'directory' in entry;

  // Determine if this folder should be expanded based on the selected path
  const shouldBeExpanded =
    isDirectory &&
    (path === '/' || // Root is always expanded
      isParentPath(path, selectedPath) || // Parent of selected file
      selectedPath.includes(path)); // Path is part of selected path

  const [isExpanded, setIsExpanded] = useState(shouldBeExpanded);
  const isSelected = path === selectedPath;

  // Update expansion state when selectedPath changes
  useEffect(() => {
    if (shouldBeExpanded) {
      setIsExpanded(true);
    }
  }, [selectedPath, shouldBeExpanded]);

  if (isDirectory) {
    return (
      <div key={path} className="select-none">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex w-full items-center gap-2 px-2 py-1.5 text-sm rounded-md text-left',
            'transition-colors duration-200 ease-in-out',
            'hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-ring/40'
          )}
          style={{ paddingLeft: `${level * 0.5 + 0.5}rem` }}
        >
          <span className="text-muted-foreground transition-transform duration-200">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            )}
          </span>
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 flex-shrink-0" />
          )}
          <span className="truncate text-xs font-medium">{name}</span>
        </button>

        <div
          className={cn(
            'overflow-hidden transition-all duration-200 ease-in-out',
            isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="ml-4 pl-2 border-l border-border/30 mt-0.5 space-y-0.5">
            {isExpanded &&
              Object.entries((entry as DirectoryEntry).directory)
                .sort(([aName, aEntry], [bName, bEntry]) => {
                  // Sort directories first, then files
                  const aIsDir = 'directory' in aEntry;
                  const bIsDir = 'directory' in bEntry;
                  if (aIsDir && !bIsDir) return -1;
                  if (!aIsDir && bIsDir) return 1;
                  return aName.localeCompare(bName);
                })
                .map(([childName, childEntry]) => (
                  <FileTree
                    key={`${path}/${childName}`}
                    name={childName}
                    path={`${path}/${childName}`}
                    entry={childEntry}
                    onFileClick={onFileClick}
                    selectedPath={selectedPath}
                    level={level + 1}
                  />
                ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      key={path}
      onClick={() => onFileClick(path, (entry as FileEntry).file.contents)}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md text-left',
        'transition-colors duration-200 ease-in-out',
        'hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-ring/40',
        isSelected && 'bg-primary/10 text-primary font-medium',
        isSelected
          ? 'border-l-2 border-primary'
          : 'border-l-2 border-transparent'
      )}
      style={{ paddingLeft: `${level * 0.5 + 0.5}rem` }}
    >
      {isSelected && isUpdatingFile ? (
        <Loader className="h-4 w-4 flex-shrink-0 animate-spin" />
      ) : (
        <FileCode className="h-4 w-4 flex-shrink-0" />
      )}
      <span className={cn('truncate text-xs', isSelected && 'font-medium')}>
        {name}
      </span>
    </button>
  );
}
