#!/usr/bin/env tsx
import { google } from 'googleapis';
import * as fs from 'fs';

const creds = JSON.parse(fs.readFileSync('google-service-account.json', 'utf-8'));

async function test() {
  try {
    // Simple auth
    const auth = new google.auth.JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
    });

    // Authorize first
    await auth.authorize();

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('Creating sheet...');
    const res = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'Test Sheet'
        }
      }
    });

    console.log('Success! Sheet ID:', res.data.spreadsheetId);
    console.log('URL:', res.data.spreadsheetUrl);
  } catch (err: any) {
    console.error('Error:', err.response?.data || err.message);
    if (err.response?.data?.error) {
      console.error('Details:', JSON.stringify(err.response.data.error, null, 2));
    }
  }
}

test();