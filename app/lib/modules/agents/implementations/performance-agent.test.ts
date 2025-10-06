// PerformanceAgent.test.ts
// Unit tests for the PerformanceAgent

import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceAgent } from '../implementations/performance-agent';
import type { AgentContext } from '../types';

describe('PerformanceAgent', () => {
  let agent: PerformanceAgent;
  let mockContext: AgentContext;

  beforeEach(() => {
    agent = new PerformanceAgent();
    mockContext = {
      projectFiles: {
        'package.json': JSON.stringify({
          name: 'test-project',
          dependencies: {
            'react': '^18.0.0',
            'lodash': '^4.17.21',
            'moment': '^2.29.0'
          },
          devDependencies: {
            'webpack': '^5.0.0',
            'typescript': '^4.9.0'
          }
        }),
        'src/App.tsx': `
          import React, { useState, useEffect } from 'react';
          import * as _ from 'lodash'; // Wildcard import
          import moment from 'moment'; // Large library
          
          const App: React.FC = () => {
            const [data, setData] = useState([]);
            
            useEffect(() => {
              // DOM query in loop - performance issue
              for (let i = 0; i < 100; i++) {
                const element = document.querySelector('.item-' + i);
                if (element) {
                  element.innerHTML = 'Updated';
                }
              }
            }, []);
            
            return (
              <div>
                {data.map(item => (
                  <div key={item.id}>{moment(item.date).format('YYYY-MM-DD')}</div>
                ))}
              </div>
            );
          };
          
          export default App;
        `,
        'src/utils/heavy-function.ts': `
          export function heavyFunction() {
            // Complex function with 60+ lines
            let result = 0;
            for (let i = 0; i < 1000000; i++) {
              result += Math.random();
              result *= 2;
              result = Math.floor(result);
              // ... many more lines of processing
            }
            return result;
          }
        `,
        'src/styles.css': `
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
          
          .container {
            -webkit-transform: scale(1);
            -moz-transform: scale(1);
            transform: scale(1);
          }
        `
      },
      previousOutputs: [],
      requirements: 'Optimize application performance and bundle size',
      config: {}
    };
  });

  describe('Agent Properties', () => {
    it('should have correct agent properties', () => {
      expect(agent.name).toBe('performance');
      expect(agent.description).toContain('code efficiency');
      expect(agent.description).toContain('bundle size');
      expect(agent.version).toBe('1.0.0');
      expect(agent.tags).toEqual(['performance', 'optimization', 'bundle', 'efficiency']);
    });
  });

  describe('plan() method', () => {
    it('should create a comprehensive execution plan', async () => {
      const plan = await agent.plan(mockContext);

      expect(plan).toHaveProperty('steps');
      expect(plan).toHaveProperty('estimatedTime');
      expect(plan).toHaveProperty('dependencies');
      expect(plan).toHaveProperty('expectedOutputs');

      expect(Array.isArray(plan.steps)).toBe(true);
      expect(plan.steps.length).toBeGreaterThan(0);
      expect(typeof plan.estimatedTime).toBe('number');
      expect(plan.estimatedTime).toBeGreaterThan(40); // Should be more complex than UIUX
      
      expect(plan.steps).toContain('Analyze bundle composition and size');
      expect(plan.steps).toContain('Identify performance bottlenecks');
    });

    it('should adapt plan based on project dependencies', async () => {
      const plan = await agent.plan(mockContext);
      
      expect(plan.expectedOutputs).toContain('Dependency optimization recommendations');
    });

    it('should include React-specific analysis for React projects', async () => {
      const plan = await agent.plan(mockContext);
      
      expect(plan.expectedOutputs).toContain('Component optimization suggestions');
      expect(plan.steps).toContain('Analyze React/TypeScript performance patterns');
    });

    it('should handle projects without package.json', async () => {
      const contextWithoutPackage = {
        ...mockContext,
        projectFiles: {
          'index.html': '<html><body>Static site</body></html>',
          'script.js': 'console.log("hello");'
        }
      };

      const plan = await agent.plan(contextWithoutPackage);
      
      expect(plan.steps).toContain('Analyze bundle composition and size');
      expect(plan.expectedOutputs).not.toContain('Dependency optimization recommendations');
    });
  });

  describe('execute() method', () => {
    it('should generate performance artifacts successfully', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      expect(output).toHaveProperty('summary');
      expect(output).toHaveProperty('artifacts');
      expect(output).toHaveProperty('nextSteps');
      expect(output).toHaveProperty('metadata');

      expect(output.metadata.success).toBe(true);
      expect(output.metadata.agentName).toBe('performance');
      expect(Array.isArray(output.artifacts)).toBe(true);
      expect(output.artifacts.length).toBeGreaterThan(0);
    });

    it('should create performance audit report', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      const auditArtifact = output.artifacts.find(
        artifact => artifact.path === 'performance-audit.md'
      );

      expect(auditArtifact).toBeDefined();
      expect(auditArtifact?.type).toBe('documentation');
      expect(auditArtifact?.content).toContain('Performance Audit Report');
      expect(auditArtifact?.content).toContain('Bundle Size Optimization');
      expect(auditArtifact?.content).toContain('Performance Metrics Targets');
    });

    it('should create webpack optimization config', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      const webpackArtifact = output.artifacts.find(
        artifact => artifact.path === 'webpack.optimization.js'
      );

      expect(webpackArtifact).toBeDefined();
      expect(webpackArtifact?.type).toBe('config');
      expect(webpackArtifact?.content).toContain('splitChunks');
      expect(webpackArtifact?.content).toContain('CompressionPlugin');
    });

    it('should create dependency analysis', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      const depAnalysisArtifact = output.artifacts.find(
        artifact => artifact.path === 'dependency-analysis.md'
      );

      expect(depAnalysisArtifact).toBeDefined();
      expect(depAnalysisArtifact?.content).toContain('Dependency Analysis');
      expect(depAnalysisArtifact?.content).toContain('lodash');
      expect(depAnalysisArtifact?.content).toContain('moment');
    });

    it('should create performance monitoring setup', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      const monitoringArtifact = output.artifacts.find(
        artifact => artifact.path === 'performance-monitoring.ts'
      );

      expect(monitoringArtifact).toBeDefined();
      expect(monitoringArtifact?.type).toBe('code');
      expect(monitoringArtifact?.content).toContain('PerformanceMonitor');
      expect(monitoringArtifact?.content).toContain('Core Web Vitals');
    });

    it('should create React-specific optimizations for React projects', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      const reactOptArtifact = output.artifacts.find(
        artifact => artifact.path === 'react-performance.md'
      );

      expect(reactOptArtifact).toBeDefined();
      expect(reactOptArtifact?.content).toContain('React Performance Optimization');
      expect(reactOptArtifact?.content).toContain('React.memo');
      expect(reactOptArtifact?.content).toContain('useMemo');
    });

    it('should handle execution errors gracefully', async () => {
      // Mock a scenario that might cause errors
      const invalidContext = {
        ...mockContext,
        projectFiles: {
          'package.json': 'invalid json content'
        }
      };

      const plan = await agent.plan(invalidContext);
      const output = await agent.execute(invalidContext, plan);

      expect(output).toHaveProperty('summary');
      expect(output).toHaveProperty('artifacts');
      expect(output).toHaveProperty('metadata');
      expect(output.metadata.agentName).toBe('performance');
    });
  });

  describe('Performance Analysis', () => {
    it('should detect performance anti-patterns', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      const auditReport = output.artifacts.find(
        artifact => artifact.path === 'performance-audit.md'
      )?.content;

      // Should detect DOM queries in loops
      expect(auditReport).toContain('DOM');
      
      // Should detect wildcard imports
      expect(auditReport).toBeDefined();
    });

    it('should identify large dependencies', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      const depAnalysis = output.artifacts.find(
        artifact => artifact.path === 'dependency-analysis.md'
      )?.content;

      expect(depAnalysis).toContain('moment');
      expect(depAnalysis).toContain('lodash');
    });

    it('should suggest bundle optimization techniques', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      const webpackConfig = output.artifacts.find(
        artifact => artifact.path === 'webpack.optimization.js'
      )?.content;

      expect(webpackConfig).toContain('splitChunks');
      expect(webpackConfig).toContain('vendor');
      expect(webpackConfig).toContain('CompressionPlugin');
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

    it('should identify performance-specific validation issues', async () => {
      const invalidOutput = {
        summary: 'Performance analysis completed',
        artifacts: [
          {
            type: 'documentation',
            path: 'empty-report.md',
            content: '', // Empty content
          }
        ],
        nextSteps: [],
        metadata: {
          agentName: 'performance',
          executionTime: 0,
          success: true,
        }
      };

      const reviewedOutput = await agent.review(invalidOutput, mockContext);

      expect(reviewedOutput.metadata.success).toBe(false);
      expect(reviewedOutput.metadata.errors).toContain('Invalid artifact: empty-report.md');
    });
  });

  describe('Integration with React Projects', () => {
    it('should provide React-specific optimization recommendations', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      expect(output.nextSteps).toContain('Implement code splitting for route-based chunks');
      expect(output.nextSteps).toContain('Implement lazy loading for components and images');
    });

    it('should suggest React-specific bundle optimizations', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      const webpackConfig = output.artifacts.find(
        artifact => artifact.path === 'webpack.optimization.js'
      )?.content;

      expect(webpackConfig).toContain('react');
      expect(webpackConfig).toContain('react-dom');
    });
  });

  describe('Performance Monitoring', () => {
    it('should create comprehensive monitoring setup', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      const monitoringCode = output.artifacts.find(
        artifact => artifact.path === 'performance-monitoring.ts'
      )?.content;

      expect(monitoringCode).toContain('PerformanceObserver');
      expect(monitoringCode).toContain('first-contentful-paint');
      expect(monitoringCode).toContain('largest-contentful-paint');
      expect(monitoringCode).toContain('layout-shift');
      expect(monitoringCode).toContain('first-input');
    });

    it('should include performance thresholds', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      const monitoringCode = output.artifacts.find(
        artifact => artifact.path === 'performance-monitoring.ts'
      )?.content;

      expect(monitoringCode).toContain('PERFORMANCE_THRESHOLDS');
      expect(monitoringCode).toContain('2500'); // LCP threshold
      expect(monitoringCode).toContain('100'); // FID threshold
    });
  });

  describe('Bundle Analysis', () => {
    it('should provide dependency optimization recommendations', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      const depAnalysis = output.artifacts.find(
        artifact => artifact.path === 'dependency-analysis.md'
      )?.content;

      expect(depAnalysis).toContain('moment.js');
      expect(depAnalysis).toContain('date-fns');
      expect(depAnalysis).toContain('Tree Shaking');
    });

    it('should suggest specific optimization techniques', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      const auditReport = output.artifacts.find(
        artifact => artifact.path === 'performance-audit.md'
      )?.content;

      expect(auditReport).toContain('Code Splitting');
      expect(auditReport).toContain('lazy');
      expect(auditReport).toContain('dynamic imports');
    });
  });

  describe('Next Steps Generation', () => {
    it('should provide actionable next steps', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      expect(output.nextSteps.length).toBeGreaterThan(0);
      expect(output.nextSteps).toContain('Implement code splitting for route-based chunks');
      expect(output.nextSteps).toContain('Add performance monitoring to CI/CD pipeline');
      expect(output.nextSteps).toContain('Set up bundle analyzer in build process');
    });

    it('should prioritize performance improvements', async () => {
      const plan = await agent.plan(mockContext);
      const output = await agent.execute(mockContext, plan);

      const auditReport = output.artifacts.find(
        artifact => artifact.path === 'performance-audit.md'
      )?.content;

      expect(auditReport).toContain('High Priority');
      expect(auditReport).toContain('Medium Priority');
      expect(auditReport).toContain('Optimization Recommendations');
    });
  });
});