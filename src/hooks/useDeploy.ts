import { FileSystemTree } from '@webcontainer/api';
import { apiClient } from '../utils/apiClient';
import { useState } from 'react';

const initialDeployState = {
  deploymentId: '',
  deploymentUrl: '',
  deploymentStatus: 'PENDING', // "READY"
};
export const useDeploy = () => {
  const [deployState, setDeployState] = useState(initialDeployState);

  const onDeploy = async (projectFiles: FileSystemTree) => {
    const response = await apiClient.post<{
      success: boolean;
      deploymentId: string;
      deploymentUrl: string;
    }>('/api/deploy', {
      template: projectFiles,
    });

    if (response.data.success) {
      setDeployState({
        ...deployState,
        deploymentId: response.data.deploymentId,
        deploymentUrl: response.data.deploymentUrl,
      });
    } else {
      console.error('Deployment failed:', response.data);
    }
  };
  const onStatusCheck = async () => {
    const response = await apiClient.post<{
      success: boolean;
      deploymentStatus: string;
      deploymentUrl: string;
    }>('/api/deploy/status', {
      deploymentId: deployState.deploymentId,
    });

    const responseData = response.data;

    if (response.data.success) {
      setDeployState({
        ...deployState,
        deploymentStatus: response.data.deploymentStatus,
        deploymentUrl: response.data.deploymentUrl,
      });
    } else {
      console.error('Deployment failed:', response.data);
    }
  };

  const resetState = async () => {
    setDeployState(initialDeployState);
  };

  return { deployState, onStatusCheck, onDeploy, resetState };
};
