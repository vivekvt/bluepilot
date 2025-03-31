'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { nanoid } from 'nanoid';

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
} from 'lucide-react';
import Link from 'next/link';
import { Editor, getLanguageForFile } from '@/components/editor';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { apiClient } from '@/src/utils/apiClient';
import {
  DirectoryNode,
  FileNode,
  FileSystemTree,
  SymlinkNode,
  WebContainer,
} from '@webcontainer/api';
import { Step, StepStatus, StepType } from '@/types';
import { parseXml } from '@/src/utils/steps';
import { useWebContainer } from '@/src/hooks/useWebContainer';
import { appConfig } from '@/src/config';
import { ShineBorder } from '@/src/components/magicui/shine-border';
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from '@/src/components/magicui/terminal';
import { useDownload } from '@/src/hooks/useDownload';

interface LLMPrompt {
  role: PromptRole;
  text: string;
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

export default function GeneratePage() {
  const webContainer = useWebContainer();
  const searchParams = useSearchParams();
  const promptParam = searchParams?.get('prompt') || '';

  const [files, setFiles] = useState<FileSystemTree>({});
  const [selectedFile, setSelectedFile] = useState<SelectedFileInfo | null>(
    null
  );
  const [llmMessages, setLlmMessages] = useState<LLMPrompt[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [steps, setSteps] = useState<Step[]>([]);
  const [activeTab, setActiveTab] = useState('code');
  const [newMessage, setNewMessage] = useState('');
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
      if (isGenerating) return;
      setIsGenerating(true);
      const response = await apiClient.post<{
        basePrompts: LLMPrompt[];
        files: FileSystemTree;
      }>('/api/template', {
        prompt: promptParam,
      });

      const { basePrompts, files: initialFiles } = response.data;

      if (!(basePrompts?.length > 0)) {
        throw new Error('Give a valid prompt');
      }

      setFiles(initialFiles);
      await webContainer?.mount(initialFiles);
      const installStatus = await installDependencies();

      setIsGenerating(false);
      startChat(basePrompts, [
        {
          id: nanoid(),
          title: 'Initial File Setup',
          status: StepStatus.Pending,
          description: '',
          type: StepType.Title,
        },
      ]);
    } catch (error: any) {
      setIsGenerating(false);
      alert(`Error: ${error.message}`);
    }
  };

  useEffect(() => {
    if (promptParam && webContainer) {
      init();
    }
  }, [promptParam, webContainer]);

  const startChat = async (newLlmPrompts: LLMPrompt[], oldSteps?: Step[]) => {
    try {
      console.log('startChat');
      if (isGenerating) return;
      setIsGenerating(true);
      const response = await apiClient.post('/api/chat', {
        messages: newLlmPrompts,
      });
      let newSteps = parseXml(response?.data?.answer);
      if (oldSteps && oldSteps?.length > 0) {
        newSteps = [...oldSteps, ...newSteps];
      }
      setSteps((previousSteps) => [...previousSteps, ...newSteps]);
      setLlmMessages([
        ...newLlmPrompts,
        { role: PromptRole.Assistant, text: response?.data?.answer },
      ]);
      setIsGenerating(false);
    } catch (error: any) {
      setIsGenerating(false);
      alert(`Error: ${error.message}`);
    }
  };

