'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileCode, Terminal, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TChatMessage, TProject } from '@/types/project';
// import Markdown from 'react-markdown';

interface ChatPanelProps {
  messages: TChatMessage[];
  onSendMessage: (newValue: String) => Promise<void>;
  isGenerating?: boolean;
  className?: string;
  project: TProject;
}

export default function ChatPanel({
  messages = [],
  onSendMessage,
  isGenerating = false,
  className,
  project,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && onSendMessage) {
      setLoading(true);
      await onSendMessage(input);
      setInput('');
      setLoading(false);
    }
  };

  return (
    <div className={cn('relative flex flex-col h-full w-full', className)}>
      {/* Messages Container */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-y-auto space-y-4 pt-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
      >
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={cn(
                'flex gap-3 p-2',
                message.role === 'user'
                  ? 'bg-muted border-b border-t border-l ml-5 rounded-lg'
                  : 'mr-5 pr-2'
              )}
            >
              {/* Message Content */}
              <div className="flex-1 space-y-1">
                {/* Timestamp */}
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  {message.role === 'user' ? 'You' : 'Blue Pilot'}

                  {/* <div className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(message.created_at)}
                  </div> */}
                </div>

                {/* Message Text */}
                <div className="text-gray-100 text-sm">
                  {message.text}
                  {/* <Markdown className="prose prose-invert prose-sm max-w-none">
                    {message.text}
                  </Markdown> */}
                </div>

                {/* Code Content */}
                {message.content && (
                  <div className="mt-3">
                    {true && (
                      <div className="space-y-3 mt-2">
                        {message.content.map((item, i) => (
                          <motion.div
                            key={`${message.id}-${i}`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="rounded-md overflow-hidden border"
                          >
                            {/* Code Header */}
                            <div className="flex items-center justify-between nobg-gray-800 px-3 py-2 bg-gray-800/30">
                              <div className="flex items-center gap-2">
                                {item.action === 'run' ? (
                                  <Terminal
                                    className="text-green-400"
                                    size={16}
                                  />
                                ) : (
                                  <FileCode
                                    className="text-yellow-400"
                                    size={16}
                                  />
                                )}
                                <span className="text-xs font-mono text-gray-300">
                                  {item.path}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {(isGenerating || loading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-gray-400 p-4"
          >
            <div className="flex space-x-1 mt-1.5">
              <div
                className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
            <ShimmerText text="Blue Pilot is thinking..." />
            {/* <span className="text-sm">Blue Pilot is thinking...</span> */}
          </motion.div>
        )}

        {/* Invisible element for scrolling to bottom */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Blue Pilot anything..."
            className="w-full px-4 py-3 bg-muted/30 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating || loading}
            className={cn(
              'absolute right-3 p-1.5 rounded-md',
              input.trim() && !(isGenerating && loading)
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            )}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

const ShimmerText = ({ text }: { text: string }) => {
  return (
    <div className="flex justify-center items-center">
      <div className="relative">
        <style jsx>{`
          @keyframes shimmer {
            0% {
              background-position: -200% center;
            }
            100% {
              background-position: 200% center;
            }
          }

          .shimmer-effect {
            background: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.1) 0%,
              rgba(255, 255, 255, 0.8) 50%,
              rgba(255, 255, 255, 0.1) 100%
            );
            background-size: 200% 100%;
            animation: shimmer 3s infinite linear;
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }
        `}</style>

        <span className="text-sm font-bold shimmer-effect">{text}</span>
      </div>
    </div>
  );
};
