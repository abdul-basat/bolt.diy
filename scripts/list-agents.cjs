#!/usr/bin/env node

// scripts/list-agents.js
// CLI command to list all available agents

const path = require('path');

// Simple CLI implementation without requiring build
function listAgents() {
  console.log('🤖 Bolt.diy Multi-Agent System\n');
  
  const agents = [
    {
      name: 'uiux',
      description: 'Improves visual design consistency, UX patterns, and accessibility standards',
      version: '1.0.0',
      tags: ['ui', 'ux', 'design', 'accessibility', 'frontend'],
      enabled: true,
      priority: 10
    },
    {
      name: 'performance',
      description: 'Optimizes code efficiency, bundle size, and runtime performance',
      version: '1.0.0',
      tags: ['performance', 'optimization', 'bundle', 'efficiency'],
      enabled: true,
      priority: 9
    },
    {
      name: 'accessibility',
      description: 'Checks ARIA compliance, color contrast, keyboard navigation, and accessibility standards',
      version: '1.0.0',
      tags: ['accessibility', 'a11y', 'aria', 'wcag', 'compliance'],
      enabled: true,
      priority: 8
    },
    {
      name: 'testing',
      description: 'Scaffolds unit tests, E2E tests, and testing infrastructure (Jest/Playwright/Vitest)',
      version: '1.0.0',
      tags: ['testing', 'jest', 'playwright', 'vitest', 'e2e', 'unit'],
      enabled: true,
      priority: 7
    },
    {
      name: 'documentation',
      description: 'Generates README files, inline comments, API docs, and developer guides',
      version: '1.0.0',
      tags: ['documentation', 'readme', 'api-docs', 'comments', 'guides'],
      enabled: true,
      priority: 6
    },
    {
      name: 'data',
      description: 'Handles database schema design, CRUD API scaffolding, and DB integration',
      version: '1.0.0',
      tags: ['database', 'schema', 'api', 'crud', 'orm', 'sql'],
      enabled: true,
      priority: 5
    },
    {
      name: 'deployment',
      description: 'Manages Docker/CI-CD config generation and deployment automation',
      version: '1.0.0',
      tags: ['deployment', 'docker', 'ci-cd', 'automation', 'devops'],
      enabled: true,
      priority: 4
    },
    {
      name: 'refactoring',
      description: 'Splits large components, enforces naming conventions, and improves code organization',
      version: '1.0.0',
      tags: ['refactoring', 'code-quality', 'organization', 'maintainability'],
      enabled: true,
      priority: 3
    }
  ];

  console.log('📋 Available Agents:\n');
  
  agents.forEach((agent, index) => {
    const statusIcon = agent.enabled ? '✅' : '❌';
    const priorityBadge = `P${agent.priority}`;
    
    console.log(`${index + 1}. ${statusIcon} ${agent.name} (v${agent.version}) [${priorityBadge}]`);
    console.log(`   📝 ${agent.description}`);
    console.log(`   🏷️  ${agent.tags.join(', ')}`);
    console.log('');
  });

  console.log('📊 Summary:');
  console.log(`   Total Agents: ${agents.length}`);
  console.log(`   Enabled: ${agents.filter(a => a.enabled).length}`);
  console.log(`   Disabled: ${agents.filter(a => !a.enabled).length}`);
  
  console.log('\n🔧 Usage:');
  console.log('   To enable/disable agents, use the agent configuration in your project settings.');
  console.log('   Agents are executed based on priority (higher numbers first).');
  
  console.log('\n📚 Documentation:');
  console.log('   See the README.md for detailed information about each agent.');
  console.log('   Check app/lib/modules/agents/ for implementation details.');
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('list-agents - Show all available agents in the multi-agent system\n');
  console.log('Usage: npm run list-agents [options]\n');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --json         Output as JSON');
  process.exit(0);
}

if (args.includes('--json')) {
  const agents = [
    { name: 'uiux', description: 'Improves visual design consistency', version: '1.0.0', tags: ['ui', 'ux'], enabled: true, priority: 10 },
    { name: 'performance', description: 'Optimizes code efficiency', version: '1.0.0', tags: ['performance'], enabled: true, priority: 9 },
    { name: 'accessibility', description: 'Checks ARIA compliance', version: '1.0.0', tags: ['accessibility'], enabled: true, priority: 8 },
    { name: 'testing', description: 'Scaffolds unit tests', version: '1.0.0', tags: ['testing'], enabled: true, priority: 7 },
    { name: 'documentation', description: 'Generates README files', version: '1.0.0', tags: ['documentation'], enabled: true, priority: 6 },
    { name: 'data', description: 'Handles database schema', version: '1.0.0', tags: ['database'], enabled: true, priority: 5 },
    { name: 'deployment', description: 'Manages Docker/CI-CD config', version: '1.0.0', tags: ['deployment'], enabled: true, priority: 4 },
    { name: 'refactoring', description: 'Splits large components', version: '1.0.0', tags: ['refactoring'], enabled: true, priority: 3 }
  ];
  console.log(JSON.stringify(agents, null, 2));
} else {
  listAgents();
}