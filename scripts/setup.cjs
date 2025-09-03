#!/usr/bin/env node

/**
 * Setup script for bolt.diy development environment
 * 
 * This script handles the initial setup and validation of the development
 * environment, including Node.js version checks, dependency validation,
 * and environment configuration.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk').default;

// Configuration
const REQUIRED_NODE_VERSION = '18.18.0';
const ENV_EXAMPLE_FILE = '.env.example';
const ENV_LOCAL_FILE = '.env.local';

/**
 * Print a styled message to the console
 */
function printMessage(type, message) {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[${timestamp}]`;
  
  switch (type) {
    case 'info':
      console.log(chalk.blue(prefix), chalk.white(message));
      break;
    case 'success':
      console.log(chalk.green(prefix), chalk.green('✓'), chalk.white(message));
      break;
    case 'warning':
      console.log(chalk.yellow(prefix), chalk.yellow('⚠'), chalk.yellow(message));
      break;
    case 'error':
      console.log(chalk.red(prefix), chalk.red('✗'), chalk.red(message));
      break;
    case 'step':
      console.log(chalk.cyan(prefix), chalk.cyan('→'), chalk.white(message));
      break;
  }
}

/**
 * Check if a version meets the minimum requirement
 */
function isVersionCompatible(currentVersion, requiredVersion) {
  const current = currentVersion.replace(/^v/, '').split('.').map(Number);
  const required = requiredVersion.split('.').map(Number);
  
  for (let i = 0; i < Math.max(current.length, required.length); i++) {
    const currentPart = current[i] || 0;
    const requiredPart = required[i] || 0;
    
    if (currentPart > requiredPart) return true;
    if (currentPart < requiredPart) return false;
  }
  
  return true;
}

/**
 * Check Node.js version
 */
function checkNodeVersion() {
  printMessage('step', 'Checking Node.js version...');
  
  const nodeVersion = process.version;
  const isCompatible = isVersionCompatible(nodeVersion, REQUIRED_NODE_VERSION);
  
  if (isCompatible) {
    printMessage('success', `Node.js version ${nodeVersion} is compatible`);
    return true;
  } else {
    printMessage('error', `Node.js version ${nodeVersion} is not compatible. Required: ${REQUIRED_NODE_VERSION}+`);
    printMessage('info', 'Please update Node.js: https://nodejs.org/');
    return false;
  }
}

/**
 * Enable corepack for pnpm support
 */
function enableCorepack() {
  printMessage('step', 'Enabling corepack for pnpm...');
  
  try {
    execSync('corepack enable', { stdio: 'pipe' });
    printMessage('success', 'Corepack enabled successfully');
    return true;
  } catch (error) {
    printMessage('warning', 'Failed to enable corepack automatically');
    printMessage('info', 'Please run: corepack enable');
    return false;
  }
}

/**
 * Check if pnpm is available
 */
function checkPnpm() {
  printMessage('step', 'Checking pnpm availability...');
  
  try {
    const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8', stdio: 'pipe' }).trim();
    printMessage('success', `pnpm version ${pnpmVersion} is available`);
    return true;
  } catch (error) {
    printMessage('error', 'pnpm is not available');
    printMessage('info', 'Attempting to enable corepack...');
    
    if (enableCorepack()) {
      try {
        const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8', stdio: 'pipe' }).trim();
        printMessage('success', `pnpm version ${pnpmVersion} is now available`);
        return true;
      } catch (retryError) {
        printMessage('error', 'Still unable to access pnpm after enabling corepack');
        return false;
      }
    }
    
    return false;
  }
}

/**
 * Copy .env.example to .env.local if it doesn't exist
 */
function setupEnvironmentFile() {
  printMessage('step', 'Setting up environment configuration...');
  
  const envExamplePath = path.join(process.cwd(), ENV_EXAMPLE_FILE);
  const envLocalPath = path.join(process.cwd(), ENV_LOCAL_FILE);
  
  // Check if .env.example exists
  if (!fs.existsSync(envExamplePath)) {
    printMessage('warning', `${ENV_EXAMPLE_FILE} not found`);
    return false;
  }
  
  // Check if .env.local already exists
  if (fs.existsSync(envLocalPath)) {
    printMessage('info', `${ENV_LOCAL_FILE} already exists, skipping copy`);
    return true;
  }
  
  try {
    fs.copyFileSync(envExamplePath, envLocalPath);
    printMessage('success', `Created ${ENV_LOCAL_FILE} from ${ENV_EXAMPLE_FILE}`);
    printMessage('info', 'Please edit .env.local to add your API keys');
    return true;
  } catch (error) {
    printMessage('error', `Failed to copy ${ENV_EXAMPLE_FILE} to ${ENV_LOCAL_FILE}: ${error.message}`);
    return false;
  }
}

/**
 * Check if dependencies are installed
 */
function checkDependencies() {
  printMessage('step', 'Checking dependencies...');
  
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  const packageLockPath = path.join(process.cwd(), 'pnpm-lock.yaml');
  
  if (!fs.existsSync(nodeModulesPath)) {
    printMessage('warning', 'node_modules directory not found');
    printMessage('info', 'Run: pnpm install');
    return false;
  }
  
  if (!fs.existsSync(packageLockPath)) {
    printMessage('warning', 'pnpm-lock.yaml not found');
    printMessage('info', 'Run: pnpm install');
    return false;
  }
  
  printMessage('success', 'Dependencies appear to be installed');
  return true;
}

/**
 * Validate package.json scripts
 */
function validateScripts() {
  printMessage('step', 'Validating package.json scripts...');
  
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const requiredScripts = ['dev', 'build', 'test', 'lint'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
    
    if (missingScripts.length > 0) {
      printMessage('warning', `Missing scripts: ${missingScripts.join(', ')}`);
      return false;
    }
    
    printMessage('success', 'All required scripts are present');
    return true;
  } catch (error) {
    printMessage('error', `Failed to validate package.json: ${error.message}`);
    return false;
  }
}

/**
 * Check Git configuration
 */
function checkGit() {
  printMessage('step', 'Checking Git configuration...');
  
  try {
    // Check if git is available
    execSync('git --version', { stdio: 'pipe' });
    
    // Check if we're in a git repository
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    
    printMessage('success', 'Git is configured and repository detected');
    return true;
  } catch (error) {
    printMessage('warning', 'Git not configured or not in a git repository');
    return false;
  }
}

/**
 * Display setup summary
 */
function displaySummary(results) {
  console.log('\n' + chalk.bold('='.repeat(60)));
  console.log(chalk.bold.cyan('                    SETUP SUMMARY'));
  console.log(chalk.bold('='.repeat(60)));
  
  const checks = [
    { name: 'Node.js Version', status: results.nodeVersion },
    { name: 'pnpm Available', status: results.pnpm },
    { name: 'Environment File', status: results.envFile },
    { name: 'Dependencies', status: results.dependencies },
    { name: 'Package Scripts', status: results.scripts },
    { name: 'Git Repository', status: results.git }
  ];
  
  checks.forEach(check => {
    const status = check.status ? 
      chalk.green('✓ PASS') : 
      chalk.yellow('⚠ WARN');
    console.log(`${check.name.padEnd(20)} ${status}`);
  });
  
  const criticalIssues = !results.nodeVersion || !results.pnpm;
  const warnings = !results.dependencies || !results.scripts || !results.git;
  
  console.log('\n' + chalk.bold('Next Steps:'));
  
  if (criticalIssues) {
    console.log(chalk.red('• Fix critical issues above before proceeding'));
  }
  
  if (!results.dependencies) {
    console.log(chalk.yellow('• Run: pnpm install'));
  }
  
  if (!results.envFile) {
    console.log(chalk.yellow('• Configure your .env.local file with API keys'));
  } else {
    console.log(chalk.cyan('• Edit .env.local to add your API keys'));
  }
  
  console.log(chalk.cyan('• Run: pnpm dev (to start development server)'));
  console.log(chalk.cyan('• Run: pnpm test (to run tests)'));
  console.log(chalk.cyan('• Run: pnpm build (to build for production)'));
  
  if (!criticalIssues && !warnings) {
    console.log('\n' + chalk.green.bold('🎉 Setup completed successfully!'));
  } else if (!criticalIssues) {
    console.log('\n' + chalk.yellow.bold('⚠ Setup completed with warnings'));
  } else {
    console.log('\n' + chalk.red.bold('❌ Setup failed - please fix critical issues'));
  }
  
  console.log('='.repeat(60) + '\n');
}

/**
 * Main setup function
 */
async function main() {
  console.log(chalk.bold.cyan('\n🚀 bolt.diy Setup Script\n'));
  printMessage('info', 'Starting development environment setup...');
  
  const results = {};
  
  // Run all checks
  results.nodeVersion = checkNodeVersion();
  results.pnpm = checkPnpm();
  results.envFile = setupEnvironmentFile();
  results.dependencies = checkDependencies();
  results.scripts = validateScripts();
  results.git = checkGit();
  
  // Display summary
  displaySummary(results);
  
  // Exit with appropriate code
  const criticalIssues = !results.nodeVersion || !results.pnpm;
  process.exit(criticalIssues ? 1 : 0);
}

// Run the setup if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    printMessage('error', `Setup failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  checkNodeVersion,
  checkPnpm,
  setupEnvironmentFile,
  checkDependencies,
  validateScripts,
  checkGit
};