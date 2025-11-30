/**
 * Update Jacksonville test investor with realistic, research-backed criteria
 * Based on actual fix-and-flip / wholesaling industry standards
 */

const FO_API_BASE_URL = 'https://bb4c35d48e9c.ngrok-free.app';
const FO_API_KEY = 'fo_live_10177805c8d743e1a6e1860515dc2b3f';

async function updateInvestorProfile() {
  console.log('🔄 Updating Jacksonville investor with realistic criteria...\n');

  // Research-backed investor profile for fix-and-flip / wholesaling
  const realisticProfile = {
    strategies: ['heavy_rehab', 'quick_flip', 'wholesale'],

    // Price ranges based on 70% rule - accept ANY price if deal makes sense
    priceRanges: [
      {
        min: 10000,
        max: 50000,
        weight: 0.8, // Wholesale tier - good profit margin
        label: 'wholesale'
      },
      {
        min: 50000,
        max: 150000,
        weight: 1.0, // Primary fix-and-flip sweet spot
        label: 'primary'
      },
      {
        min: 150000,
        max: 300000,
        weight: 0.7, // Higher price = lower margins
        label: 'premium'
      }
    ],

    // Equity based on 70% rule
    equityRequirements: {
      minEquityPercent: 20,       // Minimum to make deal work
      preferredEquityPercent: 30   // Ideal for strong ROI
    },

    // Distress = motivation = better deals
    distressIndicators: {
      foreclosure: 1.0,         // Highest priority
      preForeclosure: 0.95,
      taxDelinquent: 0.9,        // Strong indicator
      vacant: 0.85,              // Very good indicator
      absenteeOwner: 0.75,       // Good indicator
      bankruptcy: 0.7
    },

    // Flexible characteristics - research shows older/smaller homes are PRIME opportunities
    preferredCharacteristics: {
      minBedrooms: 1,     // Accept 1BR for conversion opportunities
      maxBedrooms: 5,
      minBathrooms: 1,
      maxBathrooms: 4,
      minSquareFeet: 500,  // Small homes = lower rehab costs
      maxSquareFeet: 3500,

      // CRITICAL: Accept older homes (1900+) - these are the BEST flip opportunities
      // 49% of US homes are 44+ years old - can't exclude them!
      preferredYearBuilt: {
        min: 1900,        // Accept "grandmom homes" from early 1900s
        max: 2025,        // Up to current year
        sweetSpot: {
          min: 1950,      // Post-war homes are easier to permit/finance
          max: 1990,      // Not too old, not too new
          bonus: 3        // Extra points for sweet spot
        }
      }
    },

    preferredCondition: {
      distressed: true,
      turnkey: false,          // Looking for value-add opportunities
      minRepairNeeds: 10000,   // Lowered - cosmetic rehab can be $20/sqft
      maxRepairNeeds: 100000   // Raised - can handle heavy rehab
    },

    partnerPreferences: {
      hasRealtorPartner: true,
      hasContractorNetwork: true,
      prefersMLS: false,
      canCloseQuickly: true
    },

    dealBreakers: {
      noCondos: false,           // Condos can be good deals
      noMobileHomes: true,
      noCommercial: true,
      noCoops: true,
      maxHOAFees: 250
    },

    timeHorizon: 'short_term',    // Quick flips
    riskTolerance: 'moderate_to_high',

    leadPreferences: {
      dailyMaxLeads: 25,          // Increased - more flexible criteria
      minMatchScore: 50,          // Lowered to 50 to capture more opportunities
      topLeadsPerDay: 10          // Increased - want more options
    },

    targetZipCodes: [
      // Jacksonville, FL
      '32202', '32204', '32205', '32206', '32207',
      '32208', '32209', '32210', '32211', '32216',
      '32217', '32218', '32219', '32220', '32221',
      // Orlando, FL (added for testing)
      '32801', '32803', '32804', '32805', '32806'
    ]
  };

  try {
    const response = await fetch(`${FO_API_BASE_URL}/api/users/test-investor-jacksonville`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': FO_API_KEY
      },
      body: JSON.stringify({
        investorProfile: realisticProfile,
        minScore: 50  // Lowered threshold to see more deals
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update: ${response.status} ${await response.text()}`);
    }

    const result = await response.json();
    console.log('✅ Updated investor profile successfully!\n');
    console.log('📊 Key Changes:');
    console.log('   • Price range: Now accepts $10k-$300k (was $50k-$400k)');
    console.log('   • Year built: Now accepts 1900-2025 (was 1950-1990)');
    console.log('   • Square footage: Now accepts 500+ sqft (was 800+)');
    console.log('   • Bedrooms: Now accepts 1+ BR (was 2+)');
    console.log('   • Min score: Lowered to 50 (was 65)');
    console.log('   • Sweet spot bonus: Added configurable bonus points\n');

    console.log('🎯 This profile is based on real-world fix-and-flip research:');
    console.log('   ✓ 49% of US homes are 44+ years old (pre-1980)');
    console.log('   ✓ "Grandmom homes" (1900s-1940s) are prime flip candidates');
    console.log('   ✓ Smaller homes = lower rehab costs = better margins');
    console.log('   ✓ 70% rule applies to ALL price points');
    console.log('   ✓ Distress indicators drive better deal opportunities\n');

    return result;
  } catch (error) {
    console.error('❌ Error updating profile:', error.message);
    throw error;
  }
}

updateInvestorProfile().catch(console.error);
