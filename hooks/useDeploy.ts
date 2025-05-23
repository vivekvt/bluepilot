import { FileSystemTree } from '@webcontainer/api';
import axios from 'axios';
import { useState } from 'react';

type DeploymentStatus = 'PENDING' | 'READY' | 'FAILED';

interface DeployState {
  deploymentId: string;
  deploymentUrl: string;
  deploymentStatus: DeploymentStatus;
  errorMessage?: string;
}

const initialDeployState: DeployState = {
  deploymentId: '',
  deploymentUrl: '',
  deploymentStatus: 'PENDING',
};

export const useDeploy = () => {
  const [deployState, setDeployState] =
    useState<DeployState>(initialDeployState);

  const onDeploy = async (projectId: string, files: FileSystemTree) => {
    try {
      const response = await axios.post<{
        success: boolean;
        deploymentId: string;
        deploymentUrl: string;
        message?: string;
      }>('/api/deploy', {
        files,
        projectId,
      });

      if (response.data.success) {
        setDeployState((prevState) => ({
          ...prevState,
          deploymentId: response.data.deploymentId,
          deploymentUrl: response.data.deploymentUrl,
        }));
        return true;
      } else {
        setDeployState((prevState) => ({
          ...prevState,
          deploymentStatus: 'FAILED',
          errorMessage: response.data.message || 'Deployment failed',
        }));
        console.error('Deployment failed:', response.data);
        return false;
      }
    } catch (error) {
      setDeployState((prevState) => ({
        ...prevState,
        deploymentStatus: 'FAILED',
        errorMessage:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }));
      console.error('Deployment error:', error);
      return false;
    }
  };

  const onStatusCheck = async () => {
    try {
      if (!deployState.deploymentId) {
        console.error('Cannot check status: No deployment ID');
        return false;
      }

      const response = await axios.post<{
        success: boolean;
        deploymentStatus: DeploymentStatus;
        deploymentUrl: string;
        message?: string;
      }>('/api/deploy/status', {
        deploymentId: deployState.deploymentId,
      });

      if (response.data.success) {
        setDeployState((prevState) => ({
          ...prevState,
          deploymentStatus: response.data.deploymentStatus,
          deploymentUrl: response.data.deploymentUrl,
        }));
        return true;
      } else {
        setDeployState((prevState) => ({
          ...prevState,
          deploymentStatus: 'FAILED',
          errorMessage: response.data.message || 'Status check failed',
        }));
        console.error('Status check failed:', response.data);
        return false;
      }
    } catch (error) {
      setDeployState((prevState) => ({
        ...prevState,
        deploymentStatus: 'FAILED',
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Unknown error occurred during status check',
      }));
      console.error('Status check error:', error);
      return false;
    }
  };

  const resetState = () => {
    setDeployState(initialDeployState);
  };

  return { deployState, onStatusCheck, onDeploy, resetState };
};
