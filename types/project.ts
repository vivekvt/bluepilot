import { FileSystemTree } from '@webcontainer/api';
import { IStep } from './steps';

export type TAppTemplate = 'react-vite';

export type TProject = {
  id: string;
  user_id: string;
  title?: string;
  prompt: string;
  template: TAppTemplate;
  files: FileSystemTree;
  created_at: string;
  updated_at: string;
};

export type TChatMessage = {
  id: string;
  project_id: string;
  role: 'user' | 'assistant' | 'system';
  content: IStep[];
  created_at: string;
  text: string;
};
