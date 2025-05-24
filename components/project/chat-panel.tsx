'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FileCode,
  Terminal,
  Send,
  ChevronDown,
  Paperclip,
  Loader2,
  CircleCheck,
  Loader,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TChatMessage, TProject } from '@/types/project';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { appConfig } from '@/lib/config';
import { ShineBorder } from '../magicui/shine-border';
import { LoadingStep } from '@/types/steps';
import { TextShimmer } from './shimmer-text';
import { NeonGradientCard2 } from '../magicui/neon-gradient-card2';

interface ChatPanelProps {
  messages: TChatMessage[];
  onSendMessage: (newValue: String) => Promise<void>;
  isGenerating?: boolean;
  className?: string;
  project: TProject;
  loadingSteps: LoadingStep[];
}

export default function ChatPanel({
  messages = [],
  onSendMessage,
  isGenerating = false,
  className,
  project,
  loadingSteps,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingSteps]);

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
      <div className="flex items-center justify-start">
        <Button variant="ghost" size="sm">
          {project?.title}
          <ChevronDown />
        </Button>
      </div>
      <div
        ref={containerRef}
        className="relative flex-1 overflow-y-auto space-y-4 pt-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
      >
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={cn(
                'flex gap-3',
                message.role === 'user'
                  ? 'bg-muted border-b border-t border-l ml-5 rounded-lg p-2'
                  : 'mr-5 pr-2 pl-1'
              )}
            >
              {/* Message Content */}
              <div className="flex-1 space-y-1">
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  {message.role === 'user' ? 'You' : appConfig?.title}
                </div>
                {message.role === 'user' ? (
                  <div className="text-sm">{message.text}</div>
                ) : (
                  <DisplayContent
                    loadingSteps={message.content as LoadingStep[]}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {(isGenerating || loading) && (
          <>
            <div className="flex flex-col gap-1 mr-5 pr-2 pl-1">
              {loadingSteps?.length > 0 && (
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  {appConfig?.title}
                </div>
              )}
              <DisplayContent loadingSteps={loadingSteps} />
              <TextShimmer duration={1.2} className="text-md mt-1">
                {`${appConfig?.title} is thinking...`}
              </TextShimmer>
            </div>
          </>
        )}

        {/* Invisible element for scrolling to bottom */}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="relative">
        {isGenerating || loading ? (
          <NeonGradientCard2 className="p-0">
            <div>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask ${appConfig?.title} anything...`}
                className="min-h-[80px] resize-none py-3 focus-visible:ring-0 focus-visible:ring-offset-0 border-0"
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  // onChange={handleFileChange}
                  className="hidden"
                  multiple
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full"
                  disabled
                  onClick={handleFileClick}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  type="submit"
                  size="icon"
                  disabled={isGenerating || loading || !input.trim()}
                  className="h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
                >
                  {isGenerating || loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Send className="h-4 w-4 text-white" />
                  )}
                </Button>
              </div>
            </div>
          </NeonGradientCard2>
        ) : (
          <div className="relative rounded-2xl border overflow-hidden">
            {(isGenerating || loading) && (
              <ShineBorder shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']} />
            )}
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${appConfig?.title} anything...`}
              className="min-h-[80px] resize-none py-3 focus-visible:ring-0 focus-visible:ring-offset-0 border-0"
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <input
                type="file"
                ref={fileInputRef}
                // onChange={handleFileChange}
                className="hidden"
                multiple
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full"
                disabled
                onClick={handleFileClick}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                size="icon"
                disabled={isGenerating || loading || !input.trim()}
                className="h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors"
              >
                {isGenerating || loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Send className="h-4 w-4 text-white" />
                )}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

const DisplayContent = ({ loadingSteps }: { loadingSteps: LoadingStep[] }) => {
  return loadingSteps?.map((step, index) => (
    <div
      key={index}
      className={`flex items-center justify-between ${
        step?.action === 'explain' ? '' : 'rounded-md border p-2'
      }`}
    >
      <div className="flex items-center gap-2">
        {step?.action !== 'explain' && (
          <>
            {step.action === 'run' ? (
              <Terminal
                size={16}
                className={step?.status === 'success' ? 'text-green-400' : ''}
              />
            ) : (
              <FileCode
                size={16}
                className={step?.status === 'success' ? 'text-green-400' : ''}
              />
            )}
          </>
        )}
        <span
          className={`text-${
            step?.action === 'explain' ? 'sm' : 'xs'
          } font-mono text-gray-300`}
        >
          {step.path}
        </span>
      </div>
      {step?.action !== 'explain' && (
        <>
          {step.status === 'success' ? (
            <CircleCheck className="text-green-400" size={16} />
          ) : (
            <Loader className="text-yellow-400 animate-spin" size={16} />
          )}
        </>
      )}
    </div>
  ));
};
