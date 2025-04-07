'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import debounce from 'lodash.debounce';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Code,
  Eye,
  FileCode,
  Folder,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Settings,
  MoreHorizontal,
  Download,
  ArrowRight,
  Loader2,
  Plus,
  TerminalSquare,
  Menu,
} from 'lucide-react';
import Link from 'next/link';
import { Editor, getLanguageForFile } from '@/components/editor';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { apiClient } from '@/lib/utils/apiClient';
import {
  DirectoryNode,
  FileNode,
  FileSystemTree,
  SymlinkNode,
  WebContainer,
} from '@webcontainer/api';
import { useWebContainer } from '@/hooks/useWebContainer';
import { appConfig } from '@/lib/config';
import { ShineBorder } from '@/components/magicui/shine-border';
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from '@/components/magicui/terminal';
import { useDownload } from '@/hooks/useDownload';
import { DeployButton } from '@/components/deploy-button';
import { TChatMessage, TFile, TProject } from '@/types/project';
import { createClient } from '@/lib/supabase/client';
import { IStep } from '@/types/steps';
import ChatPanel from './chat-pannel';
import { AnimatedGridPattern } from './magicui/animated-grid-pattern';
import { DotPattern } from '@/src/components/magicui/dot-pattern';
import { Vortex } from '@/src/components/ui/vortex';

interface LLMPrompt {
  role: PromptRole;
  content: string;
}

enum PromptRole {
  User = 'user',
  Assistant = 'assistant',
}

// File-related types based on WebContainer API
interface FileEntry {
  file: {
    contents: string;
  };
}

interface DirectoryEntry {
  directory: Record<string, FileSystemEntryType>;
}

type FileSystemEntryType =
  | FileEntry
  | DirectoryEntry
  | DirectoryNode
  | FileNode
  | SymlinkNode;

// For selected file state
interface SelectedFileInfo {
  path: string;
  content: string;
}

interface ChatProps {
  project: TProject;
  messages: TChatMessage[];
}

const supabase = createClient();

