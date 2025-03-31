import { Step, StepStatus, StepType } from '@/types';
import { nanoid } from 'nanoid';

export function parseXml(response: string): Step[] {
  // Extract the XML content between <boltArtifact> tags
  const xmlMatch = response.match(
    /<boltArtifact[^>]*>([\s\S]*?)<\/boltArtifact>/
  );

  if (!xmlMatch) {
    return [];
  }

  const xmlContent = xmlMatch[1];
  const steps: Step[] = [];
  let stepId = 1;

  // Extract artifact title
  const titleMatch = response.match(/title="([^"]*)"/);
  const artifactTitle = titleMatch ? titleMatch[1] : 'Project Files';

  // Add initial artifact step
  steps.push({
    id: nanoid(),
    title: artifactTitle,
    description: '',
    type: StepType.Title,
    status: StepStatus.Pending,
  });

  // Regular expression to find boltAction elements
  const actionRegex =
    /<boltAction\s+type="([^"]*)"(?:\s+filePath="([^"]*)")?>([\s\S]*?)<\/boltAction>/g;

  let match;
  while ((match = actionRegex.exec(xmlContent)) !== null) {
    const [, type, filePath, content] = match;

    if (type === 'file') {
      // File creation step
      steps.push({
        id: nanoid(),
        title: `Create ${filePath || 'file'}`,
        description: '',
        type: StepType.File,
        status: StepStatus.Pending,
        code: content.trim(),
        path: filePath,
      });
    } else if (type === 'shell') {
      // Shell command step
      steps.push({
        id: nanoid(),
        title: 'Run command',
        description: '',
        type: StepType.Shell,
        status: StepStatus.Pending,
        code: content.trim(),
      });
    }
  }

  return steps;
}
