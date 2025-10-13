#!/usr/bin/env tsx
/**
 * Guide for setting up Slack OAuth2 in n8n with the new Slack platform
 */

console.log('📱 Slack OAuth2 Setup Guide for n8n');
console.log('=====================================\n');

console.log('Since Slack moved to OAuth2 with refresh tokens, here\'s how to connect:\n');

console.log('STEP 1: In n8n');
console.log('---------------');
console.log('1. Open your workflow in n8n');
console.log('2. Double-click the Slack node');
console.log('3. Under "Credential for Slack API", click "Create New"');
console.log('4. Choose "OAuth2" (NOT "Access Token")');
console.log('5. n8n will show you:');
console.log('   - OAuth Redirect URL (copy this)');
console.log('   - Fields for Client ID and Client Secret\n');

console.log('STEP 2: In Slack App Dashboard');
console.log('-------------------------------');
console.log('1. Go to: https://api.slack.com/apps');
console.log('2. Select your FlipOps app (or create one)');
console.log('3. Under "App Credentials" or "Basic Information":');
console.log('   - Copy the Client ID');
console.log('   - Copy the Client Secret');
console.log('4. Add the OAuth Redirect URL:');
console.log('   - Look for "Redirect URLs" or "OAuth & Permissions"');
console.log('   - Add the URL from n8n (usually like:');
console.log('     https://primary-production-8b46.up.railway.app/rest/oauth2-credential/callback');
console.log('5. Set Bot Token Scopes:');
console.log('   - channels:read');
console.log('   - chat:write');
console.log('   - chat:write.public\n');

console.log('STEP 3: Back in n8n');
console.log('--------------------');
console.log('1. Enter the Client ID and Client Secret');
console.log('2. Click "Connect my account"');
console.log('3. Authorize the app in Slack');
console.log('4. n8n will handle the OAuth flow and refresh tokens automatically\n');

console.log('STEP 4: Configure the Slack Node');
console.log('---------------------------------');
console.log('After OAuth is connected:');
console.log('- Channel: C09JDCY5SKH (or #guardrail-alerts)');
console.log('- Message: Your alert template\n');

console.log('✅ Benefits of OAuth2:');
console.log('- Tokens auto-refresh (no more expiration issues)');
console.log('- More secure than static tokens');
console.log('- Managed by n8n automatically\n');

console.log('🔍 If you have the xoxe token:');
console.log('The xoxe token you have is part of the new system.');
console.log('It needs to be paired with refresh tokens and managed via OAuth2.');
console.log('n8n\'s OAuth2 connection will handle all of this for you.\n');

console.log('📝 Quick Alternative: Incoming Webhooks');
console.log('----------------------------------------');
console.log('If OAuth2 is complex, use Incoming Webhooks:');
console.log('1. In Slack: Apps → Incoming Webhooks → New');
console.log('2. Choose #guardrail-alerts channel');
console.log('3. Copy the webhook URL');
console.log('4. In n8n: Use HTTP Request node instead');
console.log('   - Method: POST');
console.log('   - URL: [webhook URL]');
console.log('   - Body: {"text": "Your message"}');
