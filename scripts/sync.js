#!/usr/bin/env node

/**
 * Bolt.diy Sync Script
 * 
 * This script syncs local project with GitHub + DB updates
 * Usage: pnpm run sync
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Bolt.diy Sync Starting...\n');

// Check if bolt.config.json exists
const configPath = path.join(process.cwd(), 'bolt.config.json');
let config = {};

if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('✅ Loaded bolt.config.json');
  } catch (error) {
    console.warn('⚠️  Failed to parse bolt.config.json:', error.message);
  }
} else {
  console.log('ℹ️  No bolt.config.json found, using defaults');
}

// Sync Memory
if (config.memory?.enabled !== false) {
  console.log('\n📋 Syncing Memory...');
  try {
    // Here we would call the memory system
    console.log('   Memory sync completed (placeholder)');
  } catch (error) {
    console.error('   ❌ Memory sync failed:', error.message);
  }
}

// Sync GitHub
if (config.github?.enabled) {
  console.log('\n🐙 Syncing GitHub...');
  try {
    // Check if we have GitHub token
    if (process.env.VITE_GITHUB_ACCESS_TOKEN || process.env.GITHUB_ACCESS_TOKEN) {
      console.log('   GitHub token found');
      // Here we would call the GitHub agent
      console.log('   GitHub sync completed (placeholder)');
    } else {
      console.warn('   ⚠️  No GitHub token found in environment');
    }
  } catch (error) {
    console.error('   ❌ GitHub sync failed:', error.message);
  }
}

// Sync Database
if (config.database?.enabled) {
  console.log('\n💾 Syncing Database...');
  try {
    // Here we would call the database agent
    console.log('   Database sync completed (placeholder)');
  } catch (error) {
    console.error('   ❌ Database sync failed:', error.message);
  }
}

// Load Plugins
if (config.plugins?.enabled !== false) {
  console.log('\n🔌 Loading Plugins...');
  try {
    const pluginsDir = path.join(process.cwd(), config.plugins?.directory || 'plugins');
    if (fs.existsSync(pluginsDir)) {
      const plugins = fs.readdirSync(pluginsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      console.log(`   Found ${plugins.length} plugins: ${plugins.join(', ')}`);
    } else {
      console.log('   No plugins directory found');
    }
  } catch (error) {
    console.error('   ❌ Plugin loading failed:', error.message);
  }
}

console.log('\n✅ Bolt.diy Sync Completed!\n');

// Show next steps
console.log('💡 Next steps:');
console.log('   • Run `pnpm run dev` to start development');
console.log('   • Check your bolt.config.json for configuration options');
console.log('   • Add environment variables for integrations');
console.log('   • Explore the plugins/ directory for available extensions\n');