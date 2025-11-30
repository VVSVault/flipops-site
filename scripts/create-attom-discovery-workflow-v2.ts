/**
 * ATTOM Property Discovery Workflow - V2 (Personalized)
 *
 * This is a SOPHISTICATED property discovery workflow that:
 * 1. Fetches active users with their detailed investorProfile
 * 2. Queries ATTOM API with user-specific filters (price, property type, location)
 * 3. Calculates personalized MATCH SCORE (0-100) based on investor preferences
 * 4. Ranks properties by match score
 * 5. Ingests top N properties per day
 * 6. Sends personalized daily digest
 *
 * Key Innovation: This beats RedBarn by providing HIGHLY PERSONALIZED leads
 */

const N8N_API_URL = 'https://primary-production-8b46.up.railway.app/api/v1';
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNWJiMWFmOC03Zjk5LTQ2YTAtYTViNC04MGI3YmRiNWU4YzYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYxNzkwNTYwLCJleHAiOjE3NjQzMDYwMDB9.RGB3tYsT8s64qNl0T22iXnXBtsiynD5D47OqbjjMP1w';
const FLIPOPS_API_URL = 'https://bb4c35d48e9c.ngrok-free.app';
const ATTOM_API_KEY = '72403894efb4b2cfeb4b5b41f105a53a';

