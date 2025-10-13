#!/usr/bin/env tsx
/**
 * Google Sheets Setup Script
 * Creates and populates a Google Sheet for FlipOps property data
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
  scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
});

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

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

async function createGoogleSheet() {
  console.log('🚀 FlipOps Google Sheet Setup');
  console.log('==============================\n');

  try {
    // Authorize the client
    await auth.authorize();

    // Step 1: Create a new spreadsheet
    console.log('1️⃣ Creating new Google Sheet...');

    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `FlipOps Properties - ${new Date().toLocaleDateString()}`
        },
        sheets: [{
          properties: {
            title: 'Properties',
            gridProperties: {
              rowCount: 1000,
              columnCount: 26
            }
          }
        }]
      }
    });

    const spreadsheetId = createResponse.data.spreadsheetId!;
    const spreadsheetUrl = createResponse.data.spreadsheetUrl!;

    console.log('   ✅ Sheet created successfully!');
    console.log(`   📋 Sheet ID: ${spreadsheetId}`);
    console.log(`   🔗 URL: ${spreadsheetUrl}\n`);

    // Step 2: Populate with sample data
    console.log('2️⃣ Adding sample property data...');

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Properties!A1:K11',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: SAMPLE_DATA
      }
    });

    console.log('   ✅ Sample data added (10 properties)\n');

    // Step 3: Format the header row
    console.log('3️⃣ Formatting the sheet...');

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            // Bold header row
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  textFormat: {
                    bold: true
                  },
                  backgroundColor: {
                    red: 0.9,
                    green: 0.9,
                    blue: 0.9
                  }
                }
              },
              fields: 'userEnteredFormat(textFormat,backgroundColor)'
            }
          },
          {
            // Auto-resize columns
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 11
              }
            }
          },
          {
            // Freeze header row
            updateSheetProperties: {
              properties: {
                sheetId: 0,
                gridProperties: {
                  frozenRowCount: 1
                }
              },
              fields: 'gridProperties.frozenRowCount'
            }
          }
        ]
      }
    });

    console.log('   ✅ Formatting applied\n');

    // Step 4: Share with your email account
    console.log('4️⃣ Sharing with your account...');

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

      // Also make it accessible to anyone with the link
      await drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
          type: 'anyone',
          role: 'reader'
        }
      });
      console.log('   ✅ Sheet is also accessible to anyone with the link\n');
    } catch (error: any) {
      console.log('   ⚠️ Could not set permissions:', error.message, '\n');
    }

    // Step 5: Save Sheet ID for n8n configuration
    const configFile = path.join(process.cwd(), 'google-sheet-config.json');
    const config = {
      spreadsheetId,
      spreadsheetUrl,
      sheetName: 'Properties',
      createdAt: new Date().toISOString(),
      serviceAccount: credentials.client_email
    };

    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    console.log('5️⃣ Configuration saved to google-sheet-config.json\n');

    // Success summary
    console.log('✨ Google Sheet Setup Complete!\n');
    console.log('📋 IMPORTANT - Save this information:\n');
    console.log(`Sheet ID: ${spreadsheetId}`);
    console.log(`Sheet URL: ${spreadsheetUrl}\n`);
    console.log('Next steps:');
    console.log('1. Go to n8n: https://primary-production-8b46.up.railway.app');
    console.log('2. Open "FlipOps Google Sheets Sync" workflow');
    console.log('3. Edit the Google Sheets node');
    console.log('4. Use Service Account credential with this JSON:');
    console.log(`   - Email: ${credentials.client_email}`);
    console.log('   - Private Key: (from google-service-account.json)');
    console.log(`5. Enter Sheet ID: ${spreadsheetId}`);
    console.log('6. Save and activate the workflow\n');

    // Show expected high-scoring properties
    console.log('🎯 Expected high-score alerts:');
    console.log('   • 654 Maple Blvd - Score ~93 (all indicators)');
    console.log('   • 369 Spruce Ave - Score ~85 (4 indicators)');
    console.log('   • 789 Elm Dr - Score ~80 (3 indicators)\n');

    return spreadsheetId;

  } catch (error: any) {
    console.error('❌ Error creating Google Sheet:', error.message);

    if (error.message?.includes('invalid_grant')) {
      console.error('\n⚠️ Service account authentication failed');
      console.error('Make sure the service account has access to Google Sheets API');
    }

    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createGoogleSheet().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { createGoogleSheet };