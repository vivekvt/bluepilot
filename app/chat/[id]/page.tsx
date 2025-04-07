'use server';

import Chat from '@/components/chat';
import { createClient } from '@/lib/supabase/server';
import { TChatMessage, TFile, TProject } from '@/types/project';
import React, { Suspense } from 'react';

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

export default async function page({ params }: { params: { id: string } }) {
  const data = await getProjectWithFiles(params?.id);

  if (!data?.project?.id) {
    return (
      <div className="flex h-screens w-full items-center justify-center">
        <h1 className="text-2xl font-bold">Project not found</h1>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          Loading...
        </div>
      }
    >
      <Chat {...data} />
    </Suspense>
  );
}
