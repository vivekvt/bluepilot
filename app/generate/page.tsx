'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import { FileItem, Step, StepStatus, StepType } from '@/types';
import { parseXml } from '@/src/utils/steps';
import { useWebContainer } from '@/src/hooks/useWebContainer';
import { appConfig } from '@/src/config';
import { ShineBorder } from '@/src/components/magicui/shine-border';
import { WebContainer } from '@webcontainer/api';

interface LLMPrompt {
  role: PromptRole;
  text: string;
}

enum PromptRole {
  User = 'user',
  Assistant = 'assistant',
}

export default function GeneratePage() {
  const webContainer = useWebContainer();
  const searchParams = useSearchParams();
  const promptParam = searchParams?.get('prompt') || '';

  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [llmMessages, setLlmMessages] = useState<LLMPrompt[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [activeTab, setActiveTab] = useState('code');
  const [newMessage, setNewMessage] = useState('');

  const init = async () => {
    try {
      if (isGenerating) return;
      setIsGenerating(true);
      const response = await apiClient.post<{
        prompts: string[];
        uiPrompts: string[];
      }>('/api/template', {
        prompt: promptParam,
      });

      const { prompts, uiPrompts } = response.data;

      if (!(prompts?.length > 0)) {
        throw new Error('Give a valid prompt');
      }

      const newSteps = uiPrompts?.map((p) => parseXml(p)).flat() || [];
      setSteps(newSteps);

      const newLlmPrompts = [...prompts, promptParam].map((message) => ({
        role: PromptRole.User,
        text: message,
      }));
      setIsGenerating(false);
      startChat(newLlmPrompts);
    } catch (error: any) {
      setIsGenerating(false);
      alert(`Error: ${error.message}`);
    }
  };

  useEffect(() => {
    if (!promptParam) return;
    init();
  }, [promptParam]);

  const startChat = async (newLlmPrompts: LLMPrompt[]) => {
    try {
      console.log('startChat');
      if (isGenerating) return;
      setIsGenerating(true);
      const response = await apiClient.post('/api/chat', {
        messages: newLlmPrompts,
      });
      const newSteps = parseXml(response?.data?.answer);
      setSteps((steps) => [...steps, ...newSteps]);
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
    let originalFiles = [...files];
    let updateHappened = false;
    steps
      .filter(({ status }) => status === StepStatus.Pending)
      .map((step) => {
        updateHappened = true;
        if (step?.type === StepType.File) {
          let parsedPath = step.path?.split('/') ?? []; // ["src", "components", "App.tsx"]
          let currentFileStructure = [...originalFiles]; // {}
          let finalAnswerRef = currentFileStructure;

          let currentFolder = '';
          while (parsedPath.length) {
            currentFolder = `${currentFolder}/${parsedPath[0]}`;
            let currentFolderName = parsedPath[0];
            parsedPath = parsedPath.slice(1);

            if (!parsedPath.length) {
              // final file
              let file = currentFileStructure.find(
                (x) => x.path === currentFolder
              );
              if (!file) {
                currentFileStructure.push({
                  name: currentFolderName,
                  type: 'file',
                  path: currentFolder,
                  content: step.code,
                });
              } else {
                file.content = step.code;
              }
            } else {
              /// in a folder
              let folder = currentFileStructure.find(
                (x) => x.path === currentFolder
              );
              if (!folder) {
                // create the folder
                currentFileStructure.push({
                  name: currentFolderName,
                  type: 'folder',
                  path: currentFolder,
                  children: [],
                });
              }

              currentFileStructure = currentFileStructure.find(
                (x) => x.path === currentFolder
              )!.children!;
            }
          }
          originalFiles = finalAnswerRef;
        }
      });

    if (updateHappened) {
      setFiles(originalFiles);
      setSteps((steps) =>
        steps.map((s: Step) => {
          return {
            ...s,
            status: StepStatus.Completed,
          };
        })
      );
    }
  }, [steps, files]);

  const createMountStructure = (files: FileItem[]): Record<string, any> => {
    const mountStructure: Record<string, any> = {};

    const processFile = (file: FileItem): any => {
      if (file.type === 'folder') {
        // Create a directory entry
        const directoryContents: Record<string, any> = {};

        // Process children
        if (file.children?.length) {
          file.children.forEach((child) => {
            directoryContents[child.name] = processFile(child);
          });
        }

        return {
          directory: directoryContents,
        };
      } else if (file.type === 'file') {
        // Create a file entry with contents
        return {
          file: {
            contents: file.content || '',
          },
        };
      }

      return null;
    };

    // Process each top-level file/folder
    files.forEach((file) => {
      mountStructure[file.name] = processFile(file);
    });

    return mountStructure;
  };

  useEffect(() => {
    const mountStructure = createMountStructure(files);

    // Mount the structure if WebContainer is available
    console.log({ mountStructure });
    webContainer
      ?.mount(mountStructure)
      .then(() => {
        console.log('Files Mounted');
      })
      .catch((error) => {
        console.error('Error mounting', error);
      });
  }, [files, webContainer]);

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
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-4 w-4" />
              <span>Deploy</span>
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
                        {files?.map((file) => (
                          <FileTree
                            key={file.path}
                            file={file}
                            onFileClick={(file) => {
                              console.log(file);
                              setSelectedFile(file);
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
                          <span>{selectedFile?.path}</span>
                        </div>
                      )}
                      {selectedFile && (
                        <div className="h-[calc(100%-25px)]">
                          <Editor
                            value={selectedFile?.content || ''}
                            language={getLanguageForFile(
                              selectedFile?.path || ''
                            )}
                            onChange={(value) => {
                              // TODO
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
                  {webContainer && <Preview webContainer={webContainer} />}
                </div>
              )}
            </div>

            <div className="border-t bg-background">
              <Tabs
                value={activeTab}
                // onValueChange={setActiveTab}
                className="w-full"
              >
                <div className="flex h-10 items-center px-4">
                  <TabsList className="h-9 p-0 bg-transparent">
                    <TabsTrigger
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FileTreeProps {
  file: FileItem;
  onFileClick: (file: FileItem) => void;
}

export function FileTree({ file, onFileClick }: FileTreeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (file.type === 'folder') {
    return (
      <div key={file.path}>
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
          <span className="truncate text-xs">{file.name}</span>
        </button>
        {isExpanded && (
          <div className="ml-4 pl-2 border-l border-border/50 mt-1">
            {file?.children?.map((file2) => (
              <FileTree
                key={file2.path}
                file={file2}
                onFileClick={(f) => onFileClick(f)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      key={file.path}
      onClick={() => onFileClick(file)}
      className="ml-0 w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md text-left hover:bg-muted"
    >
      <FileCode className="h-4 w-4 flex-shrink-0" />
      <span className="truncate text-xs">{file.name}</span>
    </button>
  );
}

interface PreviewProps {
  webContainer: WebContainer;
}

export function Preview({ webContainer }: PreviewProps) {
  const [url, setUrl] = useState<string | null>(null);

  // const run = async () => {
  //   console.log('run');
  //   const exitCode = await installDependencies();
  //   if (exitCode !== 0) {
  //     throw new Error('Installation failed');
  //   }
  //   startDevServer();
  // };

  // const installDependencies = async () => {
  //   const installProcess = await webContainer.spawn('npm', ['install']);

  //   console.log('installProcess.exit', installProcess.exit);

  //   // installProcess.output.pipeTo(
  //   //   new WritableStream({
  //   //     write(data) {
  //   //       console.log(data);
  //   //     },
  //   //   })
  //   // );
  //   return installProcess.exit;
  // };

  // async function startDevServer() {
  //   // Run `npm run start` to start the Express app
  //   await webContainer.spawn('npm', ['run', 'dev']);

  //   // Wait for `server-ready` event
  //   webContainer.on('server-ready', (port, url) => {
  //     console.log({ port, url });
  //     setUrl(url);
  //   });
  // }

  // useEffect(() => {
  //   // run();
  // }, []);

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
