import type { CommitFile, SafetyCheck } from './types';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GitHubSafety');

export class GitHubSafetyChecker {
  private readonly maxFileSize = 100 * 1024 * 1024; // 100MB
  private readonly secretPatterns = [
    /(?:password|passwd|pwd)\s*[:=]\s*['"]\s*\S+/i,
    /(?:secret|key|token)\s*[:=]\s*['"]\s*[A-Za-z0-9+/=_-]{20,}/i,
    /(?:api[_-]?key|apikey)\s*[:=]\s*['"]\s*[A-Za-z0-9_-]{20,}/i,
    /(?:access[_-]?token|accesstoken)\s*[:=]\s*['"]\s*[A-Za-z0-9_-]{20,}/i,
    /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/i,
    /ssh-rsa\s+[A-Za-z0-9+/=]+/i,
    /AKIA[0-9A-Z]{16}/i, // AWS Access Key
    /ghp_[A-Za-z0-9_]{36}/i, // GitHub Personal Access Token
    /gho_[A-Za-z0-9_]{36}/i, // GitHub OAuth Token
    /ghu_[A-Za-z0-9_]{36}/i, // GitHub User Token
    /ghs_[A-Za-z0-9_]{36}/i, // GitHub Server Token
    /ghr_[A-Za-z0-9_]{36}/i, // GitHub Refresh Token
  ];

  private readonly dangerousExtensions = new Set([
    '.exe', '.bat', '.cmd', '.scr', '.com', '.pif', '.msi', '.dll',
    '.sh', '.app', '.deb', '.rpm', '.pkg', '.dmg',
    '.p12', '.pem', '.key', '.crt', '.cer', '.pfx',
  ]);

  private readonly ignoredPaths = [
    'node_modules/',
    '.git/',
    'dist/',
    'build/',
    'coverage/',
    '.next/',
    '.nuxt/',
    '.cache/',
    'tmp/',
    'temp/',
    '__pycache__/',
    '*.log',
    '*.tmp',
    '.DS_Store',
    'Thumbs.db',
  ];

  checkFiles(files: CommitFile[]): SafetyCheck {
    const violations: string[] = [];

    for (const file of files) {
      // Check file size
      const sizeViolation = this.checkFileSize(file);
      if (sizeViolation) {
        violations.push(sizeViolation);
      }

      // Check for secrets
      const secretViolation = this.checkForSecrets(file);
      if (secretViolation) {
        violations.push(secretViolation);
      }

      // Check file extension
      const extensionViolation = this.checkFileExtension(file);
      if (extensionViolation) {
        violations.push(extensionViolation);
      }

      // Check if path should be ignored
      const pathViolation = this.checkIgnoredPath(file);
      if (pathViolation) {
        violations.push(pathViolation);
      }
    }

    const passed = violations.length === 0;
    
    if (!passed) {
      logger.warn('Safety check failed:', violations);
    }

    return {
      passed,
      violations,
      reason: passed ? undefined : 'Files failed safety checks',
    };
  }

  private checkFileSize(file: CommitFile): string | null {
    const size = file.content.length;
    if (size > this.maxFileSize) {
      return `File ${file.path} is too large (${this.formatBytes(size)} > ${this.formatBytes(this.maxFileSize)})`;
    }
    return null;
  }

  private checkForSecrets(file: CommitFile): string | null {
    for (const pattern of this.secretPatterns) {
      if (pattern.test(file.content)) {
        return `File ${file.path} contains potential secrets`;
      }
    }
    return null;
  }

  private checkFileExtension(file: CommitFile): string | null {
    const extension = this.getFileExtension(file.path);
    if (this.dangerousExtensions.has(extension)) {
      return `File ${file.path} has dangerous extension: ${extension}`;
    }
    return null;
  }

  private checkIgnoredPath(file: CommitFile): string | null {
    for (const ignored of this.ignoredPaths) {
      if (ignored.endsWith('*')) {
        const pattern = ignored.slice(0, -1);
        if (file.path.includes(pattern)) {
          return `File ${file.path} matches ignored pattern: ${ignored}`;
        }
      } else if (file.path.startsWith(ignored) || file.path.includes('/' + ignored)) {
        return `File ${file.path} is in ignored directory: ${ignored}`;
      }
    }
    return null;
  }

  private getFileExtension(path: string): string {
    const lastDot = path.lastIndexOf('.');
    return lastDot >= 0 ? path.substring(lastDot).toLowerCase() : '';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  addCustomSecretPattern(pattern: RegExp): void {
    this.secretPatterns.push(pattern);
  }

  addDangerousExtension(extension: string): void {
    this.dangerousExtensions.add(extension.toLowerCase());
  }

  addIgnoredPath(path: string): void {
    this.ignoredPaths.push(path);
  }
}