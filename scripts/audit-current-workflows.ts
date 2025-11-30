const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';

async function auditWorkflows() {
  console.log('🔍 Auditing Current n8n Workflows\n');
  console.log('=' .repeat(80));

  try {
    // Get all workflows
    const response = await fetch(`${N8N_API_URL}/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch workflows: ${response.status}`);
    }

    const data = await response.json();
    const workflows = data.data;

    console.log(`\n📊 Total Workflows: ${workflows.length}\n`);

    // Categorize workflows
    const categories = {
      guardrails: [],
      monitoring: [],
      discovery: [],
      contractor: [],
      skipTracing: [],
      other: [],
      archived: []
    };

    workflows.forEach((workflow: any) => {
      const name = workflow.name.toLowerCase();

      if (!workflow.active) {
        categories.archived.push(workflow);
      } else if (name.includes('g1') || name.includes('g2') || name.includes('g3') || name.includes('g4')) {
        categories.guardrails.push(workflow);
      } else if (name.includes('pipeline') || name.includes('monitoring') || name.includes('stalled')) {
        categories.monitoring.push(workflow);
      } else if (name.includes('discovery') || name.includes('property') || name.includes('scoring')) {
        categories.discovery.push(workflow);
      } else if (name.includes('contractor') || name.includes('performance')) {
        categories.contractor.push(workflow);
      } else if (name.includes('skip') || name.includes('trace') || name.includes('enrichment')) {
        categories.skipTracing.push(workflow);
      } else {
        categories.other.push(workflow);
      }
    });

    // Print categorized workflows
    console.log('📋 WORKFLOW INVENTORY\n');

    console.log('🛡️  GUARDRAIL WORKFLOWS (G1-G4)');
    console.log('-'.repeat(80));
    categories.guardrails.forEach((w: any) => {
      console.log(`  ✅ ${w.name}`);
      console.log(`     ID: ${w.id} | Active: ${w.active} | Nodes: ${w.nodes?.length || 0}`);
      console.log(`     Updated: ${new Date(w.updatedAt).toLocaleDateString()}`);
      console.log('');
    });

    console.log('📊 MONITORING WORKFLOWS');
    console.log('-'.repeat(80));
    categories.monitoring.forEach((w: any) => {
      console.log(`  ✅ ${w.name}`);
      console.log(`     ID: ${w.id} | Active: ${w.active} | Nodes: ${w.nodes?.length || 0}`);
      console.log(`     Updated: ${new Date(w.updatedAt).toLocaleDateString()}`);
      console.log('');
    });

    console.log('🔍 DISCOVERY WORKFLOWS');
    console.log('-'.repeat(80));
    if (categories.discovery.length === 0) {
      console.log('  ⚠️  NO DISCOVERY WORKFLOWS FOUND - NEED TO BUILD');
    } else {
      categories.discovery.forEach((w: any) => {
        console.log(`  ✅ ${w.name}`);
        console.log(`     ID: ${w.id} | Active: ${w.active} | Nodes: ${w.nodes?.length || 0}`);
        console.log(`     Updated: ${new Date(w.updatedAt).toLocaleDateString()}`);
        console.log('');
      });
    }

    console.log('👷 CONTRACTOR WORKFLOWS');
    console.log('-'.repeat(80));
    if (categories.contractor.length === 0) {
      console.log('  ⚠️  NO CONTRACTOR WORKFLOWS FOUND');
    } else {
      categories.contractor.forEach((w: any) => {
        console.log(`  ✅ ${w.name}`);
        console.log(`     ID: ${w.id} | Active: ${w.active} | Nodes: ${w.nodes?.length || 0}`);
        console.log(`     Updated: ${new Date(w.updatedAt).toLocaleDateString()}`);
        console.log('');
      });
    }

    console.log('📞 SKIP TRACING WORKFLOWS');
    console.log('-'.repeat(80));
    if (categories.skipTracing.length === 0) {
      console.log('  ⚠️  NO SKIP TRACING WORKFLOWS FOUND');
    } else {
      categories.skipTracing.forEach((w: any) => {
        console.log(`  ✅ ${w.name}`);
        console.log(`     ID: ${w.id} | Active: ${w.active} | Nodes: ${w.nodes?.length || 0}`);
        console.log(`     Updated: ${new Date(w.updatedAt).toLocaleDateString()}`);
        console.log('');
      });
    }

    console.log('📦 OTHER WORKFLOWS');
    console.log('-'.repeat(80));
    categories.other.forEach((w: any) => {
      console.log(`  ✅ ${w.name}`);
      console.log(`     ID: ${w.id} | Active: ${w.active} | Nodes: ${w.nodes?.length || 0}`);
      console.log(`     Updated: ${new Date(w.updatedAt).toLocaleDateString()}`);
      console.log('');
    });

    if (categories.archived.length > 0) {
      console.log('🗄️  ARCHIVED/INACTIVE WORKFLOWS');
      console.log('-'.repeat(80));
      categories.archived.forEach((w: any) => {
        console.log(`  📦 ${w.name}`);
        console.log(`     ID: ${w.id} | Nodes: ${w.nodes?.length || 0}`);
        console.log('');
      });
    }

    // Analysis & Recommendations
    console.log('\n' + '='.repeat(80));
    console.log('🎯 RECOMMENDATIONS FOR MULTI-TENANT SAAS\n');

    console.log('✅ WORKFLOWS YOU HAVE:');
    if (categories.guardrails.length > 0) {
      console.log('  • Guardrails (G1-G4) - GOOD');
    }
    if (categories.monitoring.length > 0) {
      console.log('  • Pipeline Monitoring - GOOD');
    }
    if (categories.skipTracing.length > 0) {
      console.log('  • Skip Tracing - GOOD');
    }

    console.log('\n❌ WORKFLOWS YOU NEED TO BUILD:');
    const needed = [];

    if (categories.discovery.length === 0) {
      needed.push('  1. ATTOM Property Discovery (automated daily search)');
    }

    needed.push('  2. User Onboarding (market setup, preferences)');
    needed.push('  3. Property-to-Deal Conversion (trigger when investor clicks "analyze")');
    needed.push('  4. Daily Property Digest (email/Slack with new high-score properties)');
    needed.push('  5. Weekly Performance Report (deals closed, ROI, pipeline health)');
    needed.push('  6. Data Refresh (update property values, foreclosure status)');

    if (categories.contractor.length === 0) {
      needed.push('  7. Contractor Performance Tracking (on-time, on-budget scoring)');
    }

    needed.forEach(item => console.log(item));

    console.log('\n🔧 WORKFLOWS THAT NEED UPDATES FOR MULTI-TENANT:');
    console.log('  • All existing workflows need userId filtering');
    console.log('  • Guardrails need per-user policy settings');
    console.log('  • Monitoring needs to be scoped to user\'s deals only');
    console.log('  • Alerts need to go to correct user\'s Slack/email');

    console.log('\n' + '='.repeat(80));

    // Check for ngrok URLs that need updating
    console.log('\n🔗 CHECKING FOR OUTDATED NGROK URLS...\n');

    const CURRENT_NGROK = 'https://d740f7483316.ngrok-free.app';
    let needsUpdate = 0;

    workflows.forEach((workflow: any) => {
      const workflowStr = JSON.stringify(workflow);
      const ngrokMatches = workflowStr.match(/https:\/\/[a-z0-9]+\.ngrok-free\.app/g);

      if (ngrokMatches) {
        const uniqueUrls = [...new Set(ngrokMatches)];
        const hasOldUrls = uniqueUrls.some(url => url !== CURRENT_NGROK);

        if (hasOldUrls) {
          console.log(`⚠️  ${workflow.name}`);
          console.log(`   Old URLs: ${uniqueUrls.filter(u => u !== CURRENT_NGROK).join(', ')}`);
          needsUpdate++;
        }
      }
    });

    if (needsUpdate === 0) {
      console.log('✅ All workflows using current ngrok URL');
    } else {
      console.log(`\n⚠️  ${needsUpdate} workflows need ngrok URL updates`);
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

auditWorkflows();
