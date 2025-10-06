interface SlackMessage {
  text?: string;
  channel?: string;
  username?: string;
  icon_emoji?: string;
  attachments?: Array<{
    color?: string;
    title?: string;
    text?: string;
    timestamp?: number;
    fields?: Array<{
      title: string;
      value: string;
      short?: boolean;
    }>;
  }>;
}

class SlackNotificationPlugin {
  private webhookUrl: string;
  private config: any;

  constructor(config: any) {
    this.config = config;
    this.webhookUrl = config.webhookUrl || process.env.SLACK_WEBHOOK_URL || '';
  }

  async sendMessage(message: SlackMessage): Promise<boolean> {
    if (!this.webhookUrl) {
      console.warn('Slack webhook URL not configured');
      return false;
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: this.config.channel,
          username: this.config.username,
          icon_emoji: this.config.iconEmoji,
          ...message,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      return false;
    }
  }

  async handleBuildStarted(data: any): Promise<{ success: boolean; data?: any; error?: string }> {
    const message: SlackMessage = {
      text: '🔨 Build Started',
      attachments: [
        {
          color: '#36a64f',
          title: 'Build Started',
          text: `Project: ${data.projectName || 'Unknown'}\nBranch: ${data.branch || 'main'}`,
          timestamp: Math.floor(Date.now() / 1000),
          fields: [
            {
              title: 'Status',
              value: 'Building...',
              short: true,
            },
            {
              title: 'Started by',
              value: data.user || 'System',
              short: true,
            },
          ],
        },
      ],
    };

    const success = await this.sendMessage(message);
    return { success };
  }

  async handleBuildCompleted(data: any): Promise<{ success: boolean; data?: any; error?: string }> {
    const message: SlackMessage = {
      text: '✅ Build Completed Successfully',
      attachments: [
        {
          color: 'good',
          title: 'Build Completed',
          text: `Project: ${data.projectName || 'Unknown'}\nBranch: ${data.branch || 'main'}`,
          timestamp: Math.floor(Date.now() / 1000),
          fields: [
            {
              title: 'Status',
              value: 'Success',
              short: true,
            },
            {
              title: 'Duration',
              value: data.duration || 'Unknown',
              short: true,
            },
          ],
        },
      ],
    };

    const success = await this.sendMessage(message);
    return { success };
  }

  async handleBuildFailed(data: any): Promise<{ success: boolean; data?: any; error?: string }> {
    const message: SlackMessage = {
      text: '❌ Build Failed',
      attachments: [
        {
          color: 'danger',
          title: 'Build Failed',
          text: `Project: ${data.projectName || 'Unknown'}\nBranch: ${data.branch || 'main'}`,
          timestamp: Math.floor(Date.now() / 1000),
          fields: [
            {
              title: 'Status',
              value: 'Failed',
              short: true,
            },
            {
              title: 'Error',
              value: data.error || 'Unknown error',
              short: false,
            },
          ],
        },
      ],
    };

    const success = await this.sendMessage(message);
    return { success };
  }

  async handleDeployStarted(data: any): Promise<{ success: boolean; data?: any; error?: string }> {
    const message: SlackMessage = {
      text: '🚀 Deployment Started',
      attachments: [
        {
          color: '#36a64f',
          title: 'Deployment Started',
          text: `Project: ${data.projectName || 'Unknown'}\nEnvironment: ${data.environment || 'production'}`,
          timestamp: Math.floor(Date.now() / 1000),
          fields: [
            {
              title: 'Status',
              value: 'Deploying...',
              short: true,
            },
            {
              title: 'Target',
              value: data.target || 'Unknown',
              short: true,
            },
          ],
        },
      ],
    };

    const success = await this.sendMessage(message);
    return { success };
  }

  async handleDeployCompleted(data: any): Promise<{ success: boolean; data?: any; error?: string }> {
    const message: SlackMessage = {
      text: '🎉 Deployment Completed Successfully',
      attachments: [
        {
          color: 'good',
          title: 'Deployment Completed',
          text: `Project: ${data.projectName || 'Unknown'}\nEnvironment: ${data.environment || 'production'}`,
          timestamp: Math.floor(Date.now() / 1000),
          fields: [
            {
              title: 'Status',
              value: 'Live',
              short: true,
            },
            {
              title: 'URL',
              value: data.url || 'N/A',
              short: true,
            },
          ],
        },
      ],
    };

    const success = await this.sendMessage(message);
    return { success };
  }

  async handleDeployFailed(data: any): Promise<{ success: boolean; data?: any; error?: string }> {
    const message: SlackMessage = {
      text: '💥 Deployment Failed',
      attachments: [
        {
          color: 'danger',
          title: 'Deployment Failed',
          text: `Project: ${data.projectName || 'Unknown'}\nEnvironment: ${data.environment || 'production'}`,
          timestamp: Math.floor(Date.now() / 1000),
          fields: [
            {
              title: 'Status',
              value: 'Failed',
              short: true,
            },
            {
              title: 'Error',
              value: data.error || 'Unknown error',
              short: false,
            },
          ],
        },
      ],
    };

    const success = await this.sendMessage(message);
    return { success };
  }
}

// Export the plugin class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SlackNotificationPlugin;
} else {
  (globalThis as any).SlackNotificationPlugin = SlackNotificationPlugin;
}