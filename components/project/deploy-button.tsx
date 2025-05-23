'use client';

import type { FileSystemTree } from '@webcontainer/api';
import { useState, useEffect, useRef } from 'react';
import {
  Loader2,
  ExternalLink,
  RefreshCw,
  Rocket,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  projectId: string;
  files: FileSystemTree;
}

export function DeployButton({ projectId, files }: DeployButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { deployState, onDeploy, onStatusCheck, resetState } = useDeploy();
  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleDeploy = async () => {
    setLoading(true);
    const success = await onDeploy(projectId, files);
    setLoading(false);
    if (success) {
      setIsPolling(true);
    }
  };

  const handleRedeploy = async () => {
    resetState();
    const success = await onDeploy(projectId, files);
    if (success) {
      setIsPolling(true);
    }
  };

  // Start or stop polling based on deployment state
  useEffect(() => {
    // Clear any existing interval first
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    // Start new polling if conditions are met
    if (
      isPolling &&
      deployState.deploymentId &&
      deployState.deploymentStatus !== 'READY' &&
      deployState.deploymentStatus !== 'FAILED'
    ) {
      pollIntervalRef.current = setInterval(async () => {
        await onStatusCheck();

        // If deployment is ready or failed, stop polling
        if (
          deployState.deploymentStatus === 'READY' ||
          deployState.deploymentStatus === 'FAILED'
        ) {
          setIsPolling(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      }, 10000); // Check every 10 seconds
    }

    // Clean up interval on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [
    isPolling,
    deployState.deploymentId,
    deployState.deploymentStatus,
    onStatusCheck,
  ]);

  // Clean up polling when dialog is closed
  useEffect(() => {
    if (!open) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setIsPolling(false);
    }
  }, [open]);

  const renderDeploymentStatus = () => {
    if (!deployState.deploymentId) {
      return (
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">
            Ready to deploy your project?
          </p>
          <Button onClick={handleDeploy} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="mr-2 h-4 w-4" />
            )}
            {loading ? 'Deploying...' : 'Deploy Now'}
          </Button>
        </div>
      );
    }

    if (deployState.deploymentStatus === 'FAILED') {
      return (
        <div className="text-center">
          <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-full px-3 py-1 text-sm inline-flex items-center mb-4">
            <AlertCircle className="h-4 w-4 mr-1" />
            Deployment failed
          </div>

          {deployState.errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{deployState.errorMessage}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleRedeploy} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      );
    }

    if (isPolling || deployState.deploymentStatus !== 'READY') {
      return (
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Deploying your project...</p>
          <p className="text-sm text-muted-foreground mt-2">
            This may take a few minutes. Please wait.
          </p>
        </div>
      );
    }

    return (
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
              rel="noopener noreferrer"
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
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Rocket className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">Deploy</span>
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
          {renderDeploymentStatus()}
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
