export enum StepType {
  CreateFile = 'createFile',
  CreateFolder = 'createFolder',
  EditFile = 'editFile',
  DeleteFile = 'deleteFile',
  RunScript = 'runScript',
}

export enum StepStatus {
  Pending = 'pending',
  InProgress = 'inProgress',
  Completed = 'completed',
  Failed = 'failed',
}

export interface Step {
  id: number;
  title: string;
  description: string;
  type: StepType;
  status: StepStatus;
  code?: string;
  path?: string;
}

export interface Project {
  prompt: string;
  steps: Step[];
}

export interface FileItem {
  name: string;
  type: 'file' | 'folder';
  children?: FileItem[];
  content?: string;
  path: string;
}

export interface FileViewerProps {
  file: FileItem | null;
  onClose: () => void;
}
