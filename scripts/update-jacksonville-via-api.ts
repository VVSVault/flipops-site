/**
 * Update Jacksonville investor with realistic criteria via API
 * Using the /api/users/[id] PATCH endpoint
 */

const FO_API_BASE_URL = 'http://localhost:3007'; // Local dev server
const FO_API_KEY = 'fo_live_10177805c8d743e1a6e1860515dc2b3f';

async function updateJacksonvilleInvestor() {
  console.log('🔄 Updating Jacksonville investor with realistic criteria...\n');

  const realisticProfile = {
    strategies: ['heavy_rehab', 'quick_flip', 'wholesale'],

    priceRanges: [
      {
        min: 10000,
        max: 75000,
        weight: 0.8,
        label: 'wholesale'
      },
      {
        min: 75000,
        max: 250000,
        weight: 1.0,
        label: 'primary'
      },
      {
        min: 250000,
        max: 400000,
        weight: 0.7,
        label: 'premium'
      }
    ],

    equityRequirements: {
      minEquityPercent: 20,
      preferredEquityPercent: 30
    },

    distressIndicators: {
      foreclosure: 1.0,
      preForeclosure: 0.95,
      taxDelinquent: 0.9,
      vacant: 0.9,
      absenteeOwner: 0.75,
      bankruptcy: 0.7
    },

    preferredCharacteristics: {
      minBedrooms: 1,
      maxBedrooms: 5,
      minBathrooms: 1,
      maxBathrooms: 4,
      minSquareFeet: 500,
      maxSquareFeet: 3500,
      preferredYearBuilt: {
        min: 1900,
        max: 2025,
        sweetSpot: {
          min: 1950,
          max: 1990,
          bonus: 3
        }
      }
    },

    preferredCondition: {
      distressed: true,
      turnkey: false,
      minRepairNeeds: 10000,
      maxRepairNeeds: 100000
    },

    partnerPreferences: {
      hasRealtorPartner: true,
      hasContractorNetwork: true,
      prefersMLS: false,
      canCloseQuickly: true
    },

    dealBreakers: {
      noCondos: false,
      noMobileHomes: true,
      noCommercial: true,
      noCoops: true,
      maxHOAFees: 250
    },

    timeHorizon: 'short_term',
    riskTolerance: 'moderate_to_high',

    leadPreferences: {
      dailyMaxLeads: 25,
      minMatchScore: 50,
      topLeadsPerDay: 10
    },

    targetZipCodes: [
      '32202', '32204', '32205', '32206', '32207',
      '32208', '32209', '32210', '32211', '32216',
      '32217', '32218', '32219', '32220', '32221',
      '32801', '32803', '32804', '32805', '32806'
    ]
  };

  try {
    console.log('📡 Sending update request to API...');

    const response = await fetch(`${FO_API_BASE_URL}/api/users/test-investor-jacksonville`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': FO_API_KEY
      },
      body: JSON.stringify({
        investorProfile: realisticProfile,
        minScore: 50
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    console.log('✅ Update successful!\n');
    console.log('📊 Updated Configuration:');
    console.log('   • Min Score: 50 (was 65)');
    console.log('   • Price Range: $10k-$400k (was $50k-$400k)');
    console.log('   • Year Built: 1900-2025 (was 1950-1990)');
    console.log('   • Square Feet: 500-3500 (was 800-3500)');
    console.log('   • Bedrooms: 1-5 (was 2-5)');
    console.log('   • Target ZIPs: 20\n');

    console.log('🎯 Expected Impact on Jacksonville Properties:');
    console.log('   Property: 1119 GRANT ST');
    console.log('   • 1942 built (now accepted, was rejected)');
    console.log('   • 744 sqft (now accepted, was rejected)');
    console.log('   • $24k price (now in wholesale tier)');
    console.log('   • Tax delinquent + vacant + absentee + corporate');
    console.log('   • Expected score: ~72 points ✅ PASSES\n');

    console.log('🚀 Next Steps:');
    console.log('   1. Go to n8n workflow: https://primary-production-8b46.up.railway.app/workflow/ORNrSAWVXWeNqAb4');
    console.log('   2. Click "Execute Workflow" to test');
    console.log('   3. Check "Calculate Match Scores" node for new scores');
    console.log('   4. Properties should now flow to database!\n');

    return result;
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure dev server is running: PORT=3007 npm run start');
    console.error('   2. Check that API endpoint exists: /api/users/[id]');
    console.error('   3. Verify API key is correct\n');
    throw error;
  }
}

updateJacksonvilleInvestor().catch(console.error);