  useEffect(() => {
    if (isGenerating || !webContainer) return;
    setIsGenerating(true);
    const processSteps = async () => {
      try {
        let updatedFiles = { ...files };
        let updateHappened = false;

        const pendingSteps = steps.filter(
          ({ status }) => status === StepStatus.Pending
        );

        for (let i = 0; i < pendingSteps.length; i++) {
          const step = pendingSteps[i];
          updateHappened = true;
          if (step?.type === StepType.File && step.path) {
            // Remove leading slash if present
            const normPath = step.path.startsWith('/')
              ? step.path.substring(1)
              : step.path;
            const pathParts = normPath.split('/');

            // Handle file creation/update
            let current = updatedFiles;
            const fileName = pathParts.pop() || '';

            // Create directory structure if needed
            for (let i = 0; i < pathParts.length; i++) {
              const part = pathParts[i];
              if (!current[part]) {
                current[part] = { directory: {} };
              } else if (!('directory' in current[part])) {
                // Handle error - trying to use a file as a directory
                console.error(`Cannot create path: ${part} exists as a file`);
                return;
              }
              current = (current[part] as DirectoryEntry).directory;
            }

            // Add or update the file
            current[fileName] = {
              file: {
                contents: step.code || '',
              },
            };
          }
        }

        if (updateHappened) {
          setFiles(updatedFiles);
          await webContainer?.mount(updatedFiles);
          const pendingShellSteps = steps.filter(
            (step) =>
              step.status === StepStatus.Pending && step.type === StepType.Shell
          );
          console.log('pendingShellSteps', pendingShellSteps);
          for (let i = 0; i < pendingShellSteps.length; i++) {
            const step = pendingShellSteps[i];

            if (step?.code) await npmInstallAndRun(step?.code, webContainer);
          }

          console.log('setsteps');
          startDevServer();
          setSteps((steps) =>
            steps.map((s: Step) => {
              return {
                ...s,
                status: StepStatus.Completed,
              };
            })
          );
        }
        setIsGenerating(false);
      } catch (error) {
        console.error('Error processing steps:', error);
        setIsGenerating(false);
        return;
      }
    };
    processSteps();
  }, [steps]);

