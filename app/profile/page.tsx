'use server';

import { redirect } from 'next/navigation';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
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
  CardFooter,
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
import {
  User,
  LogOut,
  Briefcase,
  Clock,
  Mail,
  CalendarDays,
} from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { getUser } from '@/lib/supabase/helper';

dayjs.extend(localizedFormat);

async function getProjects() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count || 0;
}

export default async function ProfilePage() {
  const user = await getUser();

  if (!user?.id) {
    redirect('/login');
  }
  const projectsCount = await getProjects();

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
      <div className="mx-auto px-4 max-w-screen-xl pb-8">
        <Breadcrumb className="mb-4">
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
          <Card className="bg-muted/20 overflow-hidden border-2 p-0">
            <div className="bg-gradient-to-r from-primary/30 to-primary/10 p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-background shadow-xl">
                  <AvatarImage
                    src={user.user_metadata?.avatar_url}
                    alt={user?.user_metadata?.name}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <User className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">
                    {user?.user_metadata?.name}
                  </h2>
                  <div className="flex items-center text-sm text-muted-foreground gap-1">
                    <Mail className="h-3 w-3" />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Account Created</p>
                    <p className="text-sm text-muted-foreground">
                      {dayjs(user?.created_at).format('MMMM D, YYYY')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Last Login</p>
                    <p className="text-sm text-muted-foreground">
                      {dayjs(user?.last_sign_in_at).format(
                        'MMMM D, YYYY [at] h:mm A'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>

            <Separator />

            <CardFooter className="p-6">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
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
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <form action={handleLogout} className="w-full">
                      <AlertDialogAction
                        type="submit"
                        className="w-full md:w-auto"
                      >
                        Logout
                      </AlertDialogAction>
                    </form>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
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
                  <h3 className="text-3xl font-bold">{projectsCount}</h3>
                </div>
                <Badge variant="outline" className="text-md py-1">
                  {projectsCount > 0 ? 'Active' : 'No Projects'}
                </Badge>
              </div>

              <Link href="/projects">
                <Button className="w-full">View All Projects</Button>
              </Link>

              {projectsCount === 0 && (
                <p className="text-center text-muted-foreground text-sm mt-4">
                  You haven't created any projects yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
