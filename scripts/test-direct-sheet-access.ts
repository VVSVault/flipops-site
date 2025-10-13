#!/usr/bin/env tsx
/**
 * Test direct Google Sheets access with service account
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const keyFile = path.join(process.cwd(), 'google-service-account.json');
const credentials = JSON.parse(fs.readFileSync(keyFile, 'utf-8'));
const SHEET_ID = '1TwEzCOn-2FygrJ3jSTixzXgdknMmn-I_AiuHaCPjJKY';

const auth = new google.auth.JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
});

const sheets = google.sheets({ version: 'v4', auth });

async function testSheetAccess() {
  console.log('🧪 Testing Direct Google Sheets Access');
  console.log('======================================\n');
  
  try {
    await auth.authorize();
    console.log('✅ Authentication successful\n');
    
    console.log('📊 Reading sheet data...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Properties!A:K'
    });
    
    const rows = response.data.values;
    if (rows && rows.length) {
      console.log(`✅ Found ${rows.length} rows\n`);
      
      // Process as properties (skip header)
      const headers = rows[0];
      const properties = rows.slice(1);
      
      console.log('High-score properties:');
      properties.forEach((row: any) => {
        const prop: any = {};
        headers.forEach((header: string, index: number) => {
          prop[header] = row[index];
        });
        
        // Calculate score
        let score = 30;
        if (prop.foreclosure === 'yes') score += 25;
        if (prop.pre_foreclosure === 'yes') score += 20;
        if (prop.tax_delinquent === 'yes') score += 15;
        if (prop.vacant === 'yes') score += 10;
        if (prop.bankruptcy === 'yes') score += 8;
        if (prop.absentee_owner === 'yes') score += 5;
        
        if (score >= 80) {
          console.log(`🔥 ${prop.address} - Score: ${score}`);
        }
      });
      
      console.log('\n✅ Sheet access working perfectly!');
      console.log('The service account can read the sheet.');
      
    } else {
      console.log('❌ No data found in sheet');
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code === 403) {
      console.log('\n⚠️  Permission issue. Make sure:');
      console.log('1. Sheet is shared with:', credentials.client_email);
      console.log('2. Service account has Editor access');
    }
  }
}

testSheetAccess();
