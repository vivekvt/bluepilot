import { FileSystemTree } from '@webcontainer/api';
import JSZip from 'jszip';

const PROJECT_NAME = 'project';

export const useDownload = () => {
  const onDownload = (files: FileSystemTree) => {
    const zip = new JSZip();
    const folder = zip.folder(PROJECT_NAME);
    if (!folder) {
      console.error('Failed to create folder in zip');
      return;
    }
    Object.entries(files).forEach(([filePath, file]) => {
      if ('file' in file && file.file) {
        if ('contents' in file.file) {
          folder.file(filePath, file.file.contents);
        }
      } else if ('directory' in file && file.directory) {
        const subFolder = folder.folder(filePath);
        if (subFolder) {
          Object.entries(file.directory).forEach(([subFilePath, subFile]) => {
            if ('file' in subFile && subFile.file) {
              if ('contents' in subFile.file) {
                subFolder.file(subFilePath, subFile.file.contents);
              }
            }
          });
        }
      }
    });
    zip.generateAsync({ type: 'blob' }).then((content) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = `${PROJECT_NAME}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  };
  return { onDownload };
};
