import { useState } from 'react';
import {
  DirectoryNode,
  FileNode,
  FileSystemTree,
  SymlinkNode,
} from '@webcontainer/api';

const waitTime = 200;

// Define the type for your selected file information
interface SelectedFileInfo {
  path: string;
  content: string | any;
}

interface FlattenedFileInfo {
  path: string;
  isDirectory: boolean;
  content?: string | Uint8Array;
  isSymlink?: boolean;
  symlinkTarget?: string;
}

const useSequentialFileClone = () => {
  const [files, setFiles] = useState<FileSystemTree>({});
  const [selectedFile, setSelectedFile] = useState<SelectedFileInfo | null>(
    null
  );
  const [isCloning, setIsCloning] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });

  // Function to flatten the file structure into a list of paths
  const flattenFileStructure = (
    obj: FileSystemTree,
    basePath: string = ''
  ): FlattenedFileInfo[] => {
    const result: FlattenedFileInfo[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = basePath ? `${basePath}/${key}` : key;

      if ('file' in value) {
        const fileNode = value as FileNode | SymlinkNode;

        if ('symlink' in fileNode.file) {
          // Handle symlink
          result.push({
            path: currentPath,
            isDirectory: false,
            isSymlink: true,
            symlinkTarget: fileNode.file.symlink,
          });
        } else {
          // Handle regular file
          result.push({
            path: currentPath,
            isDirectory: false,
            content: fileNode.file.contents,
          });
        }
      } else if ('directory' in value) {
        // Push the directory itself
        result.push({
          path: currentPath,
          isDirectory: true,
        });

        // Then recursively add its contents
        const directoryNode = value as DirectoryNode;
        result.push(
          ...flattenFileStructure(directoryNode.directory, currentPath)
        );
      }
    }

    return result;
  };

  // Helper function to update a file in the tree
  const updateFileInTree = (
    tree: FileSystemTree,
    path: string,
    content: any,
    isDirectory: boolean
  ): FileSystemTree => {
    const pathParts = path.split('/');
    const fileName = pathParts.pop() as string;

    let currentTree = { ...tree };

    // Navigate to the correct directory
    if (pathParts.length > 0) {
      let currentPath = '';
      let currentNode: any = currentTree;

      for (const part of pathParts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!currentNode[part]) {
          // Create directory if it doesn't exist
          currentNode[part] = { directory: {} };
        }

        if ('directory' in currentNode[part]) {
          currentNode = currentNode[part].directory;
        } else {
          // Cannot navigate further - this is not a directory
          return currentTree;
        }
      }

      // Add or update file/directory at this location
      if (isDirectory) {
        currentNode[fileName] = { directory: {} };
      } else {
        if (content === null) {
          // Create empty file
          currentNode[fileName] = { file: { contents: '' } };
        } else {
          // Add file with content
          currentNode[fileName] = { file: { contents: content } };
        }
      }
    } else {
      // Root level file/directory
      if (isDirectory) {
        currentTree[fileName] = { directory: {} };
      } else {
        if (content === null) {
          currentTree[fileName] = { file: { contents: '' } };
        } else {
          currentTree[fileName] = { file: { contents: content } };
        }
      }
    }

    return currentTree;
  };

  const startCloning = async (sourceFiles: FileSystemTree) => {
    if (isCloning) return;

    setIsCloning(true);

    // Start with an empty file system
    let newFiles: FileSystemTree = {};
    setFiles(newFiles);

    const flattenedFiles = flattenFileStructure(sourceFiles);
    setProgress({ current: 0, total: flattenedFiles.length });

    for (let i = 0; i < flattenedFiles.length; i++) {
      const { path, isDirectory, content, isSymlink, symlinkTarget } =
        flattenedFiles[i];

      // Step 1: Create empty file/directory/symlink
      newFiles = updateFileInTree(newFiles, path, null, isDirectory);
      setFiles(newFiles);

      setSelectedFile({
        path,
        content: null,
      });

      // Wait 1 second
      await new Promise((resolve) => setTimeout(resolve, waitTime));

      // Step 2: Add content (if it's a file or symlink)
      if (!isDirectory && (content || isSymlink)) {
        const fileContent = isSymlink
          ? symlinkTarget || null
          : typeof content === 'string'
          ? content
          : '[Binary content]';

        newFiles = updateFileInTree(newFiles, path, fileContent, false);
        setFiles(newFiles);

        setSelectedFile({
          path,
          content: fileContent,
        });

        // Wait another second before moving to the next file
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      setProgress({ current: i + 1, total: flattenedFiles.length });
    }

    setIsCloning(false);
  };

  return {
    isCloning,
    progress,
    startCloning,
    clonedFiles: files,
    cloneSelectedFile: selectedFile,
  };
};

export default useSequentialFileClone;
