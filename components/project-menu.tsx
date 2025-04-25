'use client';
import { Ellipsis } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from './ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Input } from './ui/input';

interface DeleteProjectProps {
  projectId: string;
  projectTitle: string;
  onProjectDeleted?: () => void;
  onProjectRenamed?: (newTitle: string) => void;
}

export default function ProjectMenu({
  projectId,
  projectTitle,
  onProjectDeleted,
  onProjectRenamed,
}: DeleteProjectProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(projectTitle);

  const handleDeleteProject = async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      alert('Error deleting project');
      // console.error('Error deleting project:', error);
    } else {
      // console.log('Project deleted successfully');
      router.refresh();
      if (onProjectDeleted) {
        onProjectDeleted();
      }
    }
    setDeleteDialogOpen(false);
  };

  const handleRenameProject = async () => {
    if (!newTitle.trim()) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('projects')
      .update({ title: newTitle })
      .eq('id', projectId);

    if (error) {
      alert('Error renaming project');
      // console.error('Error renaming project:', error);
    } else {
      // console.log('Project renamed successfully');
      router.refresh();
      if (onProjectRenamed) {
        onProjectRenamed(newTitle);
      }
    }
    setRenameDialogOpen(false);
  };

  const openProject = () => {
    router.push(`/projects/${projectId}`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost">
            <Ellipsis className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={openProject}>
            Open Project
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setRenameDialogOpen(true)}>
            Rename Project
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            Delete Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Enter a new name for your project.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Project name"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameProject}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              project and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
