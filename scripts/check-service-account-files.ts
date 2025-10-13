#!/usr/bin/env tsx
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const keyFile = path.join(process.cwd(), 'google-service-account.json');
const credentials = JSON.parse(fs.readFileSync(keyFile, 'utf-8'));

const auth = new google.auth.JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });

async function checkFiles() {
  await auth.authorize();
  
  console.log('📁 Checking service account files...\n');
  
  try {
    const response = await drive.files.list({
      pageSize: 100,
      fields: 'files(id, name, size, createdTime, mimeType)',
      orderBy: 'createdTime desc'
    });
    
    const files = response.data.files || [];
    console.log(`Found ${files.length} files:\n`);
    
    files.forEach(file => {
      console.log(`- ${file.name} (${file.id})`);
      console.log(`  Type: ${file.mimeType}`);
      console.log(`  Size: ${file.size || 'N/A'} bytes`);
      console.log(`  Created: ${file.createdTime}\n`);
    });
    
    if (files.length > 0) {
      console.log('To delete old files and free up space, run:');
      console.log('npx tsx scripts/cleanup-service-account-files.ts');
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

checkFiles();
