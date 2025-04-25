import { Code, Download, Eye, Loader } from 'lucide-react';
import Link from 'next/link';
import { appConfig } from '@/lib/config';
import { DeployButton } from './deploy-button';
import { FileSystemTree } from '@webcontainer/api';
import Sidebar from '../sidebar';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { useDownload } from '@/hooks/useDownload';

interface ChatHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isGenerating: boolean;
  files: FileSystemTree;
}

export default function ChatHeader({
  activeTab,
  setActiveTab,
  isGenerating,
  files,
}: ChatHeaderProps) {
  const { onDownload } = useDownload();

  return (
    <>
      <header className="flex w-full items-center pt-2 px-3">
        <div className="md:w-1/4 overflow-auto flex items-center gap-1 justify-between">
          <div className="flex items-center gap-2">
            <Sidebar side="left" />
            <Link href="/">
              <h1 className="text-lg font-semibold">{appConfig.title}</h1>
            </Link>
          </div>
        </div>

        <div className="flex flex-1 overflow-auto">
          <div className="flex items-center justify-end md:justify-between w-full">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value)}
              className="hidden md:flex"
            >
              <TabsList className="grid grid-cols-3 md:grid-cols-2">
                <TabsTrigger
                  value={
                    ['chat', 'code'].includes(activeTab) ? activeTab : 'code'
                  }
                >
                  <Code className="h-4 w-4  sm:mr-2" />
                  <span className="hidden sm:inline">Code</span>
                </TabsTrigger>
                <TabsTrigger value="preview" disabled={isGenerating}>
                  {isGenerating ? (
                    <Loader className="animate-spin h-4 w-4  sm:mr-2" />
                  ) : (
                    <Eye className="h-4 w-4  sm:mr-2" />
                  )}
                  <span className="hidden sm:inline">Preview</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDownload(files)}
              >
                <Download className="h-4 w-4" />
              </Button>
              <DeployButton projectFiles={files} />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
