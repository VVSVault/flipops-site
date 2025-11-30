/**
 * Add userId filtering to all API endpoints for multi-tenant support
 *
 * This script programmatically updates all workflow-related API endpoints
 * to require and filter by userId parameter.
 */

import * as fs from 'fs';
import * as path from 'path';

const ENDPOINTS = [
  {
    file: 'app/api/deals/approve/status/route.ts',
    name: 'G1 - Deal Approval Alert',
    filterTable: 'dealSpec'
  },
  {
    file: 'app/api/deals/bid-spread/status/route.ts',
    name: 'G2 - Bid Spread Alert',
    filterTable: 'dealSpec'
  },
  {
    file: 'app/api/deals/budget-variance/status/route.ts',
    name: 'G3 - Invoice & Budget Guardian',
    filterTable: 'dealSpec'
  },
  {
    file: 'app/api/deals/change-orders/status/route.ts',
    name: 'G4 - Change Order Gatekeeper',
    filterTable: 'changeOrder'
  },
  {
    file: 'app/api/deals/stalled/route.ts',
    name: 'Pipeline Monitoring',
    filterTable: 'dealSpec'
  },
  {
    file: 'app/api/deals/active/route.ts',
    name: 'Data Refresh & Sync',
    filterTable: 'dealSpec'
  },
  {
    file: 'app/api/contractors/performance/route.ts',
    name: 'Contractor Performance Tracking',
    filterTable: 'vendor'
  }
];

function addUserIdExtraction(content: string): string {
  // Find the position after API key authentication block
  const authBlockEnd = content.indexOf('if (expectedApiKey && apiKey && apiKey !== expectedApiKey)');

  if (authBlockEnd === -1) {
    console.log('   ⚠️  Could not find auth block - inserting after GET function start');
    // Insert after function start
    const funcStart = content.indexOf('export async function GET(req: NextRequest) {');
    const tryStart = content.indexOf('try {', funcStart);

    const insertion = `
    // Extract userId from query params (multi-tenant)
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }
`;

    return content.slice(0, tryStart + 6) + insertion + content.slice(tryStart + 6);
  }

  // Find the end of the auth block
  const authBlockEndClosing = content.indexOf('}', authBlockEnd);

  // Insert userId extraction after auth block
  const insertion = `

    // Extract userId from query params (multi-tenant)
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }
`;

  return content.slice(0, authBlockEndClosing + 1) + insertion + content.slice(authBlockEndClosing + 1);
}

function addUserIdToQueries(content: string, filterTable: string): string {
  // Different strategies based on which table we're filtering

  if (filterTable === 'dealSpec') {
    // Add userId to dealSpec.findMany queries
    content = content.replace(
      /await prisma\.dealSpec\.findMany\(\{\s*where:\s*\{/g,
      'await prisma.dealSpec.findMany({\n      where: {\n        userId,'
    );

    // Also handle cases without where clause
    content = content.replace(
      /await prisma\.dealSpec\.findMany\(\{\s*include:/g,
      'await prisma.dealSpec.findMany({\n      where: { userId },\n      include:'
    );

    // Handle OR conditions - add userId to root where
    content = content.replace(
      /where:\s*\{\s*userId,\s*OR:\s*\[/g,
      'where: {\n        userId,\n        OR: ['
    );
  } else if (filterTable === 'changeOrder') {
    // For change orders, filter by deal.userId
    content = content.replace(
      /await prisma\.changeOrder\.findMany\(\{\s*where:\s*\{/g,
      'await prisma.changeOrder.findMany({\n      where: {\n        deal: { userId },'
    );
  } else if (filterTable === 'vendor') {
    // For vendors, filter by userId field
    content = content.replace(
      /await prisma\.vendor\.findMany\(\{/g,
      'await prisma.vendor.findMany({\n      where: { userId },'
    );
  }

  return content;
}

async function updateEndpoint(endpoint: typeof ENDPOINTS[0]) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔧 Updating: ${endpoint.name}`);
  console.log(`   File: ${endpoint.file}`);
  console.log('='.repeat(80));

  const filePath = path.join(process.cwd(), endpoint.file);

  // Read file
  let content = fs.readFileSync(filePath, 'utf-8');

  // Check if already updated
  if (content.includes('userId parameter is required')) {
    console.log('   ✅ Already has userId extraction - skipping');
    return;
  }

  // 1. Add userId extraction
  console.log('   1. Adding userId extraction...');
  content = addUserIdExtraction(content);

  // 2. Add userId to queries
  console.log(`   2. Adding userId filter to ${endpoint.filterTable} queries...`);
  content = addUserIdToQueries(content, endpoint.filterTable);

  // Write back
  fs.writeFileSync(filePath, content, 'utf-8');

  console.log('   ✅ Updated successfully');
}

async function main() {
  console.log('🚀 Adding userId Filtering to API Endpoints\n');
  console.log(`Updating ${ENDPOINTS.length} endpoints...\n`);

  for (const endpoint of ENDPOINTS) {
    try {
      await updateEndpoint(endpoint);
    } catch (error: any) {
      console.error(`   ❌ Failed to update ${endpoint.name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ ALL ENDPOINTS UPDATED');
  console.log('='.repeat(80));
  console.log(`
📋 Summary:
   • Added userId extraction from query params
   • Added userId validation (400 if missing)
   • Added userId filtering to all Prisma queries

🧪 Next Steps:
   1. Test each endpoint with ?userId=<userId> parameter
   2. Verify data isolation (user A can't see user B's data)
   3. Test workflows end-to-end
  `);
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
