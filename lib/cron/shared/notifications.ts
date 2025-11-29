/**
 * Shared notification utilities for cron jobs
 * Handles Slack and Email notifications across all workflows
 */

export interface SlackNotificationOptions {
  webhook: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  color?: 'good' | 'warning' | 'danger';
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
}

export interface SlackBlockMessage {
  text: string;
  blocks: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
    };
    fields?: Array<{
      type: string;
      text: string;
    }>;
    accessory?: any;
  }>;
}

/**
 * Send Slack notification using webhook
 */
export async function sendSlackNotification(
  options: SlackNotificationOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    const { webhook, title, message, data, color = 'good', fields = [] } = options;

    // Build Slack Block Kit message
    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: title,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
    ];

    // Add fields if provided
    if (fields.length > 0) {
      blocks.push({
        type: 'section',
        fields: fields.map((field) => ({
          type: 'mrkdwn',
          text: `*${field.title}*\n${field.value}`,
        })),
      });
    }

    // Add data as context if provided
    if (data) {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `\`\`\`${JSON.stringify(data, null, 2)}\`\`\``,
          },
        ],
      });
    }

    // Add color indicator
    const colorEmoji = {
      good: '✅',
      warning: '⚠️',
      danger: '❌',
    }[color];

    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `${colorEmoji} ${new Date().toLocaleString()}`,
        },
      ],
    });

    const response = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: title,
        blocks,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Slack API error: ${response.status} - ${errorText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send custom Slack block message
 */
export async function sendSlackBlockMessage(
  webhook: string,
  message: SlackBlockMessage
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Slack API error: ${response.status} - ${errorText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send Slack block message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format a number as currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format a percentage
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

/**
 * Create a summary table for Slack
 */
export function createSlackTable(
  headers: string[],
  rows: string[][]
): string {
  const headerRow = headers.join(' | ');
  const separator = headers.map(() => '---').join(' | ');
  const dataRows = rows.map((row) => row.join(' | ')).join('\n');

  return `${headerRow}\n${separator}\n${dataRows}`;
}
