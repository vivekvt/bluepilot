'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { IChatProps } from './chat';
import ChatLoadingSkeleton from './chat-loading-skeleton';

// Dynamic import with Next.js
const Chat = dynamic(() => import('./chat'), {
  loading: () => <ChatLoadingSkeleton />,
  // Disable SSR for client-only components if needed
  ssr: false,
});

export default function IDE(props: IChatProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <ChatLoadingSkeleton />;
  }

  // No need for Suspense with Next.js dynamic import
  return <Chat {...props} />;
}
