'use client';

import Project from '@/components/project/project';
import ProjectLoadingSkeleton from '@/components/project/project-loading-skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { TChatMessage, TProject } from '@/types/project';
import { FileQuestion } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

export async function getProjectWithFiles(projectId: string): Promise<{
  project: TProject;
  messages: TChatMessage[];
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*, messages(*)')
    .eq('id', projectId)
    .single();

  if (error) throw error;

  const { messages, ...project } = data;

  return { project, messages };
}

export default function Page({ params }: any) {
  const [data, setData] = useState<{
    project: TProject | null;
    messages: TChatMessage[];
  }>({ project: null, messages: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { id } = await params;
        const { project, messages } = await getProjectWithFiles(id);
        setData({ project, messages });
      } catch (error) {
        // alert('Error fetching project data');
        // console.error('Error fetching project data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <ProjectLoadingSkeleton />;
  }

  if (!data?.project?.id) {
    return (
      <div className="flex h-screen w-full items-center justify-center flex-col gap-6 ">
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 p-8">
            <FileQuestion size={64} className="text-slate-400" />
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
              Project not found
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Sorry, we couldn't find the project you're looking for.
            </p>
            <div className="flex gap-4 mt-2">
              <Link href="/">
                <Button>Return to Home</Button>
              </Link>
              <Link href="/projects">
                <Button variant="outline">Browse Projects</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Project project={data?.project} messages={data?.messages} />;
}
