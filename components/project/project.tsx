'use client';

import { useEffect, useState } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { Code, Eye, Loader, MessageSquare } from 'lucide-react';
import Editor from '@/components/project/editor';
import {
  DirectoryNode,
  FileSystemTree,
  WebContainerProcess,
} from '@webcontainer/api';
import { useWebContainer } from '@/hooks/useWebContainer';
import { ShineBorder } from '@/components/magicui/shine-border';
import { TChatMessage, TProject } from '@/types/project';
import { IStep, IStepAction, LoadingStep } from '@/types/steps';
import ChatPanel from './chat-panel';
import FileTree from './file-tree';
import ChatHeader from './chat-header';
import EditorTerminal from './terminal';
import { BrowserPreview } from './browser-preview';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import ProjectLoadingSkeleton from './project-loading-skeleton';
import { stepsSchema } from '@/lib/utils/steps';
import { set, z } from 'zod';
import { useStepsProcessor } from '@/hooks/useStepsProcessor';
import { useSaveFiles } from '@/hooks/file';
import { Button } from '../ui/button';
import { showConfetti } from '@/lib/utils/confiti';
import { convertFilesToString } from '@/lib/utils/fileTree';
import { IPromptInput, PromptRole } from '@/types/message';

const enhancedPrompt = (userPrompt: string) => `
Based on the current project setup, create a fully functional, modern, and well-designed web application that reflects the following idea:

"${userPrompt}"

Use elegant layout, Tailwind CSS styling, Lucide icons where appropriate, and consider UX best practices throughout.
`;

const enhanceFollowupPrompt = (userPrompt: string) => `
Please update the existing project to reflect the following change or improvement:

"${userPrompt}"

Ensure consistency with the current design, use Tailwind CSS, and apply clean, accessible React component patterns.
`;

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

