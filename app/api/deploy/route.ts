import { vercelApiClient } from '@/lib/utils/vercelApiClient';
import { withAuth } from '@/lib/with-auth';
import { FileSystemTree } from '@webcontainer/api';

function generateSubdomainId(length = 5) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface VercelDeploymentPayload {
  name: string;
  files: {
    file: string;
    data: string;
    encoding?: 'utf-8' | 'base64';
  }[];
  projectSettings?: {
    framework: string | null;
    buildCommand: string | null;
    outputDirectory: string | null;
    nodeVersion?: string;
    rootDirectory?: string | null;
  };
  target?: string;
  teamId?: string;
  meta?: Record<string, string>;
}

/**
 * Recursively process file system tree and convert to Vercel file format
 */
async function processFileSystem(
  tree: FileSystemTree,
  basePath: string = '',
  files: { file: string; data: string; encoding?: 'utf-8' | 'base64' }[] = []
): Promise<{ file: string; data: string; encoding?: 'utf-8' | 'base64' }[]> {
  for (const [name, node] of Object.entries(tree)) {
    const currentPath = basePath ? `${basePath}/${name}` : name;

    if ('directory' in node) {
      // Recursively process directory contents
      await processFileSystem(node.directory, currentPath, files);
    } else if ('file' in node) {
      if ('contents' in node.file) {
        // Process file contents
        const content = node.file.contents;
        if (typeof content === 'string') {
          // String content
          files.push({
            file: currentPath,
            data: content,
            encoding: 'utf-8',
          });
        } else {
          // Binary content (Uint8Array)
          files.push({
            file: currentPath,
            data: Buffer.from(content).toString('base64'),
            encoding: 'base64',
          });
        }
      }
      // Symlinks are not directly supported in Vercel deployments API
      // We would need to resolve them before deployment
    }
  }

  return files;
}

export const POST = withAuth(async (request: Request) => {
  // Parse the request body
  const body = await request.json();

  const { files, projectId } = body;

  const subdomain = `bluepilot-${generateSubdomainId(5).toLowerCase()}`;

  if (!files || !projectId) {
    throw new Error('Missing required fields');
  }

  // Process template files into Vercel's expected format
  const processedFiles = await processFileSystem(files);

  // Prepare Vercel API payload
  const payload: VercelDeploymentPayload = {
    name: subdomain,
    files: processedFiles,
    projectSettings: {
      framework: 'vite',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      nodeVersion: '20.x',
      rootDirectory: null,
    },
    target: 'production',
    meta: {
      deployedFrom: 'bluepilot',
      deploymentType: 'react-template',
    },
  };

  // Make the deployment request to Vercel API
  const vercelResponse = await vercelApiClient.post(
    '/v13/deployments',
    payload
  );

  // Return deployment information
  const deploymentData = vercelResponse.data;

  return new Response(
    JSON.stringify({
      success: true,
      deploymentUrl: deploymentData.url,
      deploymentId: deploymentData.id,
      projectId: deploymentData.projectId,
      inspectUrl: deploymentData.inspectorUrl,
    }),
    {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    }
  );
});
