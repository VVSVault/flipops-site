/**
 * Restore Workflows from Local Backups
 * Imports workflow JSON files back into n8n
 */

import fs from 'fs';
import path from 'path';

const N8N_API_URL = process.env.N8N_BASE_URL || 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = process.env.N8N_API_KEY;

if (!N8N_API_KEY) {
  console.error('❌ N8N_API_KEY environment variable required');
  console.error('   Usage: export N8N_API_KEY="your-key" && npx tsx scripts/restore-workflows.ts');
  process.exit(1);
}

const WORKFLOWS_DIR = path.join(process.cwd(), 'workflows');

async function importWorkflow(workflowPath: string) {
  const workflowName = path.basename(workflowPath);
  console.log(`\n📥 Importing ${workflowName}...`);

  const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));

  // Remove id if it exists (n8n will assign new one)
  delete workflowData.id;

  try {
    const response = await fetch(`${N8N_API_URL}/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: JSON.stringify(workflowData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const imported = await response.json();
    console.log(`✅ Imported: ${imported.name} (ID: ${imported.id})`);
    return imported;

  } catch (error: any) {
    console.error(`❌ Failed to import ${workflowName}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🔄 Restoring workflows from local backups...\n');
  console.log(`📂 Backup directory: ${WORKFLOWS_DIR}\n`);

  const workflowFiles = fs.readdirSync(WORKFLOWS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(WORKFLOWS_DIR, f));

  console.log(`Found ${workflowFiles.length} workflow backup(s):\n`);
  workflowFiles.forEach(f => console.log(`  - ${path.basename(f)}`));

  const results = [];
  for (const workflowPath of workflowFiles) {
    const result = await importWorkflow(workflowPath);
    results.push(result);
  }

  const successful = results.filter(r => r !== null);
  console.log(`\n\n📊 Import Summary:`);
  console.log(`   ✅ Successful: ${successful.length}/${workflowFiles.length}`);
  console.log(`   ❌ Failed: ${workflowFiles.length - successful.length}/${workflowFiles.length}`);

  if (successful.length > 0) {
    console.log(`\n✅ Restored workflows:`);
    successful.forEach(w => console.log(`   - ${w.name}`));
  }

  console.log(`\n🔗 View in n8n: ${N8N_API_URL.replace('/api/v1', '')}/workflows`);
}

main().catch(console.error);
