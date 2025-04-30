'use client';

import { useEffect, useState } from 'react';
import { Code, Eye, Loader, MessageSquare } from 'lucide-react';
import Editor from '@/components/project/editor';
import { apiClient } from '@/lib/utils/apiClient';
import { DirectoryNode, FileSystemTree } from '@webcontainer/api';
import { useWebContainer } from '@/hooks/useWebContainer';
import { ShineBorder } from '@/components/magicui/shine-border';
import { TChatMessage, TProject } from '@/types/project';
import { createClient } from '@/lib/supabase/client';
import { IStep } from '@/types/steps';
import ChatPanel from './chat-pannel';
import FileTree from './file-tree';
import ChatHeader from './chat-header';
import EditorTerminal from './terminal';
import { BrowserPreview } from './browser-preview';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import ProjectLoadingSkeleton from './project-loading-skeleton';
import { samplePackageLockJson } from './files';

interface LLMPrompt {
  role: PromptRole;
  content: string;
}

enum PromptRole {
  User = 'user',
  Assistant = 'assistant',
}

// For selected file state
export interface SelectedFileInfo {
  path: string;
  content: string;
}

export interface IChatProps {
  project: TProject;
  messages: TChatMessage[];
}

export interface TerminalOutput {
  command: string;
  output: string[];
}

const supabase = createClient();

