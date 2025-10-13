#!/usr/bin/env tsx
/**
 * Event Fire Tool
 * Sends test guardrail events to the webhook endpoint
 */

import * as crypto from 'crypto';
import { generateHmac } from './hmac';

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/n8n';
const WEBHOOK_SECRET = process.env.FO_WEBHOOK_SECRET || '7d82e2b8945c43959699bc3a3c1467bdd66954d25d6f41eb';

// Parse command line arguments
const args = process.argv.slice(2);
const eventType = args[0] || 'g1.denied';
const dealId = args[1] || 'deal_test_001';

// Generate test event
const event = {
  id: `evt_test_${Date.now()}`,
  type: eventType,
  version: 1,
  occurredAt: new Date().toISOString(),
  tenantId: 'tn_test',
  dealId: dealId,
  p80: 245000,
  maxExposureUsd: 230000,
  reason: 'P80 exceeds maxExposureUsd by $15,000'
};

async function fireEvent() {
  console.log('🚀 Firing Test Event');
  console.log('====================\n');
  console.log('Event Details:');
  console.log(JSON.stringify(event, null, 2));
  console.log('\nTarget URL:', WEBHOOK_URL);

  const payload = JSON.stringify(event);
  const signature = generateHmac(payload, WEBHOOK_SECRET);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-webhook-signature': signature,
    'x-webhook-timestamp': timestamp,
    'x-api-key': 'fo_live_10177805c8d743e1a6e1860515dc2b3f'
  };

  console.log('\nHeaders:');
  Object.entries(headers).forEach(([key, value]) => {
    if (key.toLowerCase().includes('signature')) {
      console.log(`  ${key}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`  ${key}: ${value}`);
    }
  });

  try {
    console.log('\n📡 Sending request...\n');

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: payload
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    let responseData: any;

    try {
      responseData = JSON.parse(responseText);
      console.log('\nResponse Body:');
      console.log(JSON.stringify(responseData, null, 2));
    } catch {
      console.log('\nResponse Text:');
      console.log(responseText);
    }

    if (response.ok) {
      console.log('\n✅ Event fired successfully!');

      if (responseData?.score !== undefined) {
        console.log(`\n📊 Property Score: ${responseData.score}/100`);
        if (responseData.score >= 80) {
          console.log('🔥 HIGH OPPORTUNITY - Alert triggered!');
        }
      }
    } else {
      console.log('\n❌ Event failed!');
      console.log('Check webhook logs for details');
    }

  } catch (error: any) {
    console.error('\n❌ Request failed!');
    console.error('Error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error('\nMake sure the API server is running:');
      console.error('  npm run dev');
    }
  }

  console.log('\n' + '='.repeat(40));
  console.log('Test complete\n');
}

// Run if called directly
if (require.main === module) {
  fireEvent().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { fireEvent };