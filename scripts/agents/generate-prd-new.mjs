#!/usr/bin/env node

// This script compiles and runs the PRD agent in a temporary manner
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function showUsage() {
  console.log(`
Usage: generate-prd <projectName> [options]

Arguments:
  projectName     Name of the project (required)

Options:
  --path          Base path for output (default: current directory)
  --no-stories    Exclude user stories section
  --no-technical  Exclude technical notes section
  --no-risks      Exclude risks section
  --help, -h      Show this help message

Examples:
  pnpm run generate-prd my-awesome-app
  pnpm run generate-prd my-app --path ./projects
  pnpm run generate-prd my-app --no-risks --no-technical
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  const projectName = args[0];
  
  if (!projectName) {
    console.error('❌ Error: Project name is required');
    showUsage();
    process.exit(1);
  }

  console.log(`🚀 Generating PRD for project: ${projectName}`);
  
  // Use tsx to run the TypeScript file directly
  const tsFile = join(__dirname, 'generate-prd-runner.ts');
  
  try {
    const child = spawn('npx', ['tsx', tsFile, ...args], {
      stdio: 'inherit',
      cwd: join(__dirname, '../..'),
    });

    child.on('exit', (code) => {
      process.exit(code || 0);
    });

    child.on('error', (error) => {
      console.error('❌ Failed to execute PRD generator:', error.message);
      console.log('💡 Try installing tsx: npm install -g tsx');
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});