export default function Project(props: IChatProps) {
  const { webContainer, runCommand } = useWebContainer();

  const [files, setFiles] = useState<FileSystemTree>(
    props?.project?.files || {}
  );

  const [selectedFile, setSelectedFile] = useState<SelectedFileInfo | null>(
    null
  );
  const [messages, setMessages] = useState<TChatMessage[]>(props.messages);
  const [devServerProcess, setDevServerProcess] =
    useState<WebContainerProcess | null>(null);
  const [customLoading, setIsGenerating] = useState(false);
  const [projectSetupComplete, setProjectSetupComplete] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [inputValue, setInputValue] = useState('');
  const [url, setUrl] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<TerminalOutput>({
    command: '',
    output: [],
  });
  const [loadingSteps, setLoadingSteps] = useState<LoadingStep[]>([]);

  const {
    object: stepsArray,
    submit,
    isLoading,
    stop,
    error,
  } = useObject({
    api: '/api/chat',
    schema: z.array(stepsSchema),
  });
  // useSaveFiles(files, props.project);

  const isGenerating = isLoading || customLoading;

  const sendMessage = async (newUserMessage: IPromptInput) => {
    setLoadingSteps([]);
    const fileClone = JSON.parse(JSON.stringify(files));
    delete fileClone['package-lock.json'];
    const filesString = convertFilesToString(fileClone);
    const newMessages = [
      { role: PromptRole.USER, content: filesString },
      newUserMessage,
    ];
    submit(newMessages);
  };

  // Function to process a single step
  const processStep = async (step: IStep) => {
    if (!webContainer) return;
    if (step.action === IStepAction.Explain) {
      setLoadingSteps((prev) => [
        ...prev,
        {
          id: `explain`,
          path: step.content || '',
          action: step.action,
          status: 'success',
        },
      ]);
      return;
    }
    setIsGenerating(true);
    setLoadingSteps((prev) => [
      ...prev,
      {
        id: `${step.action}${step.path}`,
        path: step.path?.split('/')?.pop() || '',
        action: step.action,
        status: 'loading',
      },
    ]);
    switch (step.action) {
      case 'create': {
        setSelectedFile({ content: step.content || '', path: step.path });
        const pathParts = step.path.split('/').filter(Boolean);
        const dirPath =
          pathParts.length > 1 ? '/' + pathParts.slice(0, -1).join('/') : '/';
        if (dirPath !== '/') {
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

        setSelectedFile({ content: step.content, path: step.path });
        await webContainer.fs.writeFile(step.path, step.content, 'utf8');
        setFiles((prev) =>
          updateFileTree(prev, step.path, 'update', step.content)
        );
        break;
      }
      case 'delete': {
        await webContainer.fs.rm(step.path, { recursive: true, force: true });
        setFiles((prev) => updateFileTree(prev, step.path, 'delete'));
        break;
      }
      case 'run': {
        const [command, ...args] = step.path.split(' ');
        await runCommand(command, args);
        const packageJsonContent = await webContainer.fs.readFile(
          'package.json',
          'utf8'
        );
        setFiles((prev) =>
          updateFileTree(prev, 'package.json', 'update', packageJsonContent)
        );
        const packageLockJsonContent = await webContainer.fs.readFile(
          'package-lock.json',
          'utf8'
        );
        setFiles((prev) =>
          updateFileTree(
            prev,
            'package-lock.json',
            'update',
            packageLockJsonContent
          )
        );

        break;
      }
      default:
        throw new Error(`Unknown action: ${step.action}`);
    }
    setLoadingSteps((prev) =>
      prev?.map((s) =>
        s.id === `${step.action}${step.path}` ? { ...s, status: 'success' } : s
      )
    );
    setIsGenerating(false);
  };

  // Use our custom hook to process steps
  const processingStatus = useStepsProcessor(
    stepsArray,
    isLoading,
    processStep,
    startDevServer
  );

  const init = async () => {
    try {
      if (!webContainer) return;
      await webContainer.mount(props.project?.files);
      const start = Date.now();
      await runCommand('npm', ['ci']);
      const end = Date.now();
      console.log(`npm install took ${(end - start) / 1000} seconds`);
      setProjectSetupComplete(true);

      if (!(props?.messages?.length > 1)) {
        sendMessage({
          role: PromptRole.USER,
          content: enhancedPrompt(props.project.prompt),
          // content: props.project.prompt,
        });
      } else {
        startDevServer();
      }
    } catch (error: any) {
      setIsGenerating(false);
      alert(`Error: ${error.message}`);
    }
  };

  useEffect(() => {
    if (webContainer && !projectSetupComplete) {
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

  const updateFileTree = (
    tree: FileSystemTree,
    path: string,
    action: string,
    content?: string
  ): FileSystemTree => {
    // Create a deep copy of the tree to avoid mutation
    const newTree = JSON.parse(JSON.stringify(tree));

    const pathParts = path.split('/').filter(Boolean); // Split and remove empty parts

    // Handle root-level file
    if (pathParts.length === 1) {
      const fileName = pathParts[0];

      if (action === 'create' || action === 'update') {
        if (content !== undefined) {
          newTree[fileName] = { file: { contents: content } };
        }
      } else if (action === 'delete') {
        delete newTree[fileName];
      }

      return newTree;
    }

    // For nested files/directories
    let current = newTree;
    const lastIndex = pathParts.length - 1;

    // Traverse or create nested directories
    for (let i = 0; i < lastIndex; i++) {
      const part = pathParts[i];

      // Create directory if it doesn't exist
      if (!current[part]) {
        current[part] = { directory: {} };
      } else if (!('directory' in current[part])) {
        // If it exists but isn't a directory, convert it to a directory
        current[part] = { directory: {} };
      }

      current = (current[part] as DirectoryNode).directory;
    }

    const fileName = pathParts[lastIndex];

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
      // 'run' doesn't affect the file tree
    }

    return newTree;
  };

  const handleSendMessage = async (newValue: String) => {
    try {
      if (isGenerating) return;
      // setIsGenerating(true);
      const newLlmPrompt = {
        role: PromptRole.USER,
        content: enhanceFollowupPrompt(inputValue),
      };
      // setInputValue('');
      // await saveMessageToDB('user', newValue);
      // setIsGenerating(false);
      console.log('Sending followup message:', newLlmPrompt);
      sendMessage(newLlmPrompt);
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

      setLoadingSteps((prev) => [
        ...prev,
        {
          id: 'devServer',
          path: 'npm run dev',
          action: IStepAction.Run,
          status: 'loading',
        },
      ]);
      setTerminalOutput((prev) => ({
        ...prev,
        command: 'npm run dev',
        output: [...prev.output, '> npm run dev'],
      }));
      setShowTerminal(true);
      const spawnProcess = await webContainer.spawn('npm', ['run', 'dev']);
      setDevServerProcess(spawnProcess);

      let buffer = '';
      spawnProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            buffer += data;

            const lines = buffer.split('\n');

            buffer = lines.pop() || '';

            setTerminalOutput((prev) => ({
              ...prev,
              output: [
                ...prev.output,
                ...lines?.filter((line) => line !== '\r'),
              ],
            }));
          },
          close() {
            if (buffer) {
              setTerminalOutput((prev) => ({
                ...prev,
                output: [...prev.output, buffer],
              }));
            }
          },
        })
      );
      // Wait for `server-ready` event
      webContainer.on('server-ready', (port, url) => {
        setIsGenerating(false);
        setUrl(url);
        setShowTerminal(false);
        setLoadingSteps((prev) =>
          prev?.map((s) =>
            s.id === `devServer` ? { ...s, status: 'success' } : s
          )
        );
        setActiveTab('preview');
        setTimeout(() => {
          if (terminalOutput?.output?.includes('Error')) {
            alert('Error: Please check the terminal output for details.');
            return;
          } else {
            showConfetti();
          }
        }, 6000);
      });
    }
  }

  useEffect(() => {
    if (isGenerating && activeTab === 'preview') {
      setActiveTab('code');
    }
  }, [isGenerating]);

  return (
    <div className="flex flex-col h-screen relative min-h-800">
      {!projectSetupComplete && (
        <div className="fixed top-0 left-0 w-full z-50 bg-background">
          <ProjectLoadingSkeleton />
        </div>
      )}
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
            loadingSteps={loadingSteps}
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
            <>
              <div
                className={`absolute w-full h-full ${
                  activeTab === 'preview' ? 'block' : 'hidden'
                }`}
              >
                <BrowserPreview url={url} />
              </div>
              <div
                className={`w-full h-full flex flex-col ${
                  activeTab === 'preview' ? 'hidden' : 'block'
                }`}
              >
                <div className="flex flex-1 overflow-hidden">
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
                <div className="flex flex-col">
                  <EditorTerminal
                    showTerminal={showTerminal}
                    setShowTerminal={setShowTerminal}
                    terminalOutput={terminalOutput}
                  />
                </div>
              </div>
            </>
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
