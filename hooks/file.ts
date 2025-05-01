import { useEffect, useState, useCallback } from 'react';
import { debounce, isEqual } from 'lodash';
import { supabaseBrowserClient } from '@/lib/supabase/client';

export const useSaveFiles = (files: any, project: any) => {
  const [isSaving, setIsSaving] = useState(false);

  // Debounced function to save files to the database
  const saveFilesToDatabase = useCallback(
    debounce(async (filesToSave) => {
      if (!project?.id) {
        console.warn('No project ID provided, skipping save');
        return;
      }

      try {
        setIsSaving(true);
        const { error } = await supabaseBrowserClient
          .from('projects')
          .update({
            files: filesToSave,
            updated_at: new Date().toISOString(),
          })
          .eq('id', project.id);

        if (error) {
          throw new Error(`Error saving files: ${error.message}`);
        }

        console.log('Files updated in database');
      } catch (err) {
        console.error(err);
        // Use a toast or other UI feedback instead of alert
        alert('Failed to save files. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }, 1000),
    [project?.id]
  );

  useEffect(() => {
    // Skip if no project ID or files haven't changed
    if (!project?.id || isEqual(files, project?.files)) {
      return;
    }

    saveFilesToDatabase(files);

    // Cleanup: Cancel debounced calls on unmount
    return () => {
      saveFilesToDatabase.cancel();
    };
  }, [files, project?.id, project?.files, saveFilesToDatabase]);

  return { isSaving };
};
