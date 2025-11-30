import fs from 'fs';

const workflowsData = JSON.parse(fs.readFileSync('temp-workflows.json', 'utf-8'));
const workflows = workflowsData.data;

const discoveryWorkflows = workflows.filter((w: any) =>
  w.name.toLowerCase().includes('discovery') ||
  w.name.toLowerCase().includes('property')
);

console.log('🔍 Discovery & Property Workflows Analysis\n');
console.log('=' .repeat(80));

discoveryWorkflows.forEach((workflow: any) => {
  console.log(`\n📋 ${workflow.name}`);
  console.log(`   ID: ${workflow.id}`);
  console.log(`   Created: ${new Date(workflow.createdAt).toLocaleDateString()}`);
  console.log(`   Updated: ${new Date(workflow.updatedAt).toLocaleDateString()}`);
  console.log(`   Active: ${workflow.active}`);
  console.log(`   Nodes: ${workflow.nodes?.length || 0}`);

  // Analyze nodes to understand functionality
  if (workflow.nodes && workflow.nodes.length > 0) {
    console.log(`\n   Node Breakdown:`);

    const nodeTypes = workflow.nodes.map((n: any) => n.type);
    const uniqueTypes = [...new Set(nodeTypes)];

    // Check for key integrations
    const hasGoogleSheets = nodeTypes.some((t: string) => t.includes('googleSheets') || t.includes('Google'));
    const hasHTTP = nodeTypes.some((t: string) => t.includes('httpRequest'));
    const hasWebhook = nodeTypes.some((t: string) => t.includes('webhook'));
    const hasSlack = nodeTypes.some((t: string) => t.includes('slack'));
    const hasCode = nodeTypes.some((t: string) => t.includes('code'));
    const hasCron = nodeTypes.some((t: string) => t.includes('schedule') || t.includes('cron'));

    console.log(`   - Google Sheets: ${hasGoogleSheets ? '✅' : '❌'}`);
    console.log(`   - HTTP Requests: ${hasHTTP ? '✅' : '❌'}`);
    console.log(`   - Webhooks: ${hasWebhook ? '✅' : '❌'}`);
    console.log(`   - Slack Alerts: ${hasSlack ? '✅' : '❌'}`);
    console.log(`   - Code Nodes: ${hasCode ? '✅' : '❌'}`);
    console.log(`   - Scheduled: ${hasCron ? '✅' : '❌'}`);

    // Look for API endpoints being called
    const httpNodes = workflow.nodes.filter((n: any) => n.type.includes('httpRequest'));
    if (httpNodes.length > 0) {
      console.log(`\n   API Endpoints Called:`);
      httpNodes.forEach((node: any) => {
        const url = node.parameters?.url || 'Unknown';
        const method = node.parameters?.method || 'GET';
        console.log(`   - ${method} ${url}`);
      });
    }

    // Check for ngrok URLs (indicates needs updating)
    const workflowStr = JSON.stringify(workflow);
    const hasNgrok = workflowStr.includes('ngrok');
    const ngrokMatches = workflowStr.match(/https:\/\/[a-z0-9]+\.ngrok-free\.app/g);
    if (hasNgrok && ngrokMatches) {
      console.log(`\n   ⚠️  Uses ngrok: ${[...new Set(ngrokMatches)].join(', ')}`);
    }
  }

  console.log('\n' + '-'.repeat(80));
});

console.log('\n\n📊 SUMMARY\n');
console.log(`Total Discovery/Property Workflows: ${discoveryWorkflows.length}`);
console.log(`\nWorkflow Names:`);
discoveryWorkflows.forEach((w: any) => {
  console.log(`  - ${w.name} (${w.nodes?.length || 0} nodes)`);
});

// Cleanup
fs.unlinkSync('temp-workflows.json');
