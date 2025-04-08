import { useEffect, useState } from 'react';
import { WebContainer } from '@webcontainer/api';

export const useWebContainer = () => {
  const [webContainer, setWebContainerInstance] = useState<WebContainer | null>(
    null
  );

  useEffect(() => {
    const initWebContainer = async () => {
      try {
        if (webContainer) return;
        const instance = await WebContainer.boot();
        setWebContainerInstance(instance);
      } catch (error) {
        console.error('WebContainer initialization error:', error);
      }
    };
    initWebContainer();
  }, []);

  async function runCommand(command: string, args: string[]) {
    if (!webContainer) return;
    const process = await webContainer.spawn(command, args);
    return process.exit;
  }

  return { webContainer, runCommand };
};
