'use client';

import type { FileSystemTree } from '@webcontainer/api';
import { useState, useEffect } from 'react';
import { Loader2, ExternalLink, RefreshCw, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useDeploy } from '@/hooks/useDeploy';

interface DeployButtonProps {
  projectFiles: FileSystemTree;
  buttonText?: string;
  className?: string;
}

export function DeployButton({
  projectFiles,
  buttonText = 'Deploy',
  className,
}: DeployButtonProps) {
  const [open, setOpen] = useState(false);
  const { deployState, onDeploy, onStatusCheck, resetState } = useDeploy();
  const [isPolling, setIsPolling] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  const handleDeploy = async () => {
    await onDeploy(projectFiles);
    setIsPolling(true);
  };

  const handleRedeploy = async () => {
    resetState();
    await onDeploy(projectFiles);
    setIsPolling(true);
  };

  useEffect(() => {
    // Start polling when deployment is initiated
    if (isPolling && deployState.deploymentId) {
      const interval = setInterval(async () => {
        await onStatusCheck();

        // If deployment is ready, stop polling
        if (deployState.deploymentStatus === 'READY') {
          setIsPolling(false);
          if (pollInterval) {
            clearInterval(pollInterval);
            setPollInterval(null);
          }
        }
      }, 10000); // Check every 10 seconds

      setPollInterval(interval);

      // Clean up interval on unmount
      return () => {
        clearInterval(interval);
        setPollInterval(null);
      };
    }
  }, [isPolling, deployState.deploymentId, deployState.deploymentStatus]);

  // Clean up polling when dialog is closed
  useEffect(() => {
    if (!open && pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
      setIsPolling(false);
    }
  }, [open, pollInterval]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className={className}>
          <Rocket className="h-3 w-3" />
          <span className="hidden sm:inline">{buttonText}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deploy to Vercel</DialogTitle>
          <DialogDescription>
            Deploy your project to Vercel for hosting.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {!deployState.deploymentId ? (
            <div className="text-center">
              <p className="mb-4 text-muted-foreground">
                Ready to deploy your project?
              </p>
              <Button onClick={handleDeploy}>
                <Rocket className="mr-2 h-4 w-4" />
                Deploy Now
              </Button>
            </div>
          ) : isPolling || deployState.deploymentStatus !== 'READY' ? (
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium">Deploying your project...</p>
              <p className="text-sm text-muted-foreground mt-2">
                This may take a few minutes. Please wait.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full px-3 py-1 text-sm inline-flex items-center mb-4">
                <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                Deployment successful!
              </div>
              <p className="mb-4 text-muted-foreground">
                Your project has been deployed successfully.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="default">
                  <a
                    href={`https://${deployState.deploymentUrl}`}
                    target="_blank"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Site
                  </a>
                </Button>
                <Button onClick={handleRedeploy} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Redeploy
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-end">
          {deployState.deploymentId &&
            deployState.deploymentStatus === 'READY' && (
              <p className="text-xs text-muted-foreground">
                Deployment ID: {deployState.deploymentId.substring(0, 8)}...
              </p>
            )}
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
