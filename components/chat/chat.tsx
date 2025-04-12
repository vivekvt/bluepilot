'use client';

import { useEffect, useState } from 'react';
import Editor from '@/components/chat/editor';
import { apiClient } from '@/lib/utils/apiClient';
import { DirectoryNode, FileSystemTree } from '@webcontainer/api';
import { useWebContainer } from '@/hooks/useWebContainer';
import { ShineBorder } from '@/components/magicui/shine-border';
import { useDownload } from '@/hooks/useDownload';
import { TChatMessage, TProject } from '@/types/project';
import { createClient } from '@/lib/supabase/client';
import { IStep } from '@/types/steps';
import ChatPanel from './chat-pannel';
import FileTree from './file-tree';
import ChatHeader from './chat-header';
import EditorTerminal from './terminal';

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

export default function Chat(props: IChatProps) {
  const { webContainer, runCommand } = useWebContainer();

  const [files, setFiles] = useState<FileSystemTree>(
    props?.project?.files || {}
  );

  const [selectedFile, setSelectedFile] = useState<SelectedFileInfo | null>(
    null
  );
  // const { startCloning, isCloning, cloneSelectedFile, clonedFiles } =
  //   useSequentialFileClone();
  const [messages, setMessages] = useState<TChatMessage[]>(props.messages);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('code');
  const [inputValue, setInputValue] = useState('');
  const [url, setUrl] = useState('');
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<TerminalOutput>({
    command: '',
    output: [],
  });

  const { onDownload } = useDownload();

  const init = async () => {
    try {
      if (!webContainer) return;
      setIsGenerating(true);
      console.log('init');
      // await startCloning(props.project?.files);
      // setFiles(props.project?.files);
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
    console.log('activeTab changed', activeTab);
  }, [activeTab]);

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
      {/* Header */}
      <ChatHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        files={files}
        onDownload={onDownload}
        isGenerating={isGenerating}
      />

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
                            selectedPath={selectedFile?.path || ''}
                            // isUpdatingFile={isCloning}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Code editor */}
                  <Editor
                    setFiles={setFiles}
                    selectedFile={selectedFile}
                    setSelectedFile={setSelectedFile}
                    updateFileTree={updateFileTree}
                  />
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

            {activeTab === 'code' && (
              <EditorTerminal
                showTerminal={showTerminal}
                setShowTerminal={setShowTerminal}
                terminalOutput={terminalOutput}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
