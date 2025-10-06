export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  defaultBranch?: string;
}

export interface CommitFile {
  path: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
}

export interface CommitOptions {
  message: string;
  branch?: string;
  files: CommitFile[];
  author?: {
    name: string;
    email: string;
  };
}

export interface PullRequestOptions {
  title: string;
  body?: string;
  head: string;
  base: string;
  draft?: boolean;
}

export interface SafetyCheck {
  passed: boolean;
  reason?: string;
  violations: string[];
}

export interface GitHubAgentResult {
  success: boolean;
  data?: any;
  error?: string;
}