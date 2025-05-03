export enum PromptRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export interface IPromptInput {
  role: PromptRole;
  content: string;
}
