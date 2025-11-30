/**
 * ATTOM Property Discovery Workflow - V2 Refactored
 *
 * Refactored to break large Code nodes into smaller focused nodes (< 100 lines each)
 * to avoid n8n UI parsing issues.
 *
 * Changes from V1:
 * - Broke "Batch Enrich & Score" (300 lines) into 3 nodes:
 *   1. Calculate Scores (60 lines) - Score each property
 *   2. Transform Properties (80 lines) - Convert ATTOM → FlipOps format
 *   3. Filter & Sort (40 lines) - Filter by score, sort, limit
 */

const FO_API_BASE_URL = 'https://bb4c35d48e9c.ngrok-free.app';

interface Workflow {
  name: string;
  active: boolean;
  settings: { executionOrder: string };
  nodes: any[];
  connections: Record<string, any>;
}

export function buildAttomPropertyDiscoveryWorkflowV2(): Workflow {
  const FO_API_KEY = 'fo_live_10177805c8d743e1a6e1860515dc2b3f';
  const ATTOM_API_KEY = '72403894efb4b2cfeb4b5b41f105a53a';

  return {
    name: 'ATTOM Property Discovery',
    active: false,
    settings: { executionOrder: 'v1' },
    nodes: [
      // 1. Schedule Trigger - Daily at 6am
      {
        parameters: {
          rule: {
            interval: [
              {
                field: 'days',
                daysInterval: 1,
                hour: 6,
                minute: 0
              }
            ]
          }
        },
        id: 'schedule-trigger',
        name: 'Schedule Daily Discovery',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [240, 400]
      },

      // 2. Fetch Active Users
      {
        parameters: {
          method: 'GET',
          url: `${FO_API_BASE_URL}/api/users`,
          authentication: 'none',
          options: {}
        },
        id: 'fetch-users',
        name: 'Fetch Active Users',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [460, 400]
      },

      // 3. Filter Active Users with Investor Profiles
      {
        parameters: {
          jsCode: `// Safety check for UI preview mode
if (!$input.all().length) {
  return [];
}

const data = $input.first().json;
const users = data.users || [];

return users
  .filter(user => {
    if (!user.onboarded) return false;
    if (!user.investorProfile) return false;

    // Parse investorProfile if it's a string
    let profile = user.investorProfile;
    if (typeof profile === 'string') {
      try {
        profile = JSON.parse(profile);
      } catch (e) {
        console.warn('Failed to parse investorProfile for user ' + user.id);
        return false;
      }
    }

    return profile.targetZipCodes && profile.targetZipCodes.length > 0;
  })
  .map(user => {
    // Parse investorProfile for output
    let profile = user.investorProfile;
    if (typeof profile === 'string') {
      profile = JSON.parse(profile);
    }

    return {
      json: {
        userId: user.id,
        email: user.email,
        name: user.name,
        minScore: user.minScore || 65,
        investorProfile: profile
      }
    };
  });`
        },
        id: 'filter-users',
        name: 'Filter Active Users',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [680, 400]
      },

      // 4. Build ATTOM Query from User Profile
      {
        parameters: {
          jsCode: `// Safety check for UI preview mode
if (!$input.all().length) {
  return [];
}

const user = $input.first().json;
const targetZipCodes = user.investorProfile?.targetZipCodes || [];

if (targetZipCodes.length === 0) {
  console.warn('User ' + user.userId + ' has no targetZipCodes');
  return [{
    json: {
      ...user,
      zips: [],
      totalZips: 0,
      error: 'No target ZIP codes configured'
    }
  }];
}

const zips = targetZipCodes.slice(0, 20);
return [{
  json: {
    ...user,
    zips: zips,
    totalZips: zips.length
  }
}];`
        },
        id: 'build-query',
        name: 'Build ATTOM Query',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [900, 400]
      },

      // 5. Loop Through ZIP Codes
      {
        parameters: {
          jsCode: `// Safety check for UI preview mode
if (!$input.all().length) {
  return [];
}

const data = $input.first().json;
const zips = data.zips || [];

return zips.map(zip => ({
  json: {
    userData: data,
    zip: zip
  }
}));`
        },
        id: 'loop-zips',
        name: 'Loop Through ZIPs',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [1120, 400]
      },

      // 6. Fetch from ATTOM API
      {
        parameters: {
          jsCode: `const axios = require('axios');

// Safety check for UI preview mode
if (!$input.all().length) {
  return [];
}

const data = $input.first().json;
const zip = data.zip;
const ATTOM_API_KEY = '${ATTOM_API_KEY}';

try {
  const response = await axios.get(
    'https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/basicprofile',
    {
      params: {
        postalcode: zip,
        pagesize: 50
      },
      headers: {
        'apikey': ATTOM_API_KEY,
        'accept': 'application/json'
      }
    }
  );

  const properties = response.data?.property || [];

  return [{
    json: {
      userData: data.userData,
      zip: zip,
      properties: properties,
      count: properties.length
    }
  }];
} catch (error) {
  console.error('ATTOM API error for ZIP ' + zip + ':', error.message);
  return [{
    json: {
      userData: data.userData,
      zip: zip,
      properties: [],
      count: 0,
      error: error.message
    }
  }];
}`
        },
        id: 'fetch-attom',
        name: 'Fetch from ATTOM',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [1340, 400]
      },

      // 7. Calculate Match Scores
      {
        parameters: {
          jsCode: `// Safety check for UI preview mode
if (!$input.all().length) {
  return [];
}

const data = $input.first().json;
const properties = data.properties || [];
const profile = data.userData.investorProfile;

function calculateMatchScore(property, profile) {
  let score = 0;
  const salePrice = property.sale?.saleAmountData?.saleAmt || 0;
  const marketValue = property.assessment?.market?.mktTtlValue || 0;
  const year = property.summary?.yearBuilt ? parseInt(property.summary.yearBuilt) : null;
  const beds = property.building?.rooms?.beds ? parseInt(property.building.rooms.beds) : null;
  const sqft = property.building?.size?.livingSize ? parseInt(property.building.size.livingSize) : null;

  // === PRICE MATCH (30 points max) ===
  // User defines priceRanges with weight multipliers for their preferred price tiers
  if (profile.priceRanges && profile.priceRanges.length > 0 && salePrice > 0) {
    for (const range of profile.priceRanges) {
      if (salePrice >= range.min && salePrice <= range.max) {
        score += 30 * (range.weight || 1.0);
        break;
      }
    }
  }

  // === DISTRESS INDICATORS (40 points max) ===
  // User defines weight for each distress indicator (0-1 multiplier)
  const distress = profile.distressIndicators || {};
  let distressScore = 0;

  // Tax delinquent (up to 10pts based on user weight)
  if (property.assessment?.delinquentyear) {
    const delinquentYear = parseInt(property.assessment.delinquentyear);
    const currentYear = new Date().getFullYear();
    if (delinquentYear && delinquentYear < currentYear) {
      distressScore += (distress.taxDelinquent || 0) * 10;
    }
  }

  // Absentee owner (up to 10pts based on user weight)
  if (property.assessment?.owner?.absenteeOwnerStatus === 'A') {
    distressScore += (distress.absenteeOwner || 0) * 10;
  }

  // Vacant property (up to 10pts based on user weight)
  if (property.summary?.propClass === 'Vacant') {
    distressScore += (distress.vacant || 0) * 10;
  }

  // Corporate/investor owned (up to 10pts based on user weight)
  if (property.assessment?.owner?.corporateIndicator === 'Y') {
    distressScore += (distress.absenteeOwner || 0) * 10;
  }

  score += Math.min(distressScore, 40); // Cap at 40 points

  // === PROPERTY CHARACTERISTICS (20 points max) ===
  // User defines exact min/max criteria - properties OUTSIDE range get 0 points
  const chars = profile.preferredCharacteristics || {};
  let charScore = 0;

  // Bedrooms (5pts if within user's range, 0 otherwise)
  if (beds !== null && chars.minBedrooms !== undefined) {
    const minBeds = chars.minBedrooms || 0;
    const maxBeds = chars.maxBedrooms || 100;
    if (beds >= minBeds && beds <= maxBeds) {
      charScore += 5;
    }
  }

  // Bathrooms (5pts if within user's range, 0 otherwise)
  if (property.building?.rooms?.bathsTotal && chars.minBathrooms !== undefined) {
    const baths = parseFloat(property.building.rooms.bathsTotal);
    const minBaths = chars.minBathrooms || 0;
    const maxBaths = chars.maxBathrooms || 100;
    if (baths >= minBaths && baths <= maxBaths) {
      charScore += 5;
    }
  }

  // Square footage (5pts if within user's range, 0 otherwise)
  if (sqft !== null && chars.minSquareFeet !== undefined) {
    const minSqft = chars.minSquareFeet || 0;
    const maxSqft = chars.maxSquareFeet || 100000;
    if (sqft >= minSqft && sqft <= maxSqft) {
      charScore += 5;
    }
  }

  // Year built (5pts + bonus if in sweet spot)
  // CRITICAL: Users can set ANY range (1850-2025, 1980-2020, etc.) - fully flexible
  if (year !== null && chars.preferredYearBuilt) {
    const minYear = chars.preferredYearBuilt.min || 1800;
    const maxYear = chars.preferredYearBuilt.max || new Date().getFullYear();

    if (year >= minYear && year <= maxYear) {
      charScore += 5;

      // Sweet spot bonus (optional extra 3-5 points for ideal year range)
      if (chars.preferredYearBuilt.sweetSpot) {
        const sweetMin = chars.preferredYearBuilt.sweetSpot.min;
        const sweetMax = chars.preferredYearBuilt.sweetSpot.max;
        const sweetBonus = chars.preferredYearBuilt.sweetSpot.bonus || 3;
        if (year >= sweetMin && year <= sweetMax) {
          charScore += sweetBonus;
        }
      }
    }
  }

  score += Math.min(charScore, 20); // Cap at 20 points

  // === EQUITY POTENTIAL (10 points max) ===
  // User defines min/preferred equity thresholds
  if (salePrice > 0 && marketValue > 0 && marketValue > salePrice) {
    const equityPercent = ((marketValue - salePrice) / marketValue) * 100;
    const equityReq = profile.equityRequirements || {};

    if (equityPercent >= (equityReq.preferredEquityPercent || 35)) {
      score += 10; // Preferred equity level
    } else if (equityPercent >= (equityReq.minEquityPercent || 20)) {
      score += 5; // Minimum equity level
    }
  }

  return Math.round(score);
}

const scoredProperties = properties.map(property => ({
  ...property,
  matchScore: calculateMatchScore(property, profile)
}));

return [{
  json: {
    userData: data.userData,
    zip: data.zip,
    properties: scoredProperties
  }
}];`
        },
        id: 'calculate-scores',
        name: 'Calculate Match Scores',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [1560, 400]
      },

      // 8. Transform to FlipOps Format
      {
        parameters: {
          jsCode: `// Safety check for UI preview mode
if (!$input.all().length) {
  return [];
}

const data = $input.first().json;
const properties = data.properties || [];

function transformProperty(property) {
  const address = property.address || {};
  const sale = property.sale || {};
  const assessment = property.assessment?.assessed || {};
  const building = property.building || {};

  return {
    address: address.line1 || '',
    city: address.locality || '',
    state: address.countrySubd || '',
    zip: address.postal1 || '',
    county: address.country || '',
    apn: property.identifier?.apn || null,
    ownerName: assessment.owner?.name || null,
    propertyType: building.summary?.propertyType || null,
    bedrooms: building.rooms?.beds ? parseInt(building.rooms.beds) : null,
    bathrooms: building.rooms?.bathstotal ? parseFloat(building.rooms.bathstotal) : null,
    squareFeet: building.size?.livingsize ? parseInt(building.size.livingsize) : null,
    lotSize: property.lot?.lotsize1 ? parseInt(property.lot.lotsize1) : null,
    yearBuilt: building.summary?.yearbuilt ? parseInt(building.summary.yearbuilt) : null,
    assessedValue: assessment.market?.mktttlvalue ? parseFloat(assessment.market.mktttlvalue) : null,
    taxAmount: assessment.tax?.taxtotal ? parseFloat(assessment.tax.taxtotal) : null,
    lastSaleDate: sale.date?.salerecdate || null,
    lastSalePrice: sale.amount?.saleamt ? parseFloat(sale.amount.saleamt) : null,
    estimatedValue: property.avm?.amount?.value ? parseFloat(property.avm.amount.value) : null,
    foreclosure: false,
    preForeclosure: false,
    taxDelinquent: assessment.taxyear ? parseInt(assessment.taxyear) < new Date().getFullYear() - 1 : false,
    vacant: false,
    bankruptcy: false,
    absenteeOwner: assessment.owner?.mailingAddress ?
      assessment.owner.mailingAddress !== address.oneLine : false,
    sourceId: property.identifier?.attomId || null,
    score: property.matchScore || 0,
    metadata: {
      matchScore: property.matchScore || 0,
      attomId: property.identifier?.attomId,
      fips: property.identifier?.fips
    }
  };
}

const transformed = properties.map(transformProperty);

return [{
  json: {
    userData: data.userData,
    zip: data.zip,
    properties: transformed
  }
}];`
        },
        id: 'transform-properties',
        name: 'Transform to FlipOps Format',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [1780, 400]
      },

      // 9. Filter by Score & Sort
      {
        parameters: {
          jsCode: `// Safety check for UI preview mode
if (!$input.all().length) {
  return [];
}

const data = $input.first().json;
const properties = data.properties || [];
const minScore = data.userData.minScore || 65;
const profile = data.userData.investorProfile;
const dailyMax = profile.leadPreferences?.dailyMaxLeads || 20;

// Filter properties that meet minimum score
const qualified = properties.filter(p => p.score >= minScore);

// Sort by score (highest first) and limit
const topProperties = qualified
  .sort((a, b) => b.score - a.score)
  .slice(0, dailyMax);

// Calculate average score
const avgScore = qualified.length > 0
  ? Math.round(qualified.reduce((sum, p) => sum + p.score, 0) / qualified.length)
  : 0;

return [{
  json: {
    userData: data.userData,
    zip: data.zip,
    totalProperties: properties.length,
    qualifiedProperties: qualified.length,
    topProperties: topProperties,
    averageScore: avgScore
  }
}];`
        },
        id: 'filter-sort',
        name: 'Filter by Score & Sort',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [2000, 400]
      },

      // 10. Aggregate All ZIPs
      {
        parameters: {
          aggregate: 'aggregateAllItemData'
        },
        id: 'aggregate-zips',
        name: 'Aggregate All ZIPs',
        type: 'n8n-nodes-base.aggregate',
        typeVersion: 1,
        position: [2220, 400]
      },

      // 11. Deduplicate & Prepare for Ingestion
      {
        parameters: {
          jsCode: `// Safety check for UI preview mode
if (!$input.all().length) {
  return [];
}

const allItems = $input.all();
let allProperties = [];
let userData = null;

for (const item of allItems) {
  const data = item.json;
  if (!userData) userData = data.userData;

  const props = data.topProperties || [];
  allProperties = allProperties.concat(props);
}

// Deduplicate by sourceId
const seen = new Set();
const unique = allProperties.filter(p => {
  if (!p.sourceId || seen.has(p.sourceId)) return false;
  seen.add(p.sourceId);
  return true;
});

// Sort and limit globally
const dailyMax = userData?.investorProfile?.leadPreferences?.dailyMaxLeads || 20;
const final = unique
  .sort((a, b) => b.score - a.score)
  .slice(0, dailyMax);

return [{
  json: {
    userData: userData,
    properties: final,
    totalUnique: unique.length,
    finalCount: final.length
  }
}];`
        },
        id: 'deduplicate',
        name: 'Deduplicate Properties',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [2440, 400]
      },

      // 12. Check If Any Qualified - Returns empty if no properties
      {
        parameters: {
          jsCode: `// Safety check for UI preview mode
if (!$input.all().length) {
  return [];
}

const data = $input.first().json;

// Only pass through if we have properties
if (data.finalCount > 0) {
  return [{
    json: data
  }];
}

// Return empty array to stop execution
return [];`
        },
        id: 'check-if-any',
        name: 'Filter If Has Properties',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [2660, 400]
      },

      // 13. Ingest to Database
      {
        parameters: {
          jsCode: `const axios = require('axios');

// Safety check for UI preview mode
if (!$input.all().length) {
  return [];
}

const data = $input.first().json;
const properties = data.properties || [];
const userData = data.userData;
const FO_API_KEY = '${FO_API_KEY}';

try {
  const response = await axios.post(
    '${FO_API_BASE_URL}/api/properties/ingest',
    {
      userId: userData.userId,
      properties: properties
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': FO_API_KEY,
        'ngrok-skip-browser-warning': 'true'
      }
    }
  );

  return [{
    json: {
      userData: userData,
      properties: properties,
      ingested: response.data.ingested || 0,
      skipped: response.data.skipped || 0,
      success: true
    }
  }];
} catch (error) {
  console.error('Ingest error:', error.message);
  return [{
    json: {
      userData: userData,
      properties: properties,
      ingested: 0,
      skipped: properties.length,
      success: false,
      error: error.message
    }
  }];
}`
        },
        id: 'ingest-properties',
        name: 'Ingest to Database',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [2880, 300]
      },

      // 14. Format Slack Message
      {
        parameters: {
          jsCode: `// Safety check for UI preview mode
if (!$input.all().length) {
  return [];
}

const data = $input.first().json;
const userData = data.userData;
const properties = data.properties || [];
const top5 = properties.slice(0, 5);

let message = '🏘️ *Daily Property Discovery Report*\\n\\n';
message += '👤 *Investor:* ' + userData.name + '\\n';
message += '📊 *Properties Found:* ' + properties.length + ' qualified leads\\n';
message += '✅ *Ingested:* ' + (data.ingested || 0) + ' properties\\n\\n';

if (top5.length > 0) {
  message += '🏆 *Top 5 Properties:*\\n\\n';

  top5.forEach((prop, i) => {
    message += (i + 1) + '. *' + prop.address + '*\\n';
    message += '   📍 ' + prop.city + ', ' + prop.state + ' ' + prop.zip + '\\n';
    message += '   💰 $' + (prop.lastSalePrice || 0).toLocaleString() + ' | ';
    message += '⭐ Score: ' + prop.score + '\\n';
    message += '   🛏️ ' + (prop.bedrooms || 'N/A') + ' bed | ';
    message += '🛁 ' + (prop.bathrooms || 'N/A') + ' bath | ';
    message += '📐 ' + ((prop.squareFeet || 0).toLocaleString()) + ' sqft\\n\\n';
  });
}

return [{
  json: {
    text: message
  }
}];`
        },
        id: 'format-slack',
        name: 'Format Slack Message',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [3100, 300]
      },

      // 15. Send to Slack
      {
        parameters: {
          method: 'POST',
          url: 'https://hooks.slack.com/services/YOUR_WEBHOOK_URL',
          authentication: 'none',
          options: {}
        },
        id: 'send-slack',
        name: 'Send to Slack',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [3320, 300]
      }
    ],
    connections: {
      'Schedule Daily Discovery': {
        main: [[{ node: 'Fetch Active Users', type: 'main', index: 0 }]]
      },
      'Fetch Active Users': {
        main: [[{ node: 'Filter Active Users', type: 'main', index: 0 }]]
      },
      'Filter Active Users': {
        main: [[{ node: 'Build ATTOM Query', type: 'main', index: 0 }]]
      },
      'Build ATTOM Query': {
        main: [[{ node: 'Loop Through ZIPs', type: 'main', index: 0 }]]
      },
      'Loop Through ZIPs': {
        main: [[{ node: 'Fetch from ATTOM', type: 'main', index: 0 }]]
      },
      'Fetch from ATTOM': {
        main: [[{ node: 'Calculate Match Scores', type: 'main', index: 0 }]]
      },
      'Calculate Match Scores': {
        main: [[{ node: 'Transform to FlipOps Format', type: 'main', index: 0 }]]
      },
      'Transform to FlipOps Format': {
        main: [[{ node: 'Filter by Score & Sort', type: 'main', index: 0 }]]
      },
      'Filter by Score & Sort': {
        main: [[{ node: 'Aggregate All ZIPs', type: 'main', index: 0 }]]
      },
      'Aggregate All ZIPs': {
        main: [[{ node: 'Deduplicate Properties', type: 'main', index: 0 }]]
      },
      'Deduplicate Properties': {
        main: [[{ node: 'Filter If Has Properties', type: 'main', index: 0 }]]
      },
      'Filter If Has Properties': {
        main: [[{ node: 'Ingest to Database', type: 'main', index: 0 }]]
      },
      'Ingest to Database': {
        main: [[{ node: 'Format Slack Message', type: 'main', index: 0 }]]
      },
      'Format Slack Message': {
        main: [[{ node: 'Send to Slack', type: 'main', index: 0 }]]
      }
    }
  };
}
