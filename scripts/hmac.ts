#!/usr/bin/env tsx
/**
 * HMAC Generator
 * Creates HMAC-SHA256 signatures for webhook payloads
 */

import * as crypto from 'crypto';

const secret = process.env.FO_WEBHOOK_SECRET || '7d82e2b8945c43959699bc3a3c1467bdd66954d25d6f41eb';

// Get payload from command line or stdin
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: tsx scripts/hmac.ts <payload>');
  console.error('   or: echo \'{"test":true}\' | tsx scripts/hmac.ts');
  process.exit(1);
}

const payload = args.join(' ');
const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

console.log(signature);

export function generateHmac(payload: string, webhookSecret?: string): string {
  const secretToUse = webhookSecret || secret;
  return crypto.createHmac('sha256', secretToUse).update(payload).digest('hex');
}