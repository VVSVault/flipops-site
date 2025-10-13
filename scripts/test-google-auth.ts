#!/usr/bin/env tsx
/**
 * Test Google Authentication and Permissions
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

// Load service account credentials
const keyFile = path.join(process.cwd(), 'google-service-account.json');
const credentials = JSON.parse(fs.readFileSync(keyFile, 'utf-8'));

console.log('🔍 Testing Google Service Account Authentication');
console.log('================================================\n');
console.log(`Service Account: ${credentials.client_email}`);
console.log(`Project ID: ${credentials.project_id}`);
console.log(`Client ID: ${credentials.client_id}\n`);

// Initialize using JWT directly
const auth = new google.auth.JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file'
  ]
});

async function testAuth() {
  try {
    console.log('1️⃣ Testing JWT Authorization...');
    const tokens = await auth.authorize();
    console.log('   ✅ JWT Authorization successful!');
    console.log(`   Access Token: ${tokens.access_token?.substring(0, 20)}...`);
    console.log(`   Token Type: ${tokens.token_type}`);
    console.log(`   Expiry: ${new Date(tokens.expiry_date || 0).toISOString()}\n`);

    // Test Sheets API access
    console.log('2️⃣ Testing Google Sheets API access...');
    const sheets = google.sheets({ version: 'v4', auth });

    try {
      // Try to list spreadsheets (this will fail but shows if API is accessible)
      const response = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `Test Sheet - ${Date.now()}`
          }
        }
      });
      console.log('   ✅ Successfully created test sheet!');
      console.log(`   Sheet ID: ${response.data.spreadsheetId}`);
      console.log(`   URL: ${response.data.spreadsheetUrl}\n`);

      // Try to delete the test sheet
      const drive = google.drive({ version: 'v3', auth });
      await drive.files.delete({
        fileId: response.data.spreadsheetId!
      });
      console.log('   ✅ Successfully deleted test sheet\n');

    } catch (error: any) {
      console.log('   ❌ Sheets API Error:', error.message);
      if (error.code) console.log(`   Error Code: ${error.code}`);
      if (error.errors) {
        console.log('   Error Details:');
        error.errors.forEach((e: any) => {
          console.log(`     - ${e.message}`);
          if (e.domain) console.log(`       Domain: ${e.domain}`);
          if (e.reason) console.log(`       Reason: ${e.reason}`);
        });
      }
      console.log('\n');
    }

    // Test Drive API access
    console.log('3️⃣ Testing Google Drive API access...');
    const drive = google.drive({ version: 'v3', auth });

    try {
      const driveResponse = await drive.about.get({
        fields: 'user,storageQuota'
      });
      console.log('   ✅ Drive API accessible!');
      if (driveResponse.data.user) {
        console.log(`   User: ${driveResponse.data.user.emailAddress}`);
        console.log(`   Permission ID: ${driveResponse.data.user.permissionId}\n`);
      }
    } catch (error: any) {
      console.log('   ❌ Drive API Error:', error.message);
      if (error.code) console.log(`   Error Code: ${error.code}`);
      console.log('\n');
    }

    // Check token info
    console.log('4️⃣ Checking token information...');
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth });
      const tokenInfo = await oauth2.tokeninfo({
        access_token: tokens.access_token
      });
      console.log('   Token Info:');
      console.log(`   - Email: ${tokenInfo.data.email}`);
      console.log(`   - Scope: ${tokenInfo.data.scope}`);
      console.log(`   - Expires in: ${tokenInfo.data.expires_in} seconds\n`);
    } catch (error: any) {
      console.log('   ⚠️  Could not get token info:', error.message, '\n');
    }

    // Summary
    console.log('📊 Summary:');
    console.log('   The service account can authenticate successfully.');
    if (tokens.access_token) {
      console.log('   Access token was generated correctly.');
    }
    console.log('\n💡 Troubleshooting Tips:');
    console.log('   1. Make sure Google Sheets API is enabled');
    console.log('   2. Make sure Google Drive API is enabled');
    console.log('   3. The service account needs "Editor" role in IAM');
    console.log('   4. Sometimes it takes 5-10 minutes for new permissions to propagate');
    console.log('   5. Try creating a sheet manually and sharing it with the service account first\n');

  } catch (error: any) {
    console.error('❌ Authentication failed:', error.message);
    console.error('\n🔧 Debugging Information:');
    console.error(`   Error: ${JSON.stringify(error, null, 2)}`);

    if (error.message?.includes('invalid_grant')) {
      console.error('\n⚠️  Service account authentication failed');
      console.error('   Make sure the private key in google-service-account.json is correct');
    }
  }
}

testAuth().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
