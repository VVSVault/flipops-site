#!/usr/bin/env tsx
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const TOKEN_FILE = path.join(process.cwd(), 'oauth-token.json');
const SERVICE_ACCOUNT_FILE = path.join(process.cwd(), 'google-service-account.json');

async function finalizeSetup() {
  const spreadsheetId = '1TwEzCOn-2FygrJ3jSTixzXgdknMmn-I_AiuHaCPjJKY';
  
  // Load saved OAuth token
  const tokens = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials(tokens);
  
  const drive = google.drive({ version: 'v3', auth: oauth2Client });
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf-8'));
  const serviceAccountEmail = serviceAccount.client_email;
  
  console.log('🔧 Finalizing Google Sheet Setup...\n');
  
  // Share with service account
  console.log('1️⃣ Sharing with service account...');
  try {
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        type: 'user',
        role: 'writer',
        emailAddress: serviceAccountEmail
      }
    });
    console.log(`   ✅ Shared with ${serviceAccountEmail}\n`);
  } catch (error: any) {
    console.log(`   ⚠️  May already be shared: ${error.message}\n`);
  }
  
  // Save configuration
  const configFile = path.join(process.cwd(), 'google-sheet-config.json');
  const config = {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheetName: 'Properties',
    createdAt: new Date().toISOString(),
    owner: 'Your Google Account',
    sharedWith: serviceAccountEmail,
    method: 'OAuth2'
  };
  
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
  console.log('2️⃣ Configuration saved to google-sheet-config.json\n');
  
  console.log('✨ Setup Complete!\n');
  console.log('📋 Sheet Details:');
  console.log(`   ID: ${spreadsheetId}`);
  console.log(`   URL: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
  console.log(`   Shared with: ${serviceAccountEmail}\n`);
  
  console.log('🎯 Next Steps for n8n:');
  console.log('1. Go to: https://primary-production-8b46.up.railway.app');
  console.log('2. Open "FlipOps Google Sheets Sync" workflow');
  console.log('3. Configure the Google Sheets node with:');
  console.log(`   - Document ID: ${spreadsheetId}`);
  console.log('   - Sheet Name: Properties');
  console.log('4. Activate the workflow\n');
  
  console.log('🎯 Expected Alerts (80+ scores):');
  console.log('   • 654 Maple Blvd - Score ~93');
  console.log('   • 369 Spruce Ave - Score ~85');
  console.log('   • 789 Elm Dr - Score ~80');
}

finalizeSetup().catch(console.error);
