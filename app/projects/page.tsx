'use server';

import Navbar from '@/components/navbar';
import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { TProject } from '@/types/project';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Plus, Sparkles } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProjectMenu from '@/components/project-menu';

dayjs.extend(localizedFormat);

interface GetProjectsOptions {
  page?: number;
  pageSize?: number;
}

export async function getProjects({
  page = 1,
  pageSize = 9,
}: GetProjectsOptions = {}): Promise<{
  projects: TProject[];
  total: number;
}> {
  const supabase = await createClient();

  // Get count of all projects
  const { count, error: countError } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true });

  if (countError) throw countError;

  // Calculate pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Get projects with pagination
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select(`*, messages(count)`)
    .range(from, to)
    .order('updated_at', { ascending: false });

  if (projectError) throw projectError;

  return {
    projects: projects || [],
    total: count || 0,
  };
}

export default async function Page({ searchParams }: any) {
  const params = await searchParams;
  const currentPage = params?.page ? parseInt(params?.page) : 1;
  const pageSize = 10; // Number of projects per page

  const { projects, total } = await getProjects({
    page: currentPage,
    pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="pb-5">
      <Navbar />
      <div className="mx-auto px-4 max-w-screen-xl">
        <Breadcrumb className="mb-4">
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
          <Card className="p-0 bg-muted/20 flex items-center justify-center">
            <Link href={`/`} className="w-full h-full">
              <CardContent className="p-0 py-2 w-full h-full flex-1 flex items-center justify-center gap-2">
                <Plus className="h-5 w-5" />
                <p className="text-md">New Project</p>
              </CardContent>
            </Link>
          </Card>
          {projects.map((project) => (
            <Card className="p-0 bg-muted/20" key={project?.id}>
              <Link href={`/projects/${project?.id}`} prefetch={false}>
                <CardContent className="pt-5 px-4 pb-0">
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={currentPage <= 1}
              asChild={currentPage > 1}
            >
              {currentPage <= 1 ? (
                <>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </>
              ) : (
                <Link href={`/projects?page=${currentPage - 1}`}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Link>
              )}
            </Button>

            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? 'default' : 'outline'}
                    size="sm"
                    className="w-8 h-8"
                    asChild
                  >
                    <Link href={`/projects?page=${pageNum}`}>{pageNum}</Link>
                  </Button>
                )
              )}
            </div>

            <Button
              variant="ghost"
              disabled={currentPage >= totalPages}
              asChild={currentPage < totalPages}
              size="sm"
            >
              {currentPage >= totalPages ? (
                <>
                  Next <ChevronRight />
                </>
              ) : (
                <Link href={`/projects?page=${currentPage + 1}`}>
                  Next <ChevronRight />
                </Link>
              )}
            </Button>
          </div>
        )}

        {/* {projects.length > 0 && (
          <div className="text-center text-sm text-muted-foreground mt-4">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, total)} of {total} projects
          </div>
        )} */}

        {projects.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            No projects found.
          </div>
        )}
      </div>
    </div>
  );
}
