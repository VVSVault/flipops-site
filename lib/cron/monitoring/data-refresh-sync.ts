/**
 * Data Refresh & Sync Cron Job
 *
 * Schedule: Daily at 8 AM
 * Purpose: Refresh active deal data and send summary to Slack
 *
 * Migrated from: n8n workflow "Data Refresh & Sync"
 */

import {
  createLogger,
  prisma,
  closePrismaConnection,
  sendSlackNotification,
  retry,
} from '../shared';

const logger = createLogger('Data Refresh & Sync');

interface RefreshResult {
  success: boolean;
  dealId: string;
  address: string;
  updatedAt?: string;
  error?: string;
}

/**
 * Main workflow function
 */
async function dataRefreshAndSync() {
  logger.info('Starting data refresh workflow');

  try {
    // Step 1: Fetch all active deals
    logger.info('Fetching active deals from database');

    const deals = await prisma.dealSpec.findMany({
      where: {
        // Add your active deal criteria here
        // For now, just get all deals
      },
      select: {
        id: true,
        userId: true,
        address: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'asc', // Process oldest first
      },
    });

    logger.info(`Found ${deals.length} deals to refresh`);

    if (deals.length === 0) {
      logger.info('No deals to refresh, exiting');
      return;
    }

    // Step 2: Refresh each deal
    const results: RefreshResult[] = [];

    for (const deal of deals) {
      try {
        logger.debug(`Refreshing deal: ${deal.id} - ${deal.address}`);

        // Update the deal's updatedAt timestamp
        // This simulates a "refresh" - you can add more complex logic here
        const updated = await retry(
          () =>
            prisma.dealSpec.update({
              where: { id: deal.id },
              data: {
                updatedAt: new Date(),
              },
              select: {
                updatedAt: true,
              },
            }),
          {
            maxAttempts: 3,
            delayMs: 1000,
            onRetry: (attempt, error) => {
              logger.warn(
                `Retry attempt ${attempt} for deal ${deal.id}`,
                error.message
              );
            },
          }
        );

        results.push({
          success: true,
          dealId: deal.id,
          address: deal.address,
          updatedAt: updated.updatedAt.toISOString(),
        });

        logger.debug(`Successfully refreshed deal: ${deal.id}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        results.push({
          success: false,
          dealId: deal.id,
          address: deal.address,
          error: errorMessage,
        });

        logger.error(`Failed to refresh deal ${deal.id}`, errorMessage);
      }
    }

    // Step 3: Calculate summary
    const successes = results.filter((r) => r.success);
    const failures = results.filter((r) => !r.success);

    logger.info(
      `Refresh complete: ${successes.length} successful, ${failures.length} failed`
    );

    // Step 4: Send Slack notification
    await sendSlackSummary(results, successes, failures);

    logger.success(
      `Data refresh workflow completed: ${results.length} deals processed`
    );
  } catch (error) {
    logger.error('Data refresh workflow failed', error);
    throw error;
  } finally {
    await closePrismaConnection();
  }
}

/**
 * Send Slack summary notification
 */
async function sendSlackSummary(
  results: RefreshResult[],
  successes: RefreshResult[],
  failures: RefreshResult[]
) {
  // Get Slack webhook from environment or use System Default user
  const slackWebhook =
    process.env.SLACK_WEBHOOK_URL ||
    'https://hooks.slack.com/services/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';

  if (!slackWebhook) {
    logger.warn('No Slack webhook configured, skipping notification');
    return;
  }

  logger.info('Sending Slack summary');

  // Build fields for Slack message
  const fields = [
    {
      title: 'Deals Processed',
      value: results.length.toString(),
    },
    {
      title: '✅ Successful',
      value: successes.length.toString(),
    },
    {
      title: '❌ Failed',
      value: failures.length.toString(),
    },
  ];

  // Add successful deals details (limit to 5)
  const successDetails = successes
    .slice(0, 5)
    .map((result, index) => {
      const updatedAt = result.updatedAt
        ? new Date(result.updatedAt).toLocaleString()
        : 'Unknown';
      return `${index + 1}. *${result.address}*\n🔄 Updated at: ${updatedAt}`;
    })
    .join('\n\n');

  const moreDealsText =
    successes.length > 5
      ? `\n\n_...and ${successes.length - 5} more deals refreshed_`
      : '';

  const message = successDetails
    ? `*Refreshed Deals:*\n\n${successDetails}${moreDealsText}`
    : 'All deals have been refreshed successfully.';

  const color = failures.length > 0 ? 'warning' : 'good';

  const notification = await sendSlackNotification({
    webhook: slackWebhook,
    title: '🔄 Data Refresh Complete',
    message,
    fields,
    color,
  });

  if (!notification.success) {
    logger.error('Failed to send Slack notification', notification.error);
  } else {
    logger.info('Slack notification sent successfully');
  }
}

/**
 * Execute the workflow
 */
if (require.main === module) {
  dataRefreshAndSync()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { dataRefreshAndSync };