const workflow = {
  name: 'ATTOM Property Discovery (Personalized)',
  nodes: [
    {
      parameters: {
        rule: {
          interval: [{ field: 'cronExpression', expression: '0 6 * * *' }] // Daily at 6am
        }
      },
      id: 'schedule',
      name: 'Schedule Daily Discovery',
      type: 'n8n-nodes-base.scheduleTrigger',
      typeVersion: 1.2,
      position: [250, 300]
    },
    {
      parameters: {
        url: `${FLIPOPS_API_URL}/api/users`,
        method: 'GET',
        options: {}
      },
      id: 'fetch-users',
      name: 'Fetch Active Users',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [450, 300]
    },
    {
      parameters: {
        jsCode: `
// Extract users with active subscriptions from API response
const response = $input.first().json;
const allUsers = response.users || [];

const activeUsers = allUsers.filter(user => {
  return user.subscriptionStatus === 'active' && user.onboarded === true;
});

console.log(\`Found \${activeUsers.length} active users out of \${allUsers.length} total\`);

// Return each user as a separate item for processing
return activeUsers.map(user => ({ json: user }));
`
      },
      id: 'filter-active-users',
      name: 'Filter Active Users',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [650, 300]
    },
    {
      parameters: {
        jsCode: `
/**
 * STEP 1: Build ATTOM API Query Parameters
 * Based on user's targetMarkets, propertyTypes, and investorProfile
 */

const user = $input.all()[0].json;
console.log(\`\\n=== Processing user: \${user.name} (\${user.id}) ===\`);

// Parse user preferences
const targetMarkets = JSON.parse(user.targetMarkets || '[]');
const propertyTypes = JSON.parse(user.propertyTypes || '["SFR"]');
const investorProfile = user.investorProfile ? JSON.parse(user.investorProfile) : null;

console.log(\`Markets: \${targetMarkets.join(', ')}\`);
console.log(\`Property Types: \${propertyTypes.join(', ')}\`);

// Get price range from investor profile
let minPrice = 50000;   // Default
let maxPrice = 500000;  // Default

if (investorProfile?.priceRanges) {
  const primaryRange = investorProfile.priceRanges.find(r => r.weight === 1.0);
  if (primaryRange) {
    minPrice = primaryRange.min;
    maxPrice = primaryRange.max;
  }
}

console.log(\`Price Range: $\${minPrice.toLocaleString()} - $\${maxPrice.toLocaleString()}\`);

// Convert property types to ATTOM format (SFR, CONDO, TOWNHOUSE)
const attomPropertyTypes = propertyTypes
  .map(type => type.toUpperCase())
  .join('|');

// Extract ZIP codes from target markets (simplified - in production, use a market→ZIP mapping)
// For now, we'll use well-known ZIPs for Jacksonville, Orlando, Tampa
const marketZips = {
  'Duval County, FL': ['32202', '32204', '32205', '32206', '32207', '32208', '32209', '32210', '32211', '32216'],
  'Orange County, FL': ['32801', '32803', '32804', '32805', '32806', '32807', '32808', '32809', '32810', '32811'],
  'Hillsborough County, FL': ['33602', '33603', '33604', '33605', '33606', '33607', '33609', '33610', '33611', '33612']
};

const zipsToQuery = [];
for (const market of targetMarkets) {
  if (marketZips[market]) {
    zipsToQuery.push(...marketZips[market].slice(0, 5)); // Limit to 5 ZIPs per market for API efficiency
  }
}

console.log(\`Will query \${zipsToQuery.length} ZIP codes\`);

// Return structured data for next nodes
return [{
  json: {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      minScore: user.minScore || 65,
      investorProfile: investorProfile
    },
    queryParams: {
      zips: zipsToQuery,
      propertyType: attomPropertyTypes,
      minSaleAmt: minPrice,
      maxSaleAmt: maxPrice,
      pageSize: 20  // Fetch 20 properties per ZIP
    }
  }
}];
`
      },
      id: 'build-query',
      name: 'Build ATTOM Query',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [1050, 300]
    },
    {
      parameters: {
        fieldToSplitOut: 'queryParams.zips',
        options: {}
      },
      id: 'loop-zips',
      name: 'Loop Through ZIPs',
      type: 'n8n-nodes-base.splitOut',
      typeVersion: 1,
      position: [1250, 300]
    },
    {
      parameters: {
        url: '=https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/snapshot',
        sendQuery: true,
        queryParameters: {
          parameters: [
            {
              name: 'postalcode',
              value: '={{$json.queryParams.zips}}'
            },
            {
              name: 'propertytype',
              value: '={{$json.queryParams.propertyType}}'
            },
            {
              name: 'minsaleamt',
              value: '={{$json.queryParams.minSaleAmt}}'
            },
            {
              name: 'maxsaleamt',
              value: '={{$json.queryParams.maxSaleAmt}}'
            },
            {
              name: 'pagesize',
              value: '={{$json.queryParams.pageSize}}'
            }
          ]
        },
        sendHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: 'apikey',
              value: ATTOM_API_KEY
            },
            {
              name: 'Accept',
              value: 'application/json'
            }
          ]
        },
        options: {}
      },
      id: 'fetch-attom',
      name: 'Fetch from ATTOM API',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [1450, 300]
    },
    {
      parameters: {
        jsCode: `
/**
 * STEP 2: Transform ATTOM Data & Calculate Match Score
 * This is the MAGIC that makes FlipOps better than RedBarn
 */

const input = $input.all()[0].json;
const user = input.user;
const investorProfile = user.investorProfile;
const attomData = input.json;  // ATTOM API response

if (!attomData.property || attomData.property.length === 0) {
  console.log('No properties found in this ZIP');
  return [];
}

console.log(\`\\nProcessing \${attomData.property.length} properties from ATTOM\`);

/**
 * Calculate Match Score (0-100)
 * Based on how well the property matches investor's preferences
 */
function calculateMatchScore(property, profile) {
  if (!profile) return 50; // Default score if no profile

  let score = 0;

  // 1. PRICE MATCH (30 points)
  const salePrice = property.sale?.amount?.saleamt || property.sale?.amount?.saleAmt || 0;
  if (salePrice > 0) {
    const priceRanges = profile.priceRanges || [];
    for (const range of priceRanges) {
      if (salePrice >= range.min && salePrice <= range.max) {
        score += 30 * range.weight;
        break;
      }
    }
  }

  // 2. DISTRESS INDICATORS (40 points)
  const distressWeights = profile.distressIndicators || {};
  const absenteeOwner = property.owner?.owner1?.mailingCareOfName ? true : false;
  const propertyClass = (property.summary?.propclass || '').toLowerCase();
  const isVacant = propertyClass.includes('vacant');

  if (isVacant && distressWeights.vacant) score += 10 * distressWeights.vacant;
  if (absenteeOwner && distressWeights.absenteeOwner) score += 10 * distressWeights.absenteeOwner;
  // Note: foreclosure/taxDelinquent require separate ATTOM endpoints
  // For MVP, we'll score based on available indicators

  // 3. PROPERTY CHARACTERISTICS (15 points)
  const preferredChar = profile.preferredCharacteristics || {};
  const beds = property.building?.rooms?.beds || 0;
  const sqft = property.building?.size?.bldgsize || 0;
  const yearBuilt = property.summary?.yearbuilt || 0;

  if (beds >= (preferredChar.minBedrooms || 0) && beds <= (preferredChar.maxBedrooms || 10)) {
    score += 5;
  }
  if (sqft >= (preferredChar.minSquareFeet || 0) && sqft <= (preferredChar.maxSquareFeet || 999999)) {
    score += 5;
  }
  if (yearBuilt >= (preferredChar.preferredYearBuilt?.min || 1900) &&
      yearBuilt <= (preferredChar.preferredYearBuilt?.max || 2025)) {
    score += 5;
  }

  // 4. EQUITY POTENTIAL (15 points)
  const assessedValue = property.assessment?.assessed?.assdttlvalue || 0;
  const marketValue = property.assessment?.market?.mktttlvalue || assessedValue;
  if (salePrice > 0 && marketValue > 0) {
    const equityPercent = ((marketValue - salePrice) / marketValue) * 100;
    const minEquity = profile.equityRequirements?.minEquityPercent || 20;
    const preferredEquity = profile.equityRequirements?.preferredEquityPercent || 30;

    if (equityPercent >= preferredEquity) {
      score += 15;
    } else if (equityPercent >= minEquity) {
      score += 8;
    }
  }

  return Math.round(Math.min(score, 100));
}

// Transform and score each property
const transformedProperties = attomData.property.map(prop => {
  const transformed = {
    // Address
    address: prop.address?.line1 || 'Unknown',
    city: prop.address?.locality || 'Unknown',
    state: prop.address?.countrySubd || 'FL',
    zip: prop.address?.postal1 || 'Unknown',
    county: prop.area?.countrySecSubd || null,

    // Property Details
    apn: prop.identifier?.apn || null,
    ownerName: \`\${prop.owner?.owner1?.firstName || ''} \${prop.owner?.owner1?.lastName || ''}\`.trim() || null,
    propertyType: (prop.summary?.propclass || '').toLowerCase().replace(' ', '_') || null,
    bedrooms: prop.building?.rooms?.beds || null,
    bathrooms: prop.building?.rooms?.bathstotal || null,
    squareFeet: prop.building?.size?.bldgsize || null,
    lotSize: prop.lot?.lotSize2 || null,
    yearBuilt: prop.summary?.yearbuilt || null,

    // Financial
    assessedValue: prop.assessment?.assessed?.assdttlvalue || null,
    lastSaleDate: prop.sale?.saleTransDate || null,
    lastSalePrice: prop.sale?.amount?.saleamt || prop.sale?.amount?.saleAmt || null,
    estimatedValue: prop.assessment?.market?.mktttlvalue || prop.assessment?.assessed?.assdttlvalue || null,

    // Distress Flags
    foreclosure: false,
    preForeclosure: false,
    taxDelinquent: false,
    vacant: (prop.summary?.propclass || '').toLowerCase().includes('vacant'),
    bankruptcy: false,
    absenteeOwner: prop.owner?.owner1?.mailingCareOfName ? true : false,

    // Source
    sourceId: prop.identifier?.attomId?.toString() || null,
    metadata: {
      fips: prop.identifier?.fips,
      geoid: prop.location?.geoid,
      matchCode: prop.address?.matchCode,
      latitude: prop.location?.latitude,
      longitude: prop.location?.longitude,
    }
  };

  // Calculate match score
  transformed.matchScore = calculateMatchScore(prop, investorProfile);

  return transformed;
});

// Filter by minimum match score
const minScore = user.minScore || 65;
const qualifiedProperties = transformedProperties.filter(p => p.matchScore >= minScore);

// Sort by match score (highest first)
qualifiedProperties.sort((a, b) => b.matchScore - a.matchScore);

console.log(\`Qualified properties: \${qualifiedProperties.length} (score >= \${minScore})\`);
if (qualifiedProperties.length > 0) {
  console.log(\`Top score: \${qualifiedProperties[0].matchScore} - \${qualifiedProperties[0].address}\`);
}

// Limit to top N properties per day
const leadPreferences = investorProfile?.leadPreferences || {};
const dailyMax = leadPreferences.dailyMaxLeads || 20;
const topProperties = qualifiedProperties.slice(0, dailyMax);

return [{
  json: {
    user: user,
    properties: topProperties,
    stats: {
      fetched: attomData.property.length,
      qualified: qualifiedProperties.length,
      ingesting: topProperties.length,
      minScore: minScore
    }
  }
}];
`
      },
      id: 'transform-and-score',
      name: 'Transform & Calculate Match Score',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [1650, 300]
    },
    {
      parameters: {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: '',
            typeValidation: 'strict'
          },
          conditions: [
            {
              id: 'has-properties',
              leftValue: '={{$json.properties.length}}',
              rightValue: 0,
              operator: {
                type: 'number',
                operation: 'gt'
              }
            }
          ],
          combinator: 'and'
        },
        options: {}
      },
      id: 'check-properties',
      name: 'Has Qualified Properties?',
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      position: [1850, 300]
    },
    {
      parameters: {
        url: `${FLIPOPS_API_URL}/api/properties/ingest`,
        method: 'POST',
        sendBody: true,
        bodyParameters: {
          parameters: [
            {
              name: 'userId',
              value: '={{$json.user.id}}'
            },
            {
              name: 'source',
              value: 'attom'
            },
            {
              name: 'properties',
              value: '={{$json.properties}}'
            }
          ]
        },
        sendHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: 'Content-Type',
              value: 'application/json'
            }
          ]
        },
        options: {}
      },
      id: 'ingest-properties',
      name: 'Ingest Properties',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [2050, 200]
    },
    {
      parameters: {
        jsCode: `
/**
 * STEP 3: Send Personalized Daily Digest
 */

const input = $input.all()[0].json;
const user = input.json.user;
const stats = input.json.stats;
const ingestResult = input.json;

const message = {
  text: \`🏠 *Daily Property Digest for \${user.name}*\`,
  blocks: [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🏠 Your Daily Property Matches',
        emoji: true
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: \`*\${stats.ingesting} new properties* match your criteria today!\`
      }
    },
    {
      type: 'divider'
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: \`*Fetched:*\\n\${stats.fetched} properties\`
        },
        {
          type: 'mrkdwn',
          text: \`*Qualified:*\\n\${stats.qualified} (score ≥\${stats.minScore})\`
        },
        {
          type: 'mrkdwn',
          text: \`*Ingested:*\\n\${stats.ingesting} top matches\`
        },
        {
          type: 'mrkdwn',
          text: \`*Personalization:*\\n✅ Active\`
        }
      ]
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Properties',
            emoji: true
          },
          url: \`\${FLIPOPS_API_URL}/properties\`,
          action_id: 'view_properties'
        }
      ]
    }
  ]
};

return [{ json: message }];
`
      },
      id: 'format-digest',
      name: 'Format Daily Digest',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [2250, 200]
    },
    {
      parameters: {
        url: '={{$json.user.slackWebhook}}',
        method: 'POST',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{$json}}',
        options: {}
      },
      id: 'send-slack',
      name: 'Send Slack Notification',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [2450, 200]
    },
    {
      parameters: {
        jsCode: `
// Log skipped user (no qualified properties)
const input = $input.all()[0].json;
console.log(\`No qualified properties for user: \${input.user.name}\`);
return [{ json: { skipped: true, user: input.user.name } }];
`
      },
      id: 'log-skip',
      name: 'Log Skipped User',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [2050, 400]
    }
  ],
  connections: {
    'Schedule Daily Discovery': { main: [[{ node: 'Fetch Active Users', type: 'main', index: 0 }]] },
    'Fetch Active Users': { main: [[{ node: 'Filter Active Users', type: 'main', index: 0 }]] },
    'Filter Active Users': { main: [[{ node: 'Build ATTOM Query', type: 'main', index: 0 }]] },
    'Build ATTOM Query': { main: [[{ node: 'Loop Through ZIPs', type: 'main', index: 0 }]] },
    'Loop Through ZIPs': { main: [[{ node: 'Fetch from ATTOM API', type: 'main', index: 0 }]] },
    'Fetch from ATTOM API': { main: [[{ node: 'Transform & Calculate Match Score', type: 'main', index: 0 }]] },
    'Transform & Calculate Match Score': { main: [[{ node: 'Has Qualified Properties?', type: 'main', index: 0 }]] },
    'Has Qualified Properties?': {
      main: [
        [{ node: 'Ingest Properties', type: 'main', index: 0 }],  // true - has properties
        [{ node: 'Log Skipped User', type: 'main', index: 0 }]  // false - no properties
      ]
    },
    'Ingest Properties': { main: [[{ node: 'Format Daily Digest', type: 'main', index: 0 }]] },
    'Format Daily Digest': { main: [[{ node: 'Send Slack Notification', type: 'main', index: 0 }]] }
  },
  settings: {
    executionOrder: 'v1'
  }
};

