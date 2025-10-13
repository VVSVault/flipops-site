#!/usr/bin/env tsx
/**
 * Generate n8n configuration instructions
 */

import * as fs from 'fs';
import * as path from 'path';

// Load configurations
const serviceAccountPath = path.join(process.cwd(), 'google-service-account.json');
const sheetConfigPath = path.join(process.cwd(), 'google-sheet-config.json');

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
const sheetConfig = JSON.parse(fs.readFileSync(sheetConfigPath, 'utf-8'));

console.log('📋 n8n Google Sheets Configuration Guide');
console.log('=========================================\n');

console.log('🔗 n8n Dashboard: https://primary-production-8b46.up.railway.app\n');

console.log('Step 1: Open the Workflow');
console.log('---------------------------');
console.log('• Log into n8n');
console.log('• Find "FlipOps Google Sheets Sync" workflow');
console.log('• Click to open it\n');

console.log('Step 2: Configure Google Sheets Node');
console.log('-------------------------------------');
console.log('• Double-click "Get Properties from Sheet" node');
console.log('• You\'ll see the Google Sheets configuration\n');

console.log('Step 3: Add Service Account Credentials');
console.log('----------------------------------------');
console.log('• Under "Credential for Google Sheets API", click "Create New"');
console.log('• Choose "Service Account" authentication method');
console.log('• Fill in:\n');

console.log('  📧 Service Account Email:');
console.log('  ' + serviceAccount.client_email + '\n');

console.log('  🔑 Private Key (COPY EVERYTHING below, including BEGIN/END):');
console.log('  ╔════════════════════════════════════════════════════════════');
serviceAccount.private_key.split('\n').forEach((line: string) => {
  console.log('  ║ ' + line);
});
console.log('  ╚════════════════════════════════════════════════════════════\n');

console.log('  ⚠️  Leave "Impersonate Email" empty');
console.log('• Click "Save" to save the credential\n');

console.log('Step 4: Configure Sheet Settings');
console.log('---------------------------------');
console.log('• Document ID:');
console.log('  ' + sheetConfig.spreadsheetId + '\n');
console.log('• Range:');
console.log('  Properties!A:K\n');
console.log('• Options:');
console.log('  - Data Location on Sheet: "Header Row"');
console.log('  - Output: "All Items"\n');

console.log('Step 5: Test the Connection');
console.log('---------------------------');
console.log('• Click "Execute Node" button');
console.log('• You should see 10 property records');
console.log('• If successful, you\'ll see the data from your sheet\n');

console.log('Step 6: Save and Activate');
console.log('-------------------------');
console.log('• Click "Save" (top right)');
console.log('• Toggle the workflow to "Active" (top right switch)\n');

console.log('📊 Your Google Sheet:');
console.log('---------------------');
console.log('• Sheet URL: ' + sheetConfig.spreadsheetUrl);
console.log('• Sheet ID: ' + sheetConfig.spreadsheetId);
console.log('• Created: ' + sheetConfig.createdAt + '\n');

console.log('🎯 Expected Results:');
console.log('--------------------');
console.log('Once activated, the workflow will:');
console.log('• Run every 5 minutes');
console.log('• Check for properties with score 80+');
console.log('• Send alerts to Slack for:');
console.log('  - 654 Maple Blvd (Score: 93)');
console.log('  - 369 Spruce Ave (Score: 85)');
console.log('  - 789 Elm Dr (Score: 80)\n');

console.log('🔍 Troubleshooting:');
console.log('-------------------');
console.log('If you get "unauthorized" errors:');
console.log('• Make sure the service account email is correct');
console.log('• Verify the private key is copied completely');
console.log('• Check that the sheet is shared with the service account\n');

console.log('✅ Ready to configure n8n!');
console.log('Go to: https://primary-production-8b46.up.railway.app');
