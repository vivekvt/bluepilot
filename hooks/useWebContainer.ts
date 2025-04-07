import { WebContainer } from '@webcontainer/api';
import { useEffect, useState } from 'react';

export const useWebContainer = () => {
  const [webContainer, setWebContainerInstance] = useState<WebContainer | null>(
    null
  );

  useEffect(() => {
    const bootWebContainer = async () => {
      const instance = await WebContainer.boot();
      setWebContainerInstance(instance);
    };
    bootWebContainer();
  }, []);

  async function runCommand(command: string, args: string[]) {
    if (!webContainer) return;

    const installProcess = await webContainer.spawn(command, args);

    return installProcess.exit;
  }

  return { webContainer, runCommand };
};
