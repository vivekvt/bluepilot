import {
  DirectoryNode,
  FileNode,
  FileSystemTree,
  SymlinkNode,
} from '@webcontainer/api';

export function convertFilesToString(
  files: FileSystemTree,
  hiddenFiles: string[] = ['package-lock.json']
): string {
  let result = 'Project Files:\n\n';
  result +=
    'The following is a list of all project files and their complete contents that are currently visible and accessible to you.\n\n';

  // Process the files object
  const processedFiles = processFileSystemTree(files);

  // Add the processed files to the result
  result += processedFiles.join('\n\n');

  // Add information about hidden files if any were provided
  if (hiddenFiles.length > 0) {
    result +=
      '\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n';
    result += hiddenFiles.map((file) => `  - ${file}`).join('\n');
  }

  return result;
}

/**
 * Checks if a node is a DirectoryNode
 */
function isDirectoryNode(
  node: DirectoryNode | FileNode | SymlinkNode
): node is DirectoryNode {
  return 'directory' in node;
}

/**
 * Checks if a node is a FileNode
 */
function isFileNode(
  node: DirectoryNode | FileNode | SymlinkNode
): node is FileNode {
  return 'file' in node;
}

/**
 * Checks if a node is a SymlinkNode
 */
function isSymlinkNode(
  node: DirectoryNode | FileNode | SymlinkNode
): node is SymlinkNode {
  return 'symlink' in node;
}

function processFileSystemTree(
  filesObj: FileSystemTree,
  currentPath: string = ''
): string[] {
  const result: string[] = [];

  for (const [name, node] of Object.entries(filesObj)) {
    const fullPath = currentPath ? `${currentPath}/${name}` : name;

    if (isFileNode(node)) {
      // Handle file content
      const content = node.file.contents;
      // Convert Uint8Array to string if necessary
      const contentString =
        content instanceof Uint8Array
          ? new TextDecoder().decode(content)
          : content;

      result.push(`${fullPath}:\n\`\`\`\n${contentString}\n\`\`\``);
    } else if (isDirectoryNode(node)) {
      // Handle directory by recursively processing it
      result.push(...processFileSystemTree(node.directory, fullPath));
    }
  }

  return result;
}
