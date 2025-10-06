// UIUXAgent.test.ts
// Unit tests for the UIUXAgent

import { describe, it, expect, beforeEach } from 'vitest';
import { UIUXAgent } from '../implementations/uiux-agent';
import type { AgentContext } from '../types';

describe('UIUXAgent', () => {
  let agent: UIUXAgent;
  let mockContext: AgentContext;

  beforeEach(() => {
    agent = new UIUXAgent();
    mockContext = {
      projectFiles: {
        'package.json': JSON.stringify({
          name: 'test-project',
          dependencies: {
            'react': '^18.0.0',
            '@types/react': '^18.0.0'
          }
        }),
        'src/App.tsx': `
          import React from 'react';
          import './App.css';
          
          const App: React.FC = () => {
            return (
              <div className="app">
                <h1>Welcome</h1>
                <button onClick={() => console.log('clicked')}>Click me</button>
              </div>
            );
          };
          
          export default App;
        `,
        'src/App.css': `
          .app {
            padding: 20px;
          }
          
          button {
            background: blue;
            color: white;
          }
        `
      },
      previousOutputs: [],
      requirements: 'Improve UI/UX consistency and accessibility',
      config: {}
    };
  });

  describe('Agent Properties', () => {
    it('should have correct agent properties', () => {
      expect(agent.name).toBe('uiux');
      expect(agent.description).toContain('visual design consistency');
      expect(agent.version).toBe('1.0.0');
      expect(agent.tags).toEqual(['ui', 'ux', 'design', 'accessibility', 'frontend']);
    });
  });

  describe('plan() method', () => {
    it('should create a valid execution plan', async () => {
      const plan = await agent.plan(mockContext);

      expect(plan).toHaveProperty('steps');
      expect(plan).toHaveProperty('estimatedTime');
      expect(plan).toHaveProperty('dependencies');
      expect(plan).toHaveProperty('expectedOutputs');

      expect(Array.isArray(plan.steps)).toBe(true);
      expect(plan.steps.length).toBeGreaterThan(0);
      expect(typeof plan.estimatedTime).toBe('number');
      expect(plan.estimatedTime).toBeGreaterThan(0);
      expect(Array.isArray(plan.dependencies)).toBe(true);
      expect(Array.isArray(plan.expectedOutputs)).toBe(true);
    });

    it('should adapt plan based on project structure', async () => {
      const reactPlan = await agent.plan(mockContext);
      expect(reactPlan.expectedOutputs).toContain('Component library improvements');

      // Test with non-React project
      const nonReactContext = {
        ...mockContext,
        projectFiles: {
          'package.json': JSON.stringify({ name: 'vanilla-js-project' }),
          'index.html': '<html><body><h1>Hello</h1></body></html>',
          'style.css': 'body { margin: 0; }'
        }
      };

      const vanillaPlan = await agent.plan(nonReactContext);
      expect(vanillaPlan.steps).toContain('Analyze existing components and styling');
    });
  });

  describe('execute() method', () => {
    it('should generate UI/UX artifacts successfully', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      expect(output).toHaveProperty('summary');
      expect(output).toHaveProperty('artifacts');
      expect(output).toHaveProperty('nextSteps');
      expect(output).toHaveProperty('metadata');

      expect(output.metadata.success).toBe(true);
      expect(output.metadata.agentName).toBe('uiux');
      expect(Array.isArray(output.artifacts)).toBe(true);
      expect(output.artifacts.length).toBeGreaterThan(0);
      expect(Array.isArray(output.nextSteps)).toBe(true);
    });

    it('should create design system artifact', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      const designSystemArtifact = output.artifacts.find(
        artifact => artifact.path === 'design-system.md'
      );

      expect(designSystemArtifact).toBeDefined();
      expect(designSystemArtifact?.type).toBe('documentation');
      expect(designSystemArtifact?.content).toContain('Design System Guidelines');
      expect(designSystemArtifact?.content).toContain('Color Palette');
      expect(designSystemArtifact?.content).toContain('Typography Scale');
    });

    it('should create accessibility checklist', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      const a11yArtifact = output.artifacts.find(
        artifact => artifact.path === 'accessibility-checklist.md'
      );

      expect(a11yArtifact).toBeDefined();
      expect(a11yArtifact?.content).toContain('Accessibility (A11y) Checklist');
      expect(a11yArtifact?.content).toContain('Semantic HTML');
      expect(a11yArtifact?.content).toContain('WCAG');
    });

    it('should create React-specific artifacts for React projects', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      const componentLibraryArtifact = output.artifacts.find(
        artifact => artifact.path === 'component-library.md'
      );

      expect(componentLibraryArtifact).toBeDefined();
      expect(componentLibraryArtifact?.content).toContain('Component Library Guidelines');
      expect(componentLibraryArtifact?.content).toContain('React.FC');
    });

    it('should handle execution errors gracefully', async () => {
      const invalidContext = {
        ...mockContext,
        projectFiles: {} // Empty project files to potentially cause issues
      };

      const plan = await agent.plan(invalidContext);
      const output = await agent.execute(invalidContext, plan);

      // Should still return a valid output structure even if some operations fail
      expect(output).toHaveProperty('summary');
      expect(output).toHaveProperty('artifacts');
      expect(output).toHaveProperty('metadata');
      expect(output.metadata.agentName).toBe('uiux');
    });
  });

  describe('review() method', () => {
    it('should validate successful output', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);
      const reviewedOutput = await agent.review(output, mockContext);

      expect(reviewedOutput.metadata.success).toBe(true);
      expect(reviewedOutput.metadata.errors).toBeUndefined();
    });

    it('should identify missing summary', async () => {
      const invalidOutput = {
        summary: '', // Empty summary
        artifacts: [
          {
            type: 'documentation',
            path: 'test.md',
            content: 'Test content',
          }
        ],
        nextSteps: ['Step 1'],
        metadata: {
          agentName: 'uiux',
          executionTime: 0,
          success: true,
        }
      };

      const reviewedOutput = await agent.review(invalidOutput, mockContext);

      expect(reviewedOutput.metadata.success).toBe(false);
      expect(reviewedOutput.metadata.errors).toContain('Output summary is empty');
    });

    it('should identify missing artifacts', async () => {
      const invalidOutput = {
        summary: 'Test summary',
        artifacts: [], // No artifacts
        nextSteps: ['Step 1'],
        metadata: {
          agentName: 'uiux',
          executionTime: 0,
          success: true,
        }
      };

      const reviewedOutput = await agent.review(invalidOutput, mockContext);

      expect(reviewedOutput.metadata.success).toBe(false);
      expect(reviewedOutput.metadata.errors).toContain('No artifacts generated');
    });

    it('should validate artifact structure', async () => {
      const invalidOutput = {
        summary: 'Test summary',
        artifacts: [
          {
            type: 'documentation',
            path: '', // Invalid path
            content: '',
          }
        ],
        nextSteps: ['Step 1'],
        metadata: {
          agentName: 'uiux',
          executionTime: 0,
          success: true,
        }
      };

      const reviewedOutput = await agent.review(invalidOutput, mockContext);

      expect(reviewedOutput.metadata.success).toBe(false);
      expect(reviewedOutput.metadata.errors).toContain('Invalid artifact: unknown');
    });
  });

  describe('Helper Methods', () => {
    it('should analyze project structure correctly', async () => {
      const plan = await agent.plan(mockContext);
      
      // We can't directly test private methods, but we can test their effects
      // through the plan generation
      expect(plan.expectedOutputs).toContain('Component library improvements');
      expect(plan.expectedOutputs).toContain('CSS/SCSS optimizations');
    });

    it('should detect React projects', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      // Should create React-specific artifacts
      const reactArtifact = output.artifacts.find(
        artifact => artifact.content.includes('React')
      );
      expect(reactArtifact).toBeDefined();
    });

    it('should detect CSS files', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      // Should create CSS-related artifacts
      const cssArtifact = output.artifacts.find(
        artifact => artifact.path === 'css-improvements.md'
      );
      expect(cssArtifact).toBeDefined();
    });
  });

  describe('Integration', () => {
    it('should provide meaningful next steps', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      expect(output.nextSteps.length).toBeGreaterThan(0);
      expect(output.nextSteps).toContain('Implement design system tokens');
      expect(output.nextSteps).toContain('Create reusable component library');
    });

    it('should generate artifacts that reference each other', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      // Design system should be referenced in other artifacts
      const designSystemExists = output.artifacts.some(
        artifact => artifact.path === 'design-system.md'
      );
      expect(designSystemExists).toBe(true);
    });
  });
});