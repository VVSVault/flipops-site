/**
 * Test and demonstrate correct Slack webhook payload format
 */

const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/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';

async function testSlackWebhook() {
  console.log('🔔 Testing Slack Webhook\n');
  console.log('=' .repeat(60) + '\n');

  try {
    // Test 1: Simple text message (most basic format)
    console.log('TEST 1: Simple Text Message');
    console.log('-'.repeat(60));

    const simplePayload = {
      text: '✅ FlipOps workflow test - Slack integration working!'
    };

    console.log('Sending payload:', JSON.stringify(simplePayload, null, 2));

    const response1 = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(simplePayload)
    });

    console.log(`Status: ${response1.status} ${response1.statusText}`);
    const text1 = await response1.text();
    console.log(`Response: ${text1}\n`);

    if (!response1.ok) {
      console.error('❌ Simple message failed\n');
      return;
    }

    console.log('✅ Simple message sent successfully!\n');

    // Test 2: Rich formatted message (what n8n should send)
    console.log('=' .repeat(60));
    console.log('TEST 2: Rich Formatted Message');
    console.log('-'.repeat(60));

    const richPayload = {
      text: '🏠 New Properties Found!',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🏠 New High-Score Properties Discovered',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: '*Total Unique:*\n22 properties'
            },
            {
              type: 'mrkdwn',
              text: '*Score Range:*\n50-78 points'
            },
            {
              type: 'mrkdwn',
              text: '*After Daily Limit:*\n20 properties'
            },
            {
              type: 'mrkdwn',
              text: '*Market:*\nJacksonville, FL'
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Top 3 Properties:*\n• 1524 PASCO ST - 78 pts\n• 1119 GRANT ST - 77 pts\n• 312 E ASHLEY ST - 70 pts'
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '📅 Workflow executed at ' + new Date().toLocaleString()
            }
          ]
        }
      ]
    };

    console.log('Sending rich payload...');

    const response2 = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(richPayload)
    });

    console.log(`Status: ${response2.status} ${response2.statusText}`);
    const text2 = await response2.text();
    console.log(`Response: ${text2}\n`);

    if (!response2.ok) {
      console.error('❌ Rich message failed\n');
      return;
    }

    console.log('✅ Rich message sent successfully!\n');

    // Output n8n configuration
    console.log('=' .repeat(60));
    console.log('N8N CONFIGURATION');
    console.log('-'.repeat(60));
    console.log('\n📋 For your n8n "Send Slack Notification" node:\n');
    console.log('Node Type: HTTP Request');
    console.log('Method: POST');
    console.log('URL: ' + SLACK_WEBHOOK_URL);
    console.log('\nHeaders:');
    console.log('  Content-Type: application/json');
    console.log('\nBody Content Type: JSON');
    console.log('\nBody (use Expression mode):');

    const n8nPayload = {
      text: '🏠 New Properties Found!',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🏠 New High-Score Properties Discovered',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: '*Total Unique:*\\n{{ $json.totalUnique }} properties'
            },
            {
              type: 'mrkdwn',
              text: '*After Daily Limit:*\\n{{ $json.finalCount }} properties'
            },
            {
              type: 'mrkdwn',
              text: '*Market:*\\n{{ $json.userData.city || "Multiple Markets" }}'
            },
            {
              type: 'mrkdwn',
              text: '*Workflow:*\\nATTOM Discovery'
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Top Properties:*\\n{{ $json.properties.slice(0, 5).map(p => `• ${p.address} - ${p.score} pts`).join("\\n") }}'
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '📅 Executed at {{ new Date().toLocaleString() }}'
            }
          ]
        }
      ]
    };

    console.log(JSON.stringify(n8nPayload, null, 2));

    console.log('\n\n💡 SIMPLE VERSION (if rich formatting fails):');
    console.log('-'.repeat(60));
    const simpleN8n = {
      text: '🏠 *New Properties Found!*\\n\\n📊 Total: {{ $json.totalUnique }} properties\\n📋 After Limit: {{ $json.finalCount }}\\n🎯 Score Range: {{ $json.properties[0]?.score }}-{{ $json.properties[$json.properties.length-1]?.score }} pts\\n\\n*Top Properties:*\\n{{ $json.properties.slice(0,3).map(p => `• ${p.address} - ${p.score} pts`).join("\\n") }}'
    };
    console.log(JSON.stringify(simpleN8n, null, 2));

    console.log('\n\n✅ Both test messages sent successfully!');
    console.log('Check your #flipops-alerts channel in Slack.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

testSlackWebhook().catch(console.error);
