import { Octokit } from '@octokit/rest';
import type { 
  GitHubConfig, 
  CommitOptions, 
  PullRequestOptions, 
  GitHubAgentResult,
  CommitFile 
} from './types';
import { GitHubSafetyChecker } from './safety';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('GitHubAgent');

export class GitHubAgent {
  private octokit: Octokit;
  private config: GitHubConfig;
  private safetyChecker: GitHubSafetyChecker;

  constructor(config: GitHubConfig) {
    this.config = config;
    this.octokit = new Octokit({
      auth: config.token,
    });
    this.safetyChecker = new GitHubSafetyChecker();
  }

  async commit(options: CommitOptions): Promise<GitHubAgentResult> {
    try {
      // Safety check first
      const safetyResult = this.safetyChecker.checkFiles(options.files);
      if (!safetyResult.passed) {
        return {
          success: false,
          error: `Safety check failed: ${safetyResult.violations.join(', ')}`,
        };
      }

      const branch = options.branch || this.config.defaultBranch || 'main';
      
      // Get the current commit SHA for the branch
      const { data: refData } = await this.octokit.rest.git.getRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `heads/${branch}`,
      });

      const currentCommitSha = refData.object.sha;

      // Get the tree for the current commit
      const { data: currentCommit } = await this.octokit.rest.git.getCommit({
        owner: this.config.owner,
        repo: this.config.repo,
        commit_sha: currentCommitSha,
      });

      // Create blobs for new files
      const blobs = await Promise.all(
        options.files.map(async (file) => {
          const { data: blob } = await this.octokit.rest.git.createBlob({
            owner: this.config.owner,
            repo: this.config.repo,
            content: file.content,
            encoding: file.encoding || 'utf-8',
          });
          return {
            path: file.path,
            sha: blob.sha,
          };
        })
      );

      // Create a new tree
      const { data: newTree } = await this.octokit.rest.git.createTree({
        owner: this.config.owner,
        repo: this.config.repo,
        base_tree: currentCommit.tree.sha,
        tree: blobs.map(blob => ({
          path: blob.path,
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        })),
      });

      // Create a new commit
      const { data: newCommit } = await this.octokit.rest.git.createCommit({
        owner: this.config.owner,
        repo: this.config.repo,
        message: options.message,
        tree: newTree.sha,
        parents: [currentCommitSha],
        author: options.author,
      });

      // Update the branch reference
      await this.octokit.rest.git.updateRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `heads/${branch}`,
        sha: newCommit.sha,
      });

      logger.info(`Successfully committed ${options.files.length} files to ${branch}`);

      return {
        success: true,
        data: {
          commitSha: newCommit.sha,
          commitUrl: newCommit.html_url,
          branch,
          filesCommitted: options.files.length,
        },
      };
    } catch (error) {
      logger.error('Error committing to GitHub:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async createPullRequest(options: PullRequestOptions): Promise<GitHubAgentResult> {
    try {
      const { data: pr } = await this.octokit.rest.pulls.create({
        owner: this.config.owner,
        repo: this.config.repo,
        title: options.title,
        body: options.body,
        head: options.head,
        base: options.base,
        draft: options.draft || false,
      });

      logger.info(`Successfully created pull request #${pr.number}`);

      return {
        success: true,
        data: {
          number: pr.number,
          url: pr.html_url,
          title: pr.title,
          state: pr.state,
        },
      };
    } catch (error) {
      logger.error('Error creating pull request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async createBranch(branchName: string, fromBranch?: string): Promise<GitHubAgentResult> {
    try {
      const sourceBranch = fromBranch || this.config.defaultBranch || 'main';
      
      // Get the source branch ref
      const { data: sourceRef } = await this.octokit.rest.git.getRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `heads/${sourceBranch}`,
      });

      // Create new branch
      await this.octokit.rest.git.createRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `refs/heads/${branchName}`,
        sha: sourceRef.object.sha,
      });

      logger.info(`Successfully created branch ${branchName} from ${sourceBranch}`);

      return {
        success: true,
        data: {
          branchName,
          sourceBranch,
          sha: sourceRef.object.sha,
        },
      };
    } catch (error) {
      logger.error('Error creating branch:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getBranches(): Promise<GitHubAgentResult> {
    try {
      const { data: branches } = await this.octokit.rest.repos.listBranches({
        owner: this.config.owner,
        repo: this.config.repo,
      });

      return {
        success: true,
        data: branches.map(branch => ({
          name: branch.name,
          sha: branch.commit.sha,
          protected: branch.protected,
        })),
      };
    } catch (error) {
      logger.error('Error getting branches:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getRepository(): Promise<GitHubAgentResult> {
    try {
      const { data: repo } = await this.octokit.rest.repos.get({
        owner: this.config.owner,
        repo: this.config.repo,
      });

      return {
        success: true,
        data: {
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          private: repo.private,
          htmlUrl: repo.html_url,
          defaultBranch: repo.default_branch,
          hasIssues: repo.has_issues,
          hasProjects: repo.has_projects,
          hasWiki: repo.has_wiki,
        },
      };
    } catch (error) {
      logger.error('Error getting repository:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async commitAndPush(
    files: CommitFile[],
    commitMessage: string,
    branchName?: string,
    createPR?: boolean,
    prOptions?: Partial<PullRequestOptions>
  ): Promise<GitHubAgentResult> {
    try {
      const targetBranch = branchName || `bolt-changes-${Date.now()}`;
      const baseBranch = this.config.defaultBranch || 'main';

      // Create branch if it doesn't exist and we have a custom branch name
      if (branchName && branchName !== baseBranch) {
        const branchResult = await this.createBranch(targetBranch, baseBranch);
        if (!branchResult.success) {
          // Branch might already exist, continue
          logger.warn(`Branch creation failed, continuing: ${branchResult.error}`);
        }
      }

      // Commit files
      const commitResult = await this.commit({
        message: commitMessage,
        branch: targetBranch,
        files,
      });

      if (!commitResult.success) {
        return commitResult;
      }

      const result: any = {
        commit: commitResult.data,
      };

      // Create PR if requested
      if (createPR && targetBranch !== baseBranch) {
        const prResult = await this.createPullRequest({
          title: prOptions?.title || commitMessage,
          body: prOptions?.body || `Automated changes from Bolt.diy\n\nCommit: ${commitResult.data?.commitSha}`,
          head: targetBranch,
          base: baseBranch,
          draft: prOptions?.draft,
        });

        if (prResult.success) {
          result.pullRequest = prResult.data;
        } else {
          logger.warn('PR creation failed:', prResult.error);
          result.prError = prResult.error;
        }
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      logger.error('Error in commitAndPush:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  getSafetyChecker(): GitHubSafetyChecker {
    return this.safetyChecker;
  }

  getConfig(): GitHubConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<GitHubConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.token) {
      this.octokit = new Octokit({
        auth: newConfig.token,
      });
    }
  }
}