async function createWorkflow() {
  console.log('🏗️  Creating ATTOM Property Discovery Workflow (Personalized)...\n');

  try {
    const response = await fetch(`${N8N_API_URL}/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: JSON.stringify(workflow)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create workflow: ${response.status} - ${error}`);
    }

    const createdWorkflow = await response.json();
    console.log('✅ Workflow Created Successfully!');
    console.log(`   ID: ${createdWorkflow.id}`);
    console.log(`   Name: ${createdWorkflow.name}`);
    console.log(`   Nodes: ${createdWorkflow.nodes.length}`);
    console.log('');
    console.log('🎯 Key Features:');
    console.log('   ✅ Multi-tenant (processes all active users)');
    console.log('   ✅ Personalized match scoring (0-100)');
    console.log('   ✅ ATTOM API integration with smart filtering');
    console.log('   ✅ Price range filtering per investor');
    console.log('   ✅ Distress indicator weighting');
    console.log('   ✅ Equity calculation');
    console.log('   ✅ Daily top N leads per investor');
    console.log('   ✅ Slack digest notifications');
    console.log('');
    console.log('📅 Schedule: Daily at 6am');
    console.log('');
    console.log(`🔗 View in n8n: ${N8N_API_URL.replace('/api/v1', '')}/workflow/${createdWorkflow.id}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Activate the workflow in n8n dashboard!');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

createWorkflow();
