#!/usr/bin/env tsx
/**
 * Slack Connection Checker
 * Verifies Slack bot token and channel access
 */

import { WebClient } from '@slack/web-api';

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || 'xoxb-8447243922864-8413444956214-qJQMjnSRYZ3H6P1KLGB0OaBh';
const SLACK_ALERTS_CHANNEL_ID = process.env.SLACK_ALERTS_CHANNEL_ID || 'C09JDCY5SKH';

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = !args.includes('--send');
const testMessage = args.includes('--test');

async function checkSlackConnection() {
  console.log('🔍 Slack Connection Checker');
  console.log('===========================\n');
  console.log(`Bot Token: ${SLACK_BOT_TOKEN.substring(0, 20)}...`);
  console.log(`Channel ID: ${SLACK_ALERTS_CHANNEL_ID}`);
  console.log(`Mode: ${dryRun ? 'Dry run (use --send to post)' : 'Live'}\n`);

  const slack = new WebClient(SLACK_BOT_TOKEN);

  try {
    // Test authentication
    console.log('1️⃣ Testing authentication...');
    const authResult = await slack.auth.test();

    if (!authResult.ok) {
      throw new Error('Authentication failed');
    }

    console.log(`   ✅ Authenticated as: ${authResult.user}`);
    console.log(`   Bot ID: ${authResult.user_id}`);
    console.log(`   Team: ${authResult.team}\n`);

    // Get channel info
    console.log('2️⃣ Checking channel access...');
    try {
      const channelInfo = await slack.conversations.info({
        channel: SLACK_ALERTS_CHANNEL_ID
      });

      if (!channelInfo.ok || !channelInfo.channel) {
        throw new Error('Channel not found');
      }

      const channel = channelInfo.channel as any;
      console.log(`   ✅ Channel found: #${channel.name || 'private-channel'}`);
      console.log(`   Type: ${channel.is_private ? 'Private' : 'Public'}`);
      console.log(`   Members: ${channel.num_members || 'N/A'}\n`);

      // Check if bot is member
      const membership = await slack.conversations.members({
        channel: SLACK_ALERTS_CHANNEL_ID,
        limit: 100
      });

      if (membership.members?.includes(authResult.user_id as string)) {
        console.log('   ✅ Bot is a member of the channel');
      } else {
        console.log('   ⚠️ Bot is NOT a member of the channel');
        console.log('   Run: /invite @YourBotName in the channel');
      }

    } catch (error: any) {
      if (error.data?.error === 'channel_not_found') {
        console.log('   ❌ Channel not found or bot lacks access');
        console.log('   Ensure bot is invited to the channel');
      } else {
        throw error;
      }
    }

    // Test message posting
    if (!dryRun && testMessage) {
      console.log('\n3️⃣ Sending test message...');

      const result = await slack.chat.postMessage({
        channel: SLACK_ALERTS_CHANNEL_ID,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🧪 FlipOps Test Message'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Slack integration verified successfully!'
            },
            fields: [
              {
                type: 'mrkdwn',
                text: `*Time:*\n${new Date().toISOString()}`
              },
              {
                type: 'mrkdwn',
                text: '*Status:*\n✅ Connected'
              }
            ]
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: 'This is an automated test from FlipOps check-slack script'
              }
            ]
          }
        ],
        text: 'FlipOps Test Message - Slack integration verified!'
      });

      if (result.ok) {
        console.log(`   ✅ Message posted successfully!`);
        console.log(`   Message TS: ${result.ts}`);
      } else {
        console.log('   ❌ Failed to post message');
      }

    } else if (dryRun && testMessage) {
      console.log('\n3️⃣ Test message (dry run - not sent):');
      console.log('   Would post: "🧪 FlipOps Test Message"');
      console.log('   To channel: ' + SLACK_ALERTS_CHANNEL_ID);
      console.log('   Use --send --test to actually post');
    }

    // List recent messages (dry run only)
    if (dryRun) {
      console.log('\n4️⃣ Recent channel activity:');
      try {
        const history = await slack.conversations.history({
          channel: SLACK_ALERTS_CHANNEL_ID,
          limit: 3
        });

        if (history.messages && history.messages.length > 0) {
          console.log(`   Found ${history.messages.length} recent message(s)`);
          history.messages.forEach((msg, i) => {
            const preview = msg.text?.substring(0, 50) || 'No text';
            console.log(`   ${i + 1}. ${preview}...`);
          });
        } else {
          console.log('   No recent messages');
        }
      } catch (error) {
        console.log('   Could not fetch history (lacks history:read scope)');
      }
    }

    console.log('\n✨ Slack connection check complete!');
    console.log('===================================\n');

    return true;

  } catch (error: any) {
    console.error('\n❌ Slack connection check failed!\n');
    console.error('Error:', error.data?.error || error.message || error);

    console.error('\nTroubleshooting:');
    console.error('1. Verify SLACK_BOT_TOKEN starts with xoxb-');
    console.error('2. Check bot has these scopes: chat:write, channels:read');
    console.error('3. Ensure bot is invited to channel: /invite @YourBot');
    console.error('4. Verify SLACK_ALERTS_CHANNEL_ID is correct\n');

    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  checkSlackConnection().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { checkSlackConnection };