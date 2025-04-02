'use client';

import Chat from '@/components/chat';
import React, { Suspense } from 'react';

export default function page() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          Loading...
        </div>
      }
    >
      <Chat />
    </Suspense>
  );
}
