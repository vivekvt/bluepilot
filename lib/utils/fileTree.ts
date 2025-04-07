import { TFile } from '@/types/project';
import { FileSystemTree } from '@webcontainer/api';

export function buildFileTree(files: TFile[]): FileSystemTree {
  const root: FileSystemTree = {};

  for (const { path, content, is_directory } of files) {
    const segments = path.split('/');
    let current = root;

    segments.forEach((segment, i) => {
      const isLast = i === segments.length - 1;

      if (isLast) {
        if (is_directory) {
          current[segment] = { directory: {} };
        } else {
          current[segment] = {
            file: {
              contents: content ?? '',
            },
          };
        }
      } else {
        if (!(segment in current)) {
          current[segment] = { directory: {} };
        }

        const next = current[segment];
        if ('directory' in next) {
          current = next.directory;
        }
      }
    });
  }

  return root;
}