  const handleSendMessage = async () => {
    try {
      if (isGenerating) return;
      setIsGenerating(true);
      const newLlmPrompt = [
        ...llmMessages,
        {
          role: PromptRole.User,
          text: newMessage,
        },
      ];
      setNewMessage('');
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
            // console.log(data);
            console.log(data);
          },
        })
      );
      // Wait for `server-ready` event
      webContainer.on('server-ready', (port, url) => {
        console.log({ port, url });
        setUrl(url);
        setShowTerminal(false);
        setActiveTab('preview');
      });
    }
  }

  async function installDependencies() {
    if (!webContainer) return;
    // Install dependencies
    const installProcess = await webContainer.spawn('npm', ['install']);
    // Wait for install command to exit
    return installProcess.exit;
  }

  useEffect(() => {
    if (isGenerating && activeTab === 'preview') {
      setActiveTab('code');
    }
  }, [isGenerating]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="dborder-b bg-background z-10">
        <div className="flex items-center h-14 px-4">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">{appConfig.title}</h1>
            <div className="h-4 w-px bg-border mx-2"></div>
            <span className="text-sm text-muted-foreground">
              Generating Website
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => onDownload(files)}
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left side - Chat */}
        <div className="w-1/4 flex flex-col border-no bg-muted/10">
          {/* Chat header */}
          {/* <div className="border-b p-4">
            <h2 className="font-medium">Generation Progress</h2>
            <div className="mt-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {progress}% complete
              </p>
            </div>
          </div> */}

          {/* Chat messages */}
          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                YOUR PROMPT
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                {promptParam || 'Create a modern website'}
              </div>

              <div className="text-xs font-medium text-muted-foreground mt-6 mb-2">
                GENERATION LOG
              </div>
              {steps.map((step, index) => {
                const isStep = true;
                return (
                  <div
                    key={index}
                    className={cn(
                      'p-1 m-0 rounded-lg flex items-start gap-2',
                      step.status === StepStatus.Completed
                        ? 'bg-green-500/10 text-green-700 border border-green-500/20'
                        : step.status === StepStatus.Pending
                        ? 'bg-yellow-500/10 text-yellow-700 border border-yellow-500/20'
                        : step.status === StepStatus.InProgress
                        ? 'bg-blue-500/10 text-blue-700 border border-blue-500/20'
                        : 'bg-primary/10 text-primary'
                    )}
                  >
                    {step.status === StepStatus.Completed && (
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    )}
                    {step.status === StepStatus.Pending && (
                      <ChevronDown className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    )}
                    {step.status === StepStatus.InProgress && (
                      <Loader2 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5 animate-spin" />
                    )}
                    <span className="text-sm">{step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chat input - disabled during generation */}
          <div className="p-4 border-no">
            <div
              className={cn(
                'relative flex items-center gap-2 p-2 rounded-md border bg-background',
                isGenerating ? 'opacity-50' : ''
              )}
            >
              <ShineBorder shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']} />
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  isGenerating
                    ? 'Generation in progress...'
                    : 'Ask a question about the code...'
                }
                disabled={isGenerating}
                className="flex-1 bg-transparent border-0 focus:outline-none text-sm"
              />
              <Button
                size="sm"
                variant="ghost"
                disabled={isGenerating}
                onClick={handleSendMessage}
              >
                {isGenerating ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right side - Code and Preview */}
        <div className="flex-1 flex flex-col overflow-hidden pr-2 pb-2">
          <div className="relative flex-1 flex flex-col overflow-hidden border rounded-lg">
            <ShineBorder shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']} />
            {/* Tabs for Code and Preview */}
            <div className="border-b bg-background">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <div className="flex h-10 items-center px-4">
                  <TabsList className="h-9 p-0 bg-transparent">
                    <TabsTrigger
                      value="code"
                      className={cn(
                        'h-9 rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-background',
                        activeTab === 'code'
                          ? 'border-primary'
                          : 'border-transparent'
                      )}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Code
                    </TabsTrigger>
                    <TabsTrigger
                      value="preview"
                      className={cn(
                        'h-9 rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-primary data-[state=active]:bg-background',
                        activeTab === 'preview'
                          ? 'border-primary'
                          : 'border-transparent'
                      )}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
                </div>
              </Tabs>
            </div>

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

                                // Update the file in the files state
                                const updateFileContent = (
                                  path: string,
                                  content: string,
                                  filesObj: FileSystemTree
                                ): FileSystemTree => {
                                  const parts = path.split('/');
                                  const fileName = parts.pop() || '';

                                  if (parts.length === 0) {
                                    // File is at the root level
                                    return {
                                      ...filesObj,
                                      [fileName]: {
                                        file: {
                                          contents: content,
                                        },
                                      },
                                    };
                                  }

                                  // File is nested in directories
                                  const dirPath = parts.join('/');
                                  const updateDir = (
                                    currentPath: string[],
                                    currentFiles: FileSystemTree
                                  ): FileSystemTree => {
                                    if (currentPath.length === 0) {
                                      return currentFiles;
                                    }

                                    const currentPart = currentPath[0];
                                    const remainingPath = currentPath.slice(1);

                                    if (remainingPath.length === 0) {
                                      // We're at the directory containing our file
                                      const dirEntry = currentFiles[
                                        currentPart
                                      ] as DirectoryEntry;
                                      return {
                                        ...currentFiles,
                                        [currentPart]: {
                                          directory: {
                                            ...dirEntry.directory,
                                            [fileName]: {
                                              file: {
                                                contents: content,
                                              },
                                            },
                                          },
                                        },
                                      };
                                    }

                                    // We need to go deeper
                                    const dirEntry = currentFiles[
                                      currentPart
                                    ] as DirectoryEntry;
                                    return {
                                      ...currentFiles,
                                      [currentPart]: {
                                        directory: updateDir(
                                          remainingPath,
                                          dirEntry.directory
                                        ),
                                      },
                                    };
                                  };

                                  return updateDir(parts, filesObj);
                                };

                                setFiles((previousFiles) =>
                                  updateFileContent(
                                    selectedFile.path,
                                    value || '',
                                    previousFiles
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
                  <Preview url={url} />
                </div>
              )}
            </div>

            <div className="border-t bg-background">
              <Tabs
                value={showTerminal ? 'terminal' : ''}
                // onValueChange={() => setShowTerminal(!showTerminal)}
                className="w-full"
              >
                <div className="flex h-10 items-center px-4">
                  <TabsList className="h-9 p-0 bg-transparent">
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

interface PreviewProps {
  url: string;
}

export function Preview({ url }: PreviewProps) {
  return (
    <div className="w-full h-full">
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
  );
}
