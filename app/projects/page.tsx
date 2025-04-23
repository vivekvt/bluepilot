import Navbar from '@/components/navbar';
import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { TProject } from '@/types/project';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import DeleteProject from '@/components/project-menu';
import ProjectMenu from '@/components/project-menu';

dayjs.extend(localizedFormat);

export async function getProjects(): Promise<TProject[]> {
  const supabase = await createClient();
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select(`*, messages(count)`);

  if (projectError) throw projectError;

  return projects;
}

export default async function page() {
  const projects = await getProjects();

  return (
    <div>
      <Navbar />
      <div className="container">
        <Breadcrumb className="mb-3">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Projects</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card className="p-0 bg-muted/20" key={project?.id}>
              <Link href={`/chat/${project?.id}`} prefetch={false}>
                <CardContent className="p-3 pl-4 pb-2">
                  <Sparkles />
                  <p className="text-md">{project?.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {/* @ts-ignore */}
                    {project?.messages?.[0]?.count || 0} Chats
                  </p>
                </CardContent>
              </Link>
              <CardFooter className="flex flex-row items-center justify-between border-t pl-4 pr-2 pb-1">
                <div className="text-xs text-muted-foreground">
                  Last Updated: {dayjs(project?.updated_at).format('lll')}
                </div>
                <ProjectMenu
                  projectId={project?.id}
                  projectTitle={project?.title as string}
                />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
