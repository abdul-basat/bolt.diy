import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PRDAgent } from '../prd/PRDAgent';
import { FlowDiagramAgent } from '../diagram/FlowDiagramAgent';
import { AgentOrchestrator } from '../orchestration/AgentOrchestrator';
import { existsSync } from 'fs';
import { rm, mkdir } from 'fs/promises';
import { join } from 'path';

const TEST_OUTPUT_DIR = '/tmp/bolt-agents-test';

describe('Agent System', () => {
  beforeEach(async () => {
    // Create test output directory
    if (!existsSync(TEST_OUTPUT_DIR)) {
      await mkdir(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

  afterEach(async () => {
    // Clean up test output directory
    if (existsSync(TEST_OUTPUT_DIR)) {
      await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
    }
  });

  describe('PRDAgent', () => {
    it('should create a PRD agent with correct configuration', () => {
      const agent = new PRDAgent();
      const config = agent.getConfig();
      
      expect(config.name).toBe('PRDAgent');
      expect(config.version).toBe('1.0.0');
      expect(config.description).toContain('Product Requirement Documents');
      expect(config.supportedFormats).toContain('md');
    });

    it('should generate PRD successfully with valid input', async () => {
      const agent = new PRDAgent();
      const result = await agent.execute({
        projectName: 'test-project',
        projectPath: TEST_OUTPUT_DIR,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('test-project');
      expect(result.outputPath).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.metadata?.agent).toBe('PRDAgent');
      
      if (result.outputPath) {
        expect(existsSync(result.outputPath)).toBe(true);
      }
    });

    it('should fail with invalid project name', async () => {
      const agent = new PRDAgent();
      const result = await agent.execute({
        projectName: 'invalid project name!',
        projectPath: TEST_OUTPUT_DIR,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should generate PRD with custom options', async () => {
      const agent = new PRDAgent();
      const result = await agent.execute({
        projectName: 'custom-project',
        projectPath: TEST_OUTPUT_DIR,
        options: {
          includeUserStories: false,
          includeTechnicalNotes: false,
          includeRisks: true,
        },
      });

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      
      // Content should not include user stories and technical notes sections
      expect(result.content).not.toContain('## User Stories');
      expect(result.content).not.toContain('## Technical Notes');
      expect(result.content).toContain('## Risks and Mitigation');
    });
  });

  describe('FlowDiagramAgent', () => {
    it('should create a diagram agent with correct configuration', () => {
      const agent = new FlowDiagramAgent();
      const config = agent.getConfig();
      
      expect(config.name).toBe('FlowDiagramAgent');
      expect(config.version).toBe('1.0.0');
      expect(config.description).toContain('flow diagrams');
      expect(config.supportedFormats).toContain('mmd');
      expect(config.supportedFormats).toContain('svg');
    });

    it('should generate flowchart diagram successfully', async () => {
      const agent = new FlowDiagramAgent();
      const result = await agent.execute({
        projectName: 'test-diagram',
        projectPath: TEST_OUTPUT_DIR,
        options: {
          diagramType: 'flowchart',
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('test-diagram');
      expect(result.outputPath).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.content).toContain('flowchart TD');
      expect(result.metadata?.agent).toBe('FlowDiagramAgent');
      
      if (result.outputPath) {
        expect(existsSync(result.outputPath)).toBe(true);
      }
    });

    it('should generate different diagram types', async () => {
      const agent = new FlowDiagramAgent();
      const diagramTypes = ['sequence', 'classDiagram', 'stateDiagram', 'entityRelationship'];

      for (const type of diagramTypes) {
        const result = await agent.execute({
          projectName: `test-${type}`,
          projectPath: TEST_OUTPUT_DIR,
          options: {
            diagramType: type as any,
          },
        });

        expect(result.success).toBe(true);
        expect(result.content).toBeDefined();
        
        // Check that the content matches the diagram type
        switch (type) {
          case 'sequence':
            expect(result.content).toContain('sequenceDiagram');
            break;
          case 'classDiagram':
            expect(result.content).toContain('classDiagram');
            break;
          case 'stateDiagram':
            expect(result.content).toContain('stateDiagram-v2');
            break;
          case 'entityRelationship':
            expect(result.content).toContain('erDiagram');
            break;
        }
      }
    });

    it('should fail with invalid project name', async () => {
      const agent = new FlowDiagramAgent();
      const result = await agent.execute({
        projectName: '',
        projectPath: TEST_OUTPUT_DIR,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('AgentOrchestrator', () => {
    it('should create orchestrator with available agents', () => {
      const orchestrator = new AgentOrchestrator();
      const availableAgents = orchestrator.getAvailableAgents();
      
      expect(availableAgents).toContain('prd');
      expect(availableAgents).toContain('diagram');
    });

    it('should get agent information', () => {
      const orchestrator = new AgentOrchestrator();
      
      const prdInfo = orchestrator.getAgentInfo('prd');
      expect(prdInfo).toBeDefined();
      expect(prdInfo.name).toBe('PRDAgent');
      
      const diagramInfo = orchestrator.getAgentInfo('diagram');
      expect(diagramInfo).toBeDefined();
      expect(diagramInfo.name).toBe('FlowDiagramAgent');
    });

    it('should execute single agent orchestration', async () => {
      const orchestrator = new AgentOrchestrator();
      const result = await orchestrator.execute({
        projectName: 'orchestration-test',
        projectPath: TEST_OUTPUT_DIR,
        steps: [
          {
            agent: 'prd',
            options: {
              includeUserStories: true,
            },
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
      expect(Object.keys(result.results)).toHaveLength(1);
      expect(result.executionOrder).toHaveLength(1);
    });

    it('should execute PRD and diagram generation together', async () => {
      const orchestrator = new AgentOrchestrator();
      const result = await orchestrator.generatePRDAndDiagram(
        'full-test',
        TEST_OUTPUT_DIR,
        {
          prdOptions: { includeRisks: true },
          diagramOptions: { diagramType: 'flowchart' },
        }
      );

      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
      expect(Object.keys(result.results)).toHaveLength(2);
      expect(result.executionOrder).toHaveLength(2);
      
      // Check that both agents executed successfully
      const results = Object.values(result.results);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should fail with invalid orchestration steps', async () => {
      const orchestrator = new AgentOrchestrator();
      const result = await orchestrator.execute({
        projectName: 'fail-test',
        projectPath: TEST_OUTPUT_DIR,
        steps: [
          {
            agent: 'nonexistent' as any,
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should handle dependency validation', async () => {
      const orchestrator = new AgentOrchestrator();
      const result = await orchestrator.execute({
        projectName: 'dependency-test',
        projectPath: TEST_OUTPUT_DIR,
        steps: [
          {
            agent: 'diagram',
            dependsOn: ['nonexistent-step'],
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.includes('Dependency'))).toBe(true);
    });
  });
});