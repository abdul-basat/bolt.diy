import type { ActionFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { FlowDiagramAgent } from '~/lib/agents/diagram/FlowDiagramAgent';

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const projectName = formData.get('projectName') as string;
    const projectPath = formData.get('projectPath') as string;
    const diagramType = (formData.get('diagramType') as string) || 'flowchart';
    const generateSVG = formData.get('generateSVG') === 'true';
    const includeUserFlow = formData.get('includeUserFlow') !== 'false';
    const includeDataFlow = formData.get('includeDataFlow') !== 'false';
    const prdPath = formData.get('prdPath') as string;

    if (!projectName) {
      return json({ error: 'Project name is required' }, { status: 400 });
    }

    const agent = new FlowDiagramAgent();
    const result = await agent.execute({
      projectName,
      projectPath: projectPath || undefined,
      options: {
        diagramType: diagramType as any,
        generateSVG,
        includeUserFlow,
        includeDataFlow,
        prdPath: prdPath || undefined,
      },
    });

    if (result.success) {
      return json({
        success: true,
        message: result.message,
        outputPath: result.outputPath,
        content: result.content,
        metadata: result.metadata,
      });
    } else {
      return json({
        success: false,
        message: result.message,
        errors: result.errors,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Diagram generation error:', error);
    return json({
      success: false,
      message: 'Internal server error',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }, { status: 500 });
  }
};