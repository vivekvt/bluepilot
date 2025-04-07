export enum IStepAction {
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  Run = 'run',
}

export interface IStep {
  action: IStepAction;
  path: string;
  content?: string; // Required for create/update, omitted for delete/run
  directory?: boolean; // Required for folder create/delete, omitted otherwise
}
