'use client';

import React, { useState, useEffect } from 'react';
import {
  Menu,
  Code,
  Eye,
  Terminal,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

const ChatLoadingSkeleton = () => {
  const [loadingText, setLoadingText] = useState('Setting up environment');
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Animate the dots for loading indication
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + '.' : ''));
    }, 500);

    // Cycle through different loading messages
    const messageInterval = setInterval(() => {
      const messages = [
        'Setting up environment',
        'Initializing workspace',
        'Loading dependencies',
        'Preparing development tools',
      ];

      setLoadingText((prev) => {
        const currentIndex = messages.indexOf(prev.split('.')[0]);
        return messages[(currentIndex + 1) % messages.length];
      });
    }, 2000);

    return () => {
      clearInterval(dotInterval);
      clearInterval(messageInterval);
    };
  }, []);

  return (
    <div className="flex h-screen w-full ">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-block relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-blue-400 mb-2">
            {loadingText}
            <span className="text-blue-300">{dots}</span>
          </h2>
          <p className="text-gray-400 max-w-md">
            Preparing your development environment. This may take a moment.
          </p>
          <div className="mt-6 w-64 mx-auto">
            <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full animate-pulse-subtle origin-left"
                style={{ width: '60%' }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatLoadingSkeleton;
