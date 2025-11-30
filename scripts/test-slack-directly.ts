/**
 * Test Slack webhook directly to verify it works
 */

const SLACK_WEBHOOK = 'https://hooks.slack.com/services/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';

async function testSlack() {
  console.log('🧪 Testing Slack webhook...\n');

  const message = {
    text: '🧪 Test from FlipOps - Multi-tenant workflow testing',
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🧪 Test Message",
          emoji: true
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Test Message from FlipOps*\n\nIf you see this, your Slack webhook is working!\n\nTimestamp: ${new Date().toISOString()}`
        }
      }
    ]
  };

  try {
    const response = await fetch(SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    if (response.ok) {
      console.log('✅ SUCCESS! Message sent to Slack');
      console.log('   Check your Slack channel for the test message');
    } else {
      const text = await response.text();
      console.error(`❌ FAILED: ${response.status}`);
      console.error(`   Response: ${text}`);
    }
  } catch (error: any) {
    console.error(`❌ ERROR: ${error.message}`);
  }
}

testSlack();