export default function Project(props: IChatProps) {
  const { webContainer, runCommand } = useWebContainer();

  const [files, setFiles] = useState<FileSystemTree>(
    props?.project?.files || {}
  );

  const [selectedFile, setSelectedFile] = useState<SelectedFileInfo | null>(
    null
  );
  const [messages, setMessages] = useState<TChatMessage[]>(props.messages);
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectSetupComplete, setProjectSetupComplete] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [inputValue, setInputValue] = useState('');
  const [url, setUrl] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<TerminalOutput>({
    command: '',
    output: [],
  });

  const [pendingSteps, setPendingSteps] = useState<IStep[]>([]);
  const [processedStepIds, setProcessedStepIds] = useState<Set<string>>(
    new Set()
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const init = async () => {
    try {
      if (!webContainer) return;
      await webContainer.mount(props.project?.files);
      console.log('npm install');
      const npmInstallPromise = runCommand('npm', ['install']);
      setProjectSetupComplete(true);

      if (!(props?.messages?.length > 1)) {
        console.log('Starting chat');
        await startChat([
          { role: PromptRole.User, content: props.project.prompt },
        ]);
      }

      setIsGenerating(true);
      npmInstallPromise
        .then(() => {
          console.log('npm install completed, starting dev server');
          setIsGenerating(false);
          return startDevServer();
        })
        .catch((error) => {
          console.error('Error during npm install:', error);
          setIsGenerating(false);
        });
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
    // const { error: messageError, data } = await supabase
    //   .from('messages')
    //   .insert([
    //     {
    //       project_id: props?.project.id,
    //       role,
    //       text: role === 'user' ? content : '',
    //       content: role === 'assistant' ? content : null,
    //     },
    //   ])
    //   .select();
    // if (messageError || !data?.[0]) {
    //   alert(`Error while saving message:`);
    //   return;
    // }
    // setMessages((prev) => [...prev, data?.[0]]);
  };

  useEffect(() => {
    const processSteps = async () => {
      if (isProcessing || pendingSteps.length === 0) {
        return;
      }

      setIsProcessing(true);
      try {
        // Filter out steps we've already processed
        const newSteps = pendingSteps.filter((step) => {
          const stepId = `${step.action}-${step.path}`;
          return !processedStepIds.has(stepId);
        });

        if (newSteps.length === 0) {
          setPendingSteps([]);
          return;
        }

        console.log(`Processing ${newSteps.length} steps`);
        await processLLMSteps(newSteps);

        // Update processed steps
        const updatedProcessedIds = new Set(processedStepIds);
        newSteps.forEach((step) => {
          const stepId = `${step.action}-${step.path}`;
          updatedProcessedIds.add(stepId);
        });

        setProcessedStepIds(updatedProcessedIds);
        setPendingSteps([]); // Clear pending steps after processing
      } finally {
        setIsProcessing(false);
      }
    };

    processSteps();
  }, [pendingSteps, processedStepIds, isProcessing]);

  const startChat = async (newLlmPrompts: LLMPrompt[]) => {
    try {
      if (isGenerating) return;
      setIsGenerating(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      const response = await apiClient.post(
        '/api/chat',
        {
          messages: newLlmPrompts,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          responseType: 'stream',
          adapter: 'fetch',
        }
      );

      const reader = response.data.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        try {
          const chunk = decoder.decode(value, { stream: true });
          const allSteps = JSON.parse(chunk);

          // Add all steps to pending - our useEffect will handle filtering
          setPendingSteps(allSteps);
        } catch (error) {
          console.error('Error parsing update:', error);
        }
      }

      // await startDevServer();

      // await saveMessageToDB('assistant', data?.steps);
      // if (data?.success && data?.steps?.length > 0) {
      //   await applyLLMSteps(data?.steps);
      // }

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

  async function processLLMSteps(steps: IStep[]) {
    if (!webContainer) return;

    // Helper function to update the FileSystemTree recursively

    // Process each step
    for await (const step of steps) {
      try {
        console.log(`step: ${step.action} ${step.path}`);
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
        console.log(`compeleted: step: ${step.action} ${step.path}`);
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

  // useEffect(() => {
  //   const debouncedUpdateFiles = debounce(async () => {
  //     return; // remove this later
  //     const { error } = await supabase
  //       .from('projects')
  //       .update({
  //         files,
  //         updated_at: new Date().toISOString(),
  //       })
  //       .eq('id', props.project.id);

  //     if (error) {
  //       alert(`Error while saving files`);
  //     }
  //   }, 1000); // 1 second delay

  //   if (files !== props.project?.files) {
  //     debouncedUpdateFiles();
  //   }

  //   return () => {
  //     debouncedUpdateFiles.cancel();
  //   };
  // }, [files, props.project?.id]);

  return (
    <div className="flex flex-col h-screen relative min-h-800">
      {!projectSetupComplete && (
        <div className="fixed top-0 left-0 w-full z-50 bg-background">
          <ProjectLoadingSkeleton />
        </div>
      )}
      {/* Header */}
      <ChatHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        files={files}
        isGenerating={isGenerating}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <div
          className={`pl-2 pb-3 pt-2 pr-2 md:pr-0 ${
            activeTab === 'chat'
              ? 'w-full md:w-1/4'
              : 'hidden md:block md:w-1/4'
          }`}
        >
          <ChatPanel
            project={props.project}
            messages={messages}
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
          />
        </div>

        {/* Right side - Code and Preview */}
        <div
          className={`flex-1 flex flex-col overflow-hidden p-3 ${
            activeTab === 'chat' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="relative flex-1 flex flex-col overflow-hidden border rounded-lg">
            {isGenerating && (
              <ShineBorder shineColor={['#A07CFE', '#FE8FB5', '#FFBE7B']} />
            )}
            {/* Code Editor or Preview */}
            {activeTab === 'preview' ? (
              <BrowserPreview url={url} />
            ) : (
              <>
                <div className="flex h-full w-full">
                  <div
                    className={`${
                      selectedFile?.path ? 'hidden md:block' : ''
                    } md:w-1/5 border-r overflow-auto bg-muted/40 p-1`}
                  >
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
                          onFileClick={(path, content) =>
                            setSelectedFile({ path, content })
                          }
                          selectedPath={selectedFile?.path || ''}
                        />
                      ))}
                    </div>
                  </div>
                  <Editor
                    setFiles={setFiles}
                    selectedFile={selectedFile}
                    setSelectedFile={setSelectedFile}
                    updateFileTree={updateFileTree}
                  />
                </div>
                <EditorTerminal
                  showTerminal={showTerminal}
                  setShowTerminal={setShowTerminal}
                  terminalOutput={terminalOutput}
                />
              </>
            )}
          </div>
        </div>
      </div>
      <div className="pb-3 px-2 md:hidden flex">
        <Tabs
          className="m-auto"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              <span className="">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="code">
              <Code className="h-4 w-4 mr-2" />
              <span className="">Code</span>
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={isGenerating}>
              {isGenerating ? (
                <Loader className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              <span className="">Preview</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
