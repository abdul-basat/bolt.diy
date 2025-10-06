#!/usr/bin/env node

import { readFile, readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { existsSync } from 'fs';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3001;

function showUsage() {
  console.log(`
Usage: pnpm run docs [options]

Options:
  --port          Port to run the docs server (default: 3001)
  --path          Base path to serve docs from (default: current directory)
  --help, -h      Show this help message

This command starts a simple web server to view:
  - PRD files from .bolt/prd/
  - Mermaid diagrams from .bolt/diagrams/
`);
}

async function getFileList(dir, extensions) {
  try {
    if (!existsSync(dir)) {
      return [];
    }

    const files = await readdir(dir);
    const fileList = [];

    for (const file of files) {
      const filePath = join(dir, file);
      const stats = await stat(filePath);
      
      if (stats.isFile() && extensions.includes(extname(file).toLowerCase())) {
        fileList.push({
          name: basename(file, extname(file)),
          path: filePath,
          size: stats.size,
          modified: stats.mtime,
        });
      }
    }

    return fileList.sort((a, b) => b.modified - a.modified);
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
    return [];
  }
}

async function generateHTML(basePath) {
  const prdDir = join(basePath, '.bolt', 'prd');
  const diagramDir = join(basePath, '.bolt', 'diagrams');

  const prdFiles = await getFileList(prdDir, ['.md']);
  const diagramFiles = await getFileList(diagramDir, ['.mmd', '.svg']);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>bolt.diy Documentation Viewer</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f8fafc;
            color: #1e293b;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .header h1 {
            color: #0f172a;
            margin: 0 0 10px 0;
        }
        .header p {
            color: #64748b;
            margin: 0;
        }
        .section {
            margin-bottom: 30px;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .section h2 {
            color: #1e293b;
            margin: 0 0 20px 0;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
        }
        .file-list {
            display: grid;
            gap: 15px;
        }
        .file-item {
            padding: 15px;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            background: #f8fafc;
            transition: background 0.2s;
        }
        .file-item:hover {
            background: #f1f5f9;
        }
        .file-name {
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 5px;
        }
        .file-meta {
            font-size: 0.875rem;
            color: #64748b;
        }
        .file-actions {
            margin-top: 10px;
        }
        .btn {
            display: inline-block;
            padding: 8px 16px;
            margin-right: 10px;
            text-decoration: none;
            border-radius: 4px;
            font-size: 0.875rem;
            font-weight: 500;
            transition: background 0.2s;
        }
        .btn-primary {
            background: #3b82f6;
            color: white;
        }
        .btn-primary:hover {
            background: #2563eb;
        }
        .btn-secondary {
            background: #6b7280;
            color: white;
        }
        .btn-secondary:hover {
            background: #4b5563;
        }
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #64748b;
        }
        .commands {
            background: #f1f5f9;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
        }
        .commands h3 {
            margin: 0 0 10px 0;
            color: #1e293b;
        }
        .commands code {
            background: #e2e8f0;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 0.875rem;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 bolt.diy Documentation Viewer</h1>
        <p>View your generated PRD documents and Mermaid diagrams</p>
    </div>

    <div class="section">
        <h2>📄 Product Requirements Documents</h2>
        ${prdFiles.length > 0 ? `
            <div class="file-list">
                ${prdFiles.map(file => `
                    <div class="file-item">
                        <div class="file-name">${file.name}</div>
                        <div class="file-meta">
                            Modified: ${file.modified.toLocaleDateString()} | 
                            Size: ${(file.size / 1024).toFixed(1)} KB
                        </div>
                        <div class="file-actions">
                            <a href="/file?path=${encodeURIComponent(file.path)}" class="btn btn-primary">View</a>
                            <a href="/download?path=${encodeURIComponent(file.path)}" class="btn btn-secondary">Download</a>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : `
            <div class="empty-state">
                <p>No PRD files found. Generate one using:</p>
                <code>pnpm run generate-prd &lt;project-name&gt;</code>
            </div>
        `}
    </div>

    <div class="section">
        <h2>📊 Flow Diagrams</h2>
        ${diagramFiles.length > 0 ? `
            <div class="file-list">
                ${diagramFiles.map(file => `
                    <div class="file-item">
                        <div class="file-name">${file.name}</div>
                        <div class="file-meta">
                            Type: ${extname(file.path).slice(1).toUpperCase()} | 
                            Modified: ${file.modified.toLocaleDateString()} | 
                            Size: ${(file.size / 1024).toFixed(1)} KB
                        </div>
                        <div class="file-actions">
                            <a href="/file?path=${encodeURIComponent(file.path)}" class="btn btn-primary">View</a>
                            ${extname(file.path) === '.mmd' ? 
                                `<a href="https://mermaid.live/edit#pako:${encodeURIComponent('graph TD\\nA[Loading...]')}" target="_blank" class="btn btn-secondary">Edit Online</a>` : 
                                ''
                            }
                            <a href="/download?path=${encodeURIComponent(file.path)}" class="btn btn-secondary">Download</a>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : `
            <div class="empty-state">
                <p>No diagram files found. Generate one using:</p>
                <code>pnpm run generate-diagram &lt;project-name&gt;</code>
            </div>
        `}
    </div>

    <div class="commands">
        <h3>📝 Available Commands</h3>
        <p>Generate new documents:</p>
        <ul>
            <li><code>pnpm run generate-prd &lt;project-name&gt;</code> - Generate Product Requirements Document</li>
            <li><code>pnpm run generate-diagram &lt;project-name&gt;</code> - Generate Mermaid flow diagram</li>
        </ul>
        <p>For more options, add <code>--help</code> to any command.</p>
    </div>
</body>
</html>
  `;
}

async function handleRequest(req, res, basePath) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  try {
    if (pathname === '/') {
      const html = await generateHTML(basePath);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } else if (pathname === '/file') {
      const filePath = url.searchParams.get('path');
      if (filePath && existsSync(filePath)) {
        const content = await readFile(filePath, 'utf-8');
        const ext = extname(filePath).toLowerCase();
        
        if (ext === '.md') {
          // Simple markdown rendering
          const htmlContent = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.*)$/gm, '<p>$1</p>')
            .replace(/<p><li>/g, '<ul><li>')
            .replace(/<\/li><\/p>/g, '</li></ul>');

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Viewing: ${basename(filePath)}</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                h1, h2, h3 { color: #1e293b; }
                code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
                th { background: #f8fafc; }
              </style>
            </head>
            <body>
              <a href="/">&larr; Back to docs</a>
              ${htmlContent}
            </body>
            </html>
          `);
        } else if (ext === '.mmd') {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(content);
        } else {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(content);
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
      }
    } else if (pathname === '/download') {
      const filePath = url.searchParams.get('path');
      if (filePath && existsSync(filePath)) {
        const content = await readFile(filePath);
        res.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${basename(filePath)}"`,
        });
        res.end(content);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  } catch (error) {
    console.error('Request error:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal server error');
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  const portIndex = args.indexOf('--port');
  const port = portIndex !== -1 && args[portIndex + 1] ? parseInt(args[portIndex + 1]) : PORT;
  
  const pathIndex = args.indexOf('--path');
  const basePath = pathIndex !== -1 && args[pathIndex + 1] ? args[pathIndex + 1] : process.cwd();

  const server = createServer((req, res) => {
    handleRequest(req, res, basePath);
  });

  server.listen(port, () => {
    console.log(`🚀 bolt.diy Documentation Viewer started!`);
    console.log(`📖 Open your browser to: http://localhost:${port}`);
    console.log(`📁 Serving docs from: ${basePath}`);
    console.log(`⏹️  Press Ctrl+C to stop the server`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down docs viewer...');
    server.close(() => {
      console.log('👋 Server stopped');
      process.exit(0);
    });
  });
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});