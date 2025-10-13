#!/usr/bin/env tsx
/**
 * Create Google Sheet via Drive API
 * Alternative approach when Sheets API create fails
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

// Load service account credentials
const keyFile = path.join(process.cwd(), 'google-service-account.json');
const credentials = JSON.parse(fs.readFileSync(keyFile, 'utf-8'));

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

const drive = google.drive({ version: 'v3', auth });
const sheets = google.sheets({ version: 'v4', auth });

// Sample property data
const SAMPLE_DATA = [
  ['address', 'city', 'state', 'zip', 'owner_name', 'foreclosure', 'pre_foreclosure', 'tax_delinquent', 'vacant', 'bankruptcy', 'absentee_owner'],
  ['123 Main St', 'Miami', 'FL', '33139', 'John Doe', 'yes', 'no', 'yes', 'no', 'no', 'yes'],
  ['456 Oak Ave', 'Miami', 'FL', '33140', 'Jane Smith', 'no', 'yes', 'no', 'yes', 'no', 'no'],
  ['789 Elm Dr', 'Miami Beach', 'FL', '33141', 'Bob Johnson', 'yes', 'no', 'yes', 'yes', 'no', 'yes'],
  ['321 Pine St', 'Coral Gables', 'FL', '33142', 'Alice Williams', 'no', 'no', 'yes', 'no', 'yes', 'yes'],
  ['654 Maple Blvd', 'Miami', 'FL', '33143', 'Charlie Brown', 'yes', 'yes', 'yes', 'yes', 'yes', 'yes'],
  ['987 Cedar Way', 'Miami', 'FL', '33144', 'Diana Prince', 'no', 'no', 'no', 'yes', 'no', 'yes'],
  ['147 Birch Ln', 'Miami', 'FL', '33145', 'Edward Jones', 'yes', 'no', 'no', 'no', 'no', 'no'],
  ['258 Willow Ct', 'Miami Beach', 'FL', '33146', 'Frank Miller', 'no', 'yes', 'yes', 'no', 'no', 'yes'],
  ['369 Spruce Ave', 'Miami', 'FL', '33147', 'Grace Lee', 'yes', 'yes', 'yes', 'yes', 'no', 'yes'],
  ['741 Ash Dr', 'Coral Gables', 'FL', '33148', 'Henry Wilson', 'no', 'no', 'yes', 'yes', 'yes', 'no']
];

async function createSheetViaDrive() {
  console.log('🚀 FlipOps Google Sheet Setup (Drive API Method)');
  console.log('================================================\n');

  try {
    // Authorize the client
    await auth.authorize();

    // Step 1: Create a spreadsheet via Drive API
    console.log('1️⃣ Creating spreadsheet via Drive API...');

    const fileMetadata = {
      name: `FlipOps Properties - ${new Date().toLocaleDateString()}`,
      mimeType: 'application/vnd.google-apps.spreadsheet'
    };

    const createResponse = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, name, webViewLink'
    });

    const spreadsheetId = createResponse.data.id!;
    const spreadsheetUrl = createResponse.data.webViewLink!;

    console.log('   ✅ Sheet created successfully via Drive API!');
    console.log(`   📋 Sheet ID: ${spreadsheetId}`);
    console.log(`   🔗 URL: ${spreadsheetUrl}\n`);

    // Step 2: Wait a moment for the sheet to be ready
    console.log('2️⃣ Waiting for sheet to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('   ✅ Sheet is ready\n');

    // Step 3: Try to populate with data
    console.log('3️⃣ Adding sample property data...');

    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'A1:K11',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: SAMPLE_DATA
        }
      });
      console.log('   ✅ Sample data added successfully\n');
    } catch (error: any) {
      console.log('   ⚠️ Could not add data automatically:', error.message);
      console.log('   You can manually copy the data from sample-properties.csv\n');
    }

    // Step 4: Share with your email
    console.log('4️⃣ Setting permissions...');

    try {
      // Share with your email
      await drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
          type: 'user',
          role: 'writer',
          emailAddress: 'tannercarlson@vvsvault.com'
        }
      });
      console.log('   ✅ Shared with tannercarlson@vvsvault.com (Editor access)');

      // Make it accessible to anyone with the link
      await drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
          type: 'anyone',
          role: 'reader'
        }
      });
      console.log('   ✅ Sheet is also accessible to anyone with the link\n');
    } catch (error: any) {
      console.log('   ⚠️ Could not set all permissions:', error.message, '\n');
    }

    // Step 5: Save configuration
    const configFile = path.join(process.cwd(), 'google-sheet-config.json');
    const config = {
      spreadsheetId,
      spreadsheetUrl,
      sheetName: 'Sheet1',
      createdAt: new Date().toISOString(),
      serviceAccount: credentials.client_email,
      createdVia: 'Drive API'
    };

    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    console.log('5️⃣ Configuration saved to google-sheet-config.json\n');

    // Success summary
    console.log('✨ Google Sheet Created Successfully!\n');
    console.log('📋 IMPORTANT - Save this information:\n');
    console.log(`Sheet ID: ${spreadsheetId}`);
    console.log(`Sheet URL: ${spreadsheetUrl}\n`);
    console.log('Next steps:');
    console.log('1. Open the sheet in your browser');
    console.log('2. If data wasn\'t added, copy from sample-properties.csv');
    console.log('3. Go to n8n: https://primary-production-8b46.up.railway.app');
    console.log('4. Open "FlipOps Google Sheets Sync" workflow');
    console.log('5. Configure with this Sheet ID:', spreadsheetId, '\n');

    return spreadsheetId;

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code) console.error('Error Code:', error.code);
    if (error.errors) {
      console.error('Error Details:', JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createSheetViaDrive().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { createSheetViaDrive };
