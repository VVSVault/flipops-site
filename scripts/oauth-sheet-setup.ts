#!/usr/bin/env tsx
/**
 * Create Google Sheet using OAuth2 authentication
 * This creates the sheet in YOUR Google Drive, then shares with service account
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as url from 'url';
import open from 'open';

// You'll need to download OAuth2 credentials from Google Cloud Console
// and save them as oauth-credentials.json
const OAUTH_CREDENTIALS_FILE = path.join(process.cwd(), 'oauth-credentials.json');
const TOKEN_FILE = path.join(process.cwd(), 'oauth-token.json');
const SERVICE_ACCOUNT_FILE = path.join(process.cwd(), 'google-service-account.json');

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

async function getAuthenticatedClient() {
  // Check if we have saved tokens
  if (fs.existsSync(TOKEN_FILE)) {
    console.log('Using saved OAuth token...');
    const tokens = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials(tokens);

    // Check if token is expired and refresh if needed
    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
      console.log('Token expired, refreshing...');
      const { credentials } = await oauth2Client.refreshAccessToken();
      fs.writeFileSync(TOKEN_FILE, JSON.stringify(credentials));
      oauth2Client.setCredentials(credentials);
    }

    return oauth2Client;
  }

  // Check if OAuth credentials file exists
  if (!fs.existsSync(OAUTH_CREDENTIALS_FILE)) {
    console.error('❌ OAuth credentials file not found!');
    console.error(`Please download OAuth2 credentials from Google Cloud Console`);
    console.error(`and save them as: ${OAUTH_CREDENTIALS_FILE}`);
    console.error('\nSteps:');
    console.error('1. Go to: https://console.cloud.google.com/apis/credentials');
    console.error('2. Create OAuth 2.0 Client ID (Desktop or Web app)');
    console.error('3. Download the JSON file');
    console.error('4. Save it as oauth-credentials.json in the flipops-site folder');
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(OAUTH_CREDENTIALS_FILE, 'utf-8'));

  const { client_id, client_secret } = credentials.installed || credentials.web;
  const redirect_uri = 'http://localhost:8080/auth/callback';

  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

  // Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file'
    ]
  });

  console.log('🔐 Authorization required!');
  console.log('Opening browser for authentication...');
  console.log(`If browser doesn't open, visit: ${authUrl}`);

  // Open browser
  open(authUrl);

  // Create local server to receive the OAuth callback
  const server = http.createServer();

  return new Promise<any>((resolve, reject) => {
    server.on('request', async (req, res) => {
      const queryObject = url.parse(req.url!, true).query;

      if (queryObject.code) {
        res.end('Authentication successful! You can close this window.');
        server.close();

        try {
          const { tokens } = await oauth2Client.getToken(queryObject.code as string);
          oauth2Client.setCredentials(tokens);

          // Save tokens for future use
          fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens));
          console.log('✅ Authentication successful! Token saved.');

          resolve(oauth2Client);
        } catch (error) {
          reject(error);
        }
      }
    });

    server.listen(8080, () => {
      console.log('Waiting for authentication on http://localhost:8080');
    });
  });
}

async function createSheetWithOAuth() {
  console.log('🚀 FlipOps Google Sheet Setup (OAuth Method)');
  console.log('============================================\n');

  try {
    // Get authenticated OAuth client
    const auth = await getAuthenticatedClient();

    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // Load service account email
    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf-8'));
    const serviceAccountEmail = serviceAccount.client_email;

    // Step 1: Create spreadsheet in YOUR Drive
    console.log('\n1️⃣ Creating spreadsheet in your Google Drive...');

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

    console.log('   ✅ Sheet created in YOUR Google Drive!');
    console.log(`   📋 Sheet ID: ${spreadsheetId}`);
    console.log(`   🔗 URL: ${spreadsheetUrl}\n`);

    // Step 2: Add sample data
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

    // Step 3: Format the sheet
    console.log('3️⃣ Formatting the sheet...');

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  textFormat: { bold: true },
                  backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 }
                }
              },
              fields: 'userEnteredFormat(textFormat,backgroundColor)'
            }
          },
          {
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
            updateSheetProperties: {
              properties: {
                sheetId: 0,
                gridProperties: { frozenRowCount: 1 }
              },
              fields: 'gridProperties.frozenRowCount'
            }
          }
        ]
      }
    });

    console.log('   ✅ Formatting applied\n');

    // Step 4: Share with service account
    console.log('4️⃣ Sharing with service account for n8n access...');

    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        type: 'user',
        role: 'writer',
        emailAddress: serviceAccountEmail
      }
    });

    console.log(`   ✅ Shared with ${serviceAccountEmail} (Editor access)\n`);

    // Step 5: Save configuration
    const configFile = path.join(process.cwd(), 'google-sheet-config.json');
    const config = {
      spreadsheetId,
      spreadsheetUrl,
      sheetName: 'Properties',
      createdAt: new Date().toISOString(),
      owner: 'Your Google Account',
      sharedWith: serviceAccountEmail,
      method: 'OAuth2'
    };

    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    console.log('5️⃣ Configuration saved to google-sheet-config.json\n');

    // Success summary
    console.log('✨ Perfect! Sheet created and configured!\n');
    console.log('📋 IMPORTANT INFORMATION:\n');
    console.log(`Sheet ID: ${spreadsheetId}`);
    console.log(`Sheet URL: ${spreadsheetUrl}`);
    console.log(`Shared with: ${serviceAccountEmail}\n`);

    console.log('🎯 Next Steps for n8n:\n');
    console.log('1. Go to n8n: https://primary-production-8b46.up.railway.app');
    console.log('2. Open "FlipOps Google Sheets Sync" workflow');
    console.log('3. Configure Google Sheets node:');
    console.log(`   - Credential: Use Service Account`);
    console.log(`   - Document ID: ${spreadsheetId}`);
    console.log(`   - Sheet Name: Properties`);
    console.log('4. Save and activate the workflow\n');

    console.log('🎯 Expected high-score alerts:');
    console.log('   • 654 Maple Blvd - Score ~93 (all indicators)');
    console.log('   • 369 Spruce Ave - Score ~85 (4 indicators)');
    console.log('   • 789 Elm Dr - Score ~80 (3 indicators)\n');

    return spreadsheetId;

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code) console.error('Error Code:', error.code);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createSheetWithOAuth().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { createSheetWithOAuth };