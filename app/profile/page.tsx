'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/navbar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { User, LogOut, Briefcase } from 'lucide-react';
import Link from 'next/link';

// Get projects function
async function getProjects() {
  const supabase = await createClient();
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select(`*, messages(count)`);

  if (projectError) throw projectError;
  return projects;
}

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect('/login');
  }

  // Fetch projects
  const projects = await getProjects();
  const projectCount = projects.length;

  // Handle logout on server action
  async function handleLogout() {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

  return (
    <div className="">
      <Navbar />
      <div className="container pb-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Profile</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid gap-6 md:grid-cols-2">
          {/* User Profile Card */}
          <Card className="bg-muted/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">
                  User Profile
                </CardTitle>
                <CardDescription>Your account information</CardDescription>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="font-medium">{data.user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    User ID
                  </p>
                  <p className="font-medium text-xs truncate">{data.user.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Last Sign In
                  </p>
                  <p className="font-medium">
                    {new Date(data.user.last_sign_in_at || '').toLocaleString()}
                  </p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full mt-4">
                      <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you sure you want to logout?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        You will need to login again to access your account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <form action={handleLogout}>
                        <AlertDialogAction type="submit">
                          Logout
                        </AlertDialogAction>
                      </form>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Projects Card */}
          <Card className="bg-muted/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold">
                  Your Projects
                </CardTitle>
                <CardDescription>
                  Overview of your active projects
                </CardDescription>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Projects
                  </p>
                  <h3 className="text-3xl font-bold">{projectCount}</h3>
                </div>
                <Badge variant="outline" className="text-md py-1">
                  {projectCount > 0 ? 'Active' : 'No Projects'}
                </Badge>
              </div>

              <Link href="/projects">
                <Button className="w-full">View All Projects</Button>
              </Link>

              {projectCount === 0 && (
                <p className="text-center text-muted-foreground text-sm mt-4">
                  You haven't created any projects yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects Preview (if any) */}
        {projectCount > 0 && (
          <Card className="mt-6 bg-muted/20">
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>
                Your most recently updated projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.slice(0, 3).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between border-b pb-4"
                  >
                    <div>
                      <p className="font-medium">
                        {project.title || 'Untitled Project'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {project?.messages?.[0]?.count || 0} messages
                      </p>
                    </div>
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="outline" size="sm">
                        Open
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
