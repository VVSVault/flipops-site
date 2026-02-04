/**
 * Run Skip Tracing on Properties using BatchData
 *
 * Usage: npx tsx scripts/run-skip-trace.ts <userId> [minScore] [limit]
 *
 * Example:
 *   npx tsx scripts/run-skip-trace.ts cmite33vr0000mfpce5s3nj0v 70 5
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const BATCHDATA_API_KEY = process.env.BATCHDATA_API_KEY || 'eprRFqavyw9vLUP1bZcoUycLJp6EMJxmmnhUGHDy';
const BATCHDATA_API_URL = 'https://api.batchdata.com/api/v1/property/skip-trace';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface SkipTraceResult {
  success: boolean;
  ownerName?: string | null;
  phoneNumbers?: string[];
  emails?: string[];
}

async function skipTraceProperty(
  address: string,
  city: string,
  state: string,
  zip: string
): Promise<SkipTraceResult> {
  try {
    const response = await fetch(BATCHDATA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + BATCHDATA_API_KEY,
      },
      body: JSON.stringify({
        requests: [
          {
            propertyAddress: {
              street: address,
              city: city,
              state: state,
              zip: zip,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      return { success: false };
    }

    const data = await response.json();

    // BatchData returns results in data.results.persons array
    const result = data.results && data.results.persons && data.results.persons[0];

    if (!result || (result.meta && result.meta.error)) {
      const errMsg = result && result.meta ? result.meta.errorMessage : 'No match';
      console.log('      BatchData: ' + errMsg);
      return { success: false };
    }

    // Extract owner name from result.name
    let ownerName: string | null = null;
    if (result.name) {
      if (result.name.full) {
        ownerName = result.name.full;
      } else if (result.name.first && result.name.last) {
        ownerName = result.name.first + ' ' + result.name.last;
      }
    }

    // Extract phone numbers
    const phones: string[] = [];
    if (result.phoneNumbers && Array.isArray(result.phoneNumbers)) {
      for (const p of result.phoneNumbers) {
        if (p.number) phones.push(p.number);
      }
    }

    // Extract emails
    const emails: string[] = [];
    if (result.emails && Array.isArray(result.emails)) {
      for (const e of result.emails) {
        if (e.address) emails.push(e.address);
        else if (e.email) emails.push(e.email);
      }
    }

    return {
      success: true,
      ownerName,
      phoneNumbers: phones,
      emails: emails,
    };
  } catch (error) {
    console.log('      Error: ' + error);
    return { success: false };
  }
}

async function main() {
  const userId = process.argv[2];
  const minScore = parseInt(process.argv[3] || '0');
  const limit = parseInt(process.argv[4] || '10');

  if (!userId) {
    console.error('Usage: npx tsx scripts/run-skip-trace.ts <userId> [minScore] [limit]');
    process.exit(1);
  }

  console.log('='.repeat(80));
  console.log('📞 FlipOps Skip Tracing (BatchData)');
  console.log('='.repeat(80));
  console.log('User: ' + userId);
  console.log('Min Score: ' + minScore);
  console.log('Limit: ' + limit);

  const properties = await prisma.property.findMany({
    where: {
      userId,
      enriched: false,
      score: { gte: minScore },
    },
    orderBy: { score: 'desc' },
    take: limit,
    select: {
      id: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      score: true,
    },
  });

  if (properties.length === 0) {
    console.log('\nNo properties need skip tracing.');
    process.exit(0);
  }

  console.log('\nFound ' + properties.length + ' properties to skip trace:\n');

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < properties.length; i++) {
    const p = properties[i];
    console.log('[' + (i + 1) + '/' + properties.length + '] ' + p.address + ', ' + p.city + ' (Score: ' + p.score + ')');

    const result = await skipTraceProperty(p.address, p.city, p.state, p.zip || '');

    if (result.success) {
      // phoneNumbers and emails are stored as JSON strings in the database
      await prisma.property.update({
        where: { id: p.id },
        data: {
          ownerName: result.ownerName || null,
          phoneNumbers: JSON.stringify(result.phoneNumbers || []),
          emails: JSON.stringify(result.emails || []),
          enriched: true,
          updatedAt: new Date(),
        },
      });

      successCount++;
      console.log('   ✅ Owner: ' + (result.ownerName || 'N/A'));

      const phonesStr = result.phoneNumbers && result.phoneNumbers.length > 0
        ? result.phoneNumbers.slice(0, 2).join(', ')
        : 'None';
      console.log('      Phones: ' + phonesStr);

      const emailsStr = result.emails && result.emails.length > 0
        ? result.emails.join(', ')
        : 'None';
      console.log('      Emails: ' + emailsStr);
    } else {
      failCount++;
      console.log('   ❌ Skip trace failed');
    }

    await sleep(1000);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎉 SKIP TRACING COMPLETE!');
  console.log('');
  console.log('📊 Results:');
  console.log('   Processed: ' + properties.length);
  console.log('   Enriched: ' + successCount);
  console.log('   Failed: ' + failCount);
  console.log('   Cost: ~$' + (successCount * 0.20).toFixed(2));
  console.log('='.repeat(80));

  await prisma.$disconnect();
}

main().catch(console.error);
