import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { TerminalSquare } from 'lucide-react';
import { Terminal, TypingAnimation } from '../magicui/terminal';
import { TerminalOutput } from './chat';
import { cn } from '@/lib/utils';

interface EditorTerminalProps {
  showTerminal: boolean;
  setShowTerminal: (showTerminal: boolean) => void;
  terminalOutput: TerminalOutput;
}

export default function EditorTerminal({
  showTerminal,
  setShowTerminal,
  terminalOutput,
}: EditorTerminalProps) {
  return (
    <div className="border-t bg-muted/40">
      <Tabs
        value={showTerminal ? 'terminal' : ''}
        // onValueChange={() => setShowTerminal(!showTerminal)}
        className="w-full"
      >
        <div className="flex">
          <TabsList className="h-9 bg-transparent">
            <TabsTrigger
              onClick={() => setShowTerminal(!showTerminal)}
              value="terminal"
              className={cn(
                'h-9 rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-background',
                showTerminal ? 'border-primary' : 'border-transparent'
              )}
            >
              <TerminalSquare className="h-4 w-4 mr-2" />
              Terminal
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
      {showTerminal && (
        <Terminal className="h-40 w-full">
          {terminalOutput.command && (
            <TypingAnimation>{'&gt;' + terminalOutput.command}</TypingAnimation>
          )}
          {terminalOutput.output.map((line, index) => (
            <TypingAnimation key={index} delay={1000}>
              {line}
            </TypingAnimation>
          ))}
        </Terminal>
      )}
    </div>
  );
}
