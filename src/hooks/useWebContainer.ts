import { WebContainer } from '@webcontainer/api';
import { useEffect, useState } from 'react';

export const useWebContainer = () => {
  const [webcontainerInstance, setWebcontainerInstance] =
    useState<WebContainer | null>(null);

  // Call only once
  useEffect(() => {
    console.log('useWebContainer');
    const bootWebContainer = async () => {
      const instance = await WebContainer.boot();
      setWebcontainerInstance(instance);
    };
    bootWebContainer();
  }, []);

  return webcontainerInstance;
};
