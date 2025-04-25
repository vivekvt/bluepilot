'use server';

import IDE from '@/components/chat/ide';
import { createClient } from '@/lib/supabase/server';
import { TChatMessage, TProject } from '@/types/project';

export async function getProjectWithFiles(projectId: string): Promise<{
  project: TProject;
  messages: TChatMessage[];
}> {
  const supabase = await createClient();
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError) throw projectError;

  const { data: messages, error: chatError } = await supabase
    .from('messages')
    .select('*')
    .eq('project_id', projectId);

  if (chatError) throw chatError;

  return { project, messages };
}

export default async function Page({ params }: any) {
  const { id } = await params;
  const data = await getProjectWithFiles(id);

  if (!data?.project?.id) {
    return (
      <div className="flex h-screens w-full items-center justify-center">
        <h1 className="text-2xl font-bold">Project not found</h1>
      </div>
    );
  }

  return (
    <>
      <IDE {...data} />
    </>
  );
}