export default function Chat(props: ChatProps) {
  const { webContainer, runCommand } = useWebContainer();

  const [files, setFiles] = useState<FileSystemTree>(
    props.project?.files || {}
  );
  const [selectedFile, setSelectedFile] = useState<SelectedFileInfo | null>(
    null
  );
  const [messages, setMessages] = useState<TChatMessage[]>(props.messages);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('code');
  const [inputValue, setInputValue] = useState('');
  const [url, setUrl] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<{
    command: string;
    output: string[];
  }>({
    command: '',
    output: [],
  });

  const { onDownload } = useDownload();

  const init = async () => {
    try {
      if (!webContainer) return;
      setIsGenerating(true);
      await webContainer.mount(props.project?.files);
      await runCommand('npm', ['install']);
      setIsGenerating(false);
      if (!(props?.messages?.length > 1)) {
        await startChat([
          { role: PromptRole.User, content: props.project.prompt },
        ]);
      }
    } catch (error: any) {
      setIsGenerating(false);
      alert(`Error: ${error.message}`);
    }
  };

  useEffect(() => {
    if (webContainer) {
      init();
    }
  }, [webContainer]);

  const saveMessageToDB = async (
    role: 'user' | 'assistant',
    content: string | any
  ) => {
    const { error: messageError, data } = await supabase
      .from('messages')
      .insert([
        {
          project_id: props?.project.id,
          role,
          text: role === 'user' ? content : '',
          content: role === 'assistant' ? content : null,
        },
      ])
      .select();
    if (messageError || !data?.[0]) {
      alert(`Error while saving message:`);
      return;
    }
    setMessages((prev) => [...prev, data?.[0]]);
  };

  const startChat = async (newLlmPrompts: LLMPrompt[]) => {
    try {
      if (isGenerating) return;
      setIsGenerating(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      const { data } = await apiClient.post(
        '/api/chat',
        {
          messages: newLlmPrompts,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      await saveMessageToDB('assistant', data?.steps);
      if (data?.success && data?.steps?.length > 0) {
        await applyLLMSteps(data?.steps);
      }

      await startDevServer();

      setIsGenerating(false);
    } catch (error: any) {
      setIsGenerating(false);
      alert(`Error: ${error.message}`);
    }
  };

  const updateFileTree = (
    tree: FileSystemTree,
    path: string,
    action: string,
    content?: string
  ): FileSystemTree => {
    const pathParts = path.split('/').filter(Boolean); // Split and remove empty parts
    let current: FileSystemTree = { ...tree };

    // Traverse or create nested directories
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!current[part] || !('directory' in current[part])) {
        current[part] = { directory: {} };
      }
      current = (current[part] as DirectoryNode).directory;
    }

    const fileName = pathParts[pathParts.length - 1];

    // Apply the action
    switch (action) {
      case 'create':
      case 'update':
        if (content !== undefined) {
          current[fileName] = { file: { contents: content } };
        }
        break;
      case 'delete':
        delete current[fileName];
        break;
      default:
        // 'run' doesn't affect the file tree, so no changes
        break;
    }

    return { ...tree };
  };

  async function applyLLMSteps(steps: IStep[]) {
    if (!webContainer) return;

    // Helper function to update the FileSystemTree recursively

    // Process each step
    for await (const step of steps) {
      try {
        // Ensure /src exists in the WebContainer filesystem
        await webContainer.fs.mkdir('/src', { recursive: true });

        switch (step.action) {
          case 'create': {
            setSelectedFile({ content: step.content || '', path: step.path });
            const pathParts = step.path.split('/').filter(Boolean);
            const dirPath = pathParts.slice(0, -1).join('/');
            if (dirPath) {
              await webContainer.fs.mkdir(dirPath, { recursive: true });
            }
            if (!step.content) {
              throw new Error(
                `Content is required for creating file at ${step.path}`
              );
            }
            await webContainer.fs.writeFile(step.path, step.content, 'utf8');
            setFiles((prev) =>
              updateFileTree(prev, step.path, 'create', step.content)
            );
            break;
          }
          case 'update': {
            if (!step.content) {
              throw new Error(
                `Content is required for updating file at ${step.path}`
              );
            }
            setSelectedFile({ content: step.content || '', path: step.path });
            await webContainer.fs.writeFile(step.path, step.content, 'utf8');
            setFiles((prev) =>
              updateFileTree(prev, step.path, 'update', step.content)
            );
            break;
          }
          case 'delete': {
            await webContainer.fs.rm(step.path, {
              recursive: true,
              force: true,
            });
            setFiles((prev) => updateFileTree(prev, step.path, 'delete'));
            break;
          }
          case 'run': {
            const [command, ...args] = step.path.split(' ');
            await runCommand(command, args);
            // No file tree update needed for 'run'
            break;
          }
          default:
            throw new Error(`Unknown action: ${step.action}`);
        }
      } catch (error) {
        console.error(
          `Error processing step ${step.action} at ${step.path}:`,
          error
        );
        // Optionally break the loop or continue based on your error handling policy
      }
    }
  }

  const handleSendMessage = async (newValue: String) => {
    try {
      if (isGenerating) return;
      setIsGenerating(true);
      const newLlmPrompt = [
        {
          role: PromptRole.User,
          content: inputValue,
        },
      ];
      // setInputValue('');
      await saveMessageToDB('user', newValue);
      setIsGenerating(false);
      startChat(newLlmPrompt);
    } catch (error: any) {
      setIsGenerating(false);
      alert(`Error: ${error.message}`);
    }
  };

  async function startDevServer() {
    if (!webContainer) return;
    if (url) {
      setShowTerminal(false);
      setActiveTab('preview');
    } else {
      setIsGenerating(true);
      setTerminalOutput((prev) => ({
        ...prev,
        command: 'npm run dev',
      }));
      setShowTerminal(true);
      const spawnProcess = await webContainer.spawn('npm', ['run', 'dev']);
      spawnProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            setTerminalOutput((prev) => ({
              ...prev,
              output: [...prev.output, data],
            }));
          },
        })
      );
      // Wait for `server-ready` event
      webContainer.on('server-ready', (port, url) => {
        setIsGenerating(false);
        setUrl(url);
        setShowTerminal(false);
        setActiveTab('preview');
      });
    }
  }

  useEffect(() => {
    if (isGenerating && activeTab === 'preview') {
      setActiveTab('code');
    }
  }, [isGenerating]);

  useEffect(() => {
    console.log('Files Changed');
    // Create debounced function that persists between renders
    const debouncedUpdateFiles = debounce(async () => {
      const { error } = await supabase
        .from('projects')
        .update({
          files,
          updated_at: new Date().toISOString(),
        })
        .eq('id', props.project.id);

      if (error) {
        alert(`Error while saving files`);
      }
    }, 1000); // 1 second delay

    if (files !== props.project?.files) {
      debouncedUpdateFiles();
    }

    // Cleanup function to cancel any pending debounced calls when component unmounts
    return () => {
      debouncedUpdateFiles.cancel();
    };
  }, [files, props.project?.id]);

  return (
    <div className="flex flex-col h-screen relative">
      {/* <Vortex backgroundColor="black" className="flex flex-col h-screen"> */}

      {/* Header */}
      <header className="flex w-full items-center pt-2 px-3">
        <div className="w-1/4  overflow-auto flex items-center gap-1">
          {/* <Link href="/">
            <h1 className="text-lg font-semibold">{appConfig.title}</h1>
          </Link> */}
          <Button variant="ghost" size="icon" className="p-0">
            <Menu />
          </Button>

          <Button variant="ghost" size="sm">
            {props?.project?.title}
            <ChevronDown />
          </Button>
        </div>

        <div className="flex flex-1 overflow-auto">
          <div className="flex items-center justify-between w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger
                  value="code"
                  className={
                    activeTab === 'code'
                      ? 'border-primary'
                      : 'border-transparent'
                  }
                >
                  <Code className="h-4 w-4 mr-2" />
                  Code
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  disabled={isGenerating}
                  className={
                    activeTab === 'preview'
                      ? 'border-primary'
                      : 'border-transparent'
                  }
                >
                  {isGenerating ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  Preview
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              {/* <ThemeToggle /> */}
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => onDownload(files)}
              >
                <Download className="h-4 w-4" />
                {/* <span>Download</span> */}
              </Button>
              <DeployButton projectFiles={files} className="gap1" />
            </div>
          </div>
        </div>
      </header>
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/4 pl-2 pb-2 pt-2">
          <ChatPanel
            project={props.project}
            messages={messages}
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
          />
        </div>
        {/* Right side - Code and Preview */}
        <div className="flex-1 flex flex-col overflow-hidden p-2">
          <div className="relative flex-1 flex flex-col overflow-hidden border rounded-lg">
            {isGenerating && (
              <ShineBorder shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']} />
            )}

            {/* Code Editor or Preview */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'code' ? (
                <div className="flex h-full">
                  {/* File explorer */}
                  <div className="w-50 border-r overflow-auto bg-muted/30">
                    <div className="p-1">
                      <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                        FILES
                      </div>
                      <div>
                        {Object.entries(files).map(([name, entry]) => (
                          <FileTree
                            key={name}
                            name={name}
                            path={name}
                            entry={entry}
                            onFileClick={(path, content) => {
                              setSelectedFile({ path, content });
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Code editor */}
                  <div className="flex-1 overflow-hidden relative">
                    <div className="absolute inset-0">
                      {selectedFile && (
                        <div className="flex items-center px-4 py-1 text-xs text-muted-foreground border-b py-2">
                          <span>{selectedFile.path}</span>
                        </div>
                      )}
                      {selectedFile && (
                        <div className="h-[calc(100%-25px)]">
                          <Editor
                            value={selectedFile.content || ''}
                            language={getLanguageForFile(selectedFile.path)}
                            onChange={(value) => {
                              if (selectedFile) {
                                // Update the file content in the WebContainer file structure
                                setSelectedFile({
                                  ...selectedFile,
                                  content: value || '',
                                });

                                setFiles((prev) =>
                                  updateFileTree(
                                    prev,
                                    selectedFile.path,
                                    'update',
                                    value
                                  )
                                );
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full w-full ">
                  {/* Preview */}
                  {url ? (
                    <iframe
                      className="h-full w-full border-none m-0 p-0"
                      src={url}
                      frameBorder="0"
                      allowFullScreen
                    />
                  ) : (
                    <p>Loading...</p>
                  )}
                </div>
              )}
            </div>

            <div className="border-t bg-background">
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
                        activeTab === 'terminal'
                          ? 'border-primary'
                          : 'border-transparent'
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
                    <TypingAnimation>
                      {'&gt;' + terminalOutput.command}
                    </TypingAnimation>
                  )}
                  {terminalOutput.output.map((line, index) => (
                    <TypingAnimation key={index} delay={1000}>
                      {line}
                    </TypingAnimation>
                  ))}
                </Terminal>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* </Vortex> */}
    </div>
  );
}

interface FileTreeProps {
  name: string;
  path: string;
  entry: FileSystemEntryType;
  onFileClick: (path: string, content: string) => void;
}

export function FileTree({ name, path, entry, onFileClick }: FileTreeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDirectory = 'directory' in entry;

  if (isDirectory) {
    return (
      <div key={path}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md text-left hover:bg-muted"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          )}
          <Folder className="h-4 w-4 flex-shrink-0" />
          <span className="truncate text-xs">{name}</span>
        </button>
        {isExpanded && (
          <div className="ml-4 pl-2 border-l border-border/50 mt-1">
            {Object.entries((entry as DirectoryEntry).directory).map(
              ([childName, childEntry]) => (
                <FileTree
                  key={`${path}/${childName}`}
                  name={childName}
                  path={`${path}/${childName}`}
                  entry={childEntry}
                  onFileClick={onFileClick}
                />
              )
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      key={path}
      onClick={() => onFileClick(path, (entry as FileEntry).file.contents)}
      className="ml-0 w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md text-left hover:bg-muted"
    >
      <FileCode className="h-4 w-4 flex-shrink-0" />
      <span className="truncate text-xs">{name}</span>
    </button>
  );
}

const npmInstallAndRun = async (code: string, webContainer: WebContainer) => {
  const normalizedCode = code.replace(/&amp;&amp;/g, '&&');
  const commands = normalizedCode.split('&&').map((cmd) => cmd.trim());

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    if (command === 'npm run dev') continue;
    const parts = command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);
    const exitCode = await spawnCommand(webContainer, cmd, args);
    if (exitCode !== 0) {
      throw new Error('spawnCommand failed');
    }
  }
};

const spawnCommand = async (
  webContainer: WebContainer,
  cmd: string,
  args: string[]
) => {
  const installProcess = await webContainer.spawn(cmd, args);
  // installProcess.output.pipeTo(
  //   new WritableStream({
  //     write(data) {
  //       console.log(data);
  //     },
  //   })
  // );
  return installProcess.exit;
};
