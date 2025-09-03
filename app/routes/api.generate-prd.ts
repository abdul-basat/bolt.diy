import type { ActionFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { PRDAgent } from '~/lib/agents/prd/PRDAgent';

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const projectName = formData.get('projectName') as string;
    const projectPath = formData.get('projectPath') as string;
    const includeUserStories = formData.get('includeUserStories') !== 'false';
    const includeTechnicalNotes = formData.get('includeTechnicalNotes') !== 'false';
    const includeRisks = formData.get('includeRisks') !== 'false';

    if (!projectName) {
      return json({ error: 'Project name is required' }, { status: 400 });
    }

    const agent = new PRDAgent();
    const result = await agent.execute({
      projectName,
      projectPath: projectPath || undefined,
      options: {
        includeUserStories,
        includeTechnicalNotes,
        includeRisks,
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
    console.error('PRD generation error:', error);
    return json({
      success: false,
      message: 'Internal server error',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }, { status: 500 });
  }
};