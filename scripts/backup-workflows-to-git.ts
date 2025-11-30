/**
 * Automated Workflow Backup to Git
 * Run daily via cron or GitHub Actions
 * Exports ALL workflows from n8n and commits to git
 *
 * Usage:
 *   export N8N_API_KEY="your-key"
 *   npx tsx scripts/backup-workflows-to-git.ts
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const N8N_API_URL = process.env.N8N_BASE_URL || 'https://primary-production-8b46.up.railway.app/api/v1';
// Use the new never-expires API key (from APIs-and-Credentials.md)
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0M2IwYmI1YS1hNjI0LTQxYWMtOWU2Ny05OTMyZTI2YzlhOWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzNTg2MDQwLCJleHAiOjE3NjYxMjA0MDB9.ER-2js6nXztX2OqdJVQIqI1lg0PG_HBEJPjUBeaDxO8';

interface Workflow {
  id: string;
  name: string;
  nodes: any[];
  connections: any;
  settings?: any;
  staticData?: any;
  tags?: any[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

async function backupAllWorkflows() {
  console.log('📥 Fetching all workflows from n8n...\n');
  console.log(`   API URL: ${N8N_API_URL}`);

  try {
    // Fetch all workflows
    const response = await fetch(`${N8N_API_URL}/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch workflows: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const result = await response.json();
    const workflows: Workflow[] = result.data || [];

    console.log(`✅ Found ${workflows.length} workflows\n`);

    if (workflows.length === 0) {
      console.log('⚠️  No workflows to backup. Exiting.');
      return;
    }

    // Create backups directory with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const backupDir = path.join(process.cwd(), '..', 'workflows', 'backups', timestamp);
    const latestDir = path.join(process.cwd(), '..', 'workflows', 'latest');

    // Create directories
    fs.mkdirSync(backupDir, { recursive: true });
    fs.mkdirSync(latestDir, { recursive: true });

    // Save each workflow
    for (const workflow of workflows) {
      const filename = `${workflow.name.replace(/[^a-z0-9-]/gi, '_').toLowerCase()}.json`;
      const filepath = path.join(backupDir, filename);
      const latestPath = path.join(latestDir, filename);

      // Remove runtime/internal data
      const cleanWorkflow = {
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: workflow.settings || {},
        staticData: workflow.staticData || {},
        tags: workflow.tags || [],
        active: workflow.active
      };

      // Write to dated backup
      fs.writeFileSync(filepath, JSON.stringify(cleanWorkflow, null, 2));

      // Write to latest
      fs.writeFileSync(latestPath, JSON.stringify(cleanWorkflow, null, 2));

      console.log(`✅ Backed up: ${workflow.name}`);
      console.log(`   → ${filename}`);
    }

    console.log(`\n📁 Backups saved to:`);
    console.log(`   - workflows/backups/${timestamp}/ (dated backup)`);
    console.log(`   - workflows/latest/ (latest version)`);

    // Git commit
    console.log(`\n📝 Committing to git...`);

    try {
      const workflowsDir = path.join(process.cwd(), '..', 'workflows');

      execSync('git add workflows/', {
        cwd: path.join(process.cwd(), '..'),
        stdio: 'inherit'
      });

      const commitMessage = `chore: automated n8n workflow backup ${timestamp}

Backed up ${workflows.length} workflows:
${workflows.map(w => `  - ${w.name}`).join('\n')}`;

      try {
        execSync(`git commit -m "${commitMessage}"`, {
          cwd: path.join(process.cwd(), '..'),
          stdio: 'inherit'
        });
        console.log(`\n✅ Backup complete and committed!`);
      } catch (commitError: any) {
        if (commitError.message.includes('nothing to commit')) {
          console.log(`\n⚠️  No changes to commit (workflows unchanged)`);
        } else {
          throw commitError;
        }
      }

    } catch (error: any) {
      console.error(`\n⚠️  Git commit failed:`, error.message);
      console.log(`   Backups saved but not committed to git`);
    }

  } catch (error: any) {
    console.error('\n❌ Backup failed:', error.message);

    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Go to n8n UI: https://primary-production-8b46.up.railway.app');
      console.error('   2. Navigate to: Settings → API');
      console.error('   3. Click "Create an API Key"');
      console.error('   4. Copy the key and set: export N8N_API_KEY="your-key"');
    }

    process.exit(1);
  }
}

// Run backup
backupAllWorkflows().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
