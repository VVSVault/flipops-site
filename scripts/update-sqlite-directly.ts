/**
 * Direct SQLite database update for Jacksonville investor
 * Updates investorProfile and minScore with realistic criteria
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../prisma/dev.db');
const BACKUP_PATH = path.join(__dirname, '../prisma/dev.db.backup');

// Realistic investor profile based on research
const realisticProfile = {
  strategies: ['heavy_rehab', 'quick_flip', 'wholesale'],
  priceRanges: [
    { min: 10000, max: 75000, weight: 0.8, label: 'wholesale' },
    { min: 75000, max: 250000, weight: 1.0, label: 'primary' },
    { min: 250000, max: 400000, weight: 0.7, label: 'premium' }
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

async function updateDatabase() {
  console.log('🗄️  Direct SQLite Database Update\n');

  // Check if database exists
  if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ Database not found at: ${DB_PATH}`);
    console.error('   Run: npx prisma db push\n');
    return;
  }

  // Create backup
  console.log('💾 Creating database backup...');
  fs.copyFileSync(DB_PATH, BACKUP_PATH);
  console.log(`✅ Backup created: ${BACKUP_PATH}\n`);

  try {
    const db = new Database(DB_PATH);

    // Check if user exists
    const user = db.prepare('SELECT * FROM User WHERE id = ?').get('test-investor-jacksonville');

    if (!user) {
      console.error('❌ Jacksonville investor not found in database');
      console.error('   Run user creation script first\n');
      db.close();
      return;
    }

    console.log(`📝 Found user: ${user.name || user.email}`);
    console.log(`   Current minScore: ${user.minScore || 'not set'}\n`);

    // Update the user
    const stmt = db.prepare(`
      UPDATE User
      SET
        investorProfile = ?,
        minScore = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(
      JSON.stringify(realisticProfile),
      50,
      'test-investor-jacksonville'
    );

    if (result.changes > 0) {
      console.log('✅ Update successful!\n');

      // Verify the update
      const updated = db.prepare('SELECT * FROM User WHERE id = ?').get('test-investor-jacksonville');
      const profile = JSON.parse(updated.investorProfile);

      console.log('📊 Updated Configuration:');
      console.log(`   • Min Score: ${updated.minScore} (was 65)`);
      console.log(`   • Price Range: $${profile.priceRanges[0].min.toLocaleString()}-$${profile.priceRanges[profile.priceRanges.length - 1].max.toLocaleString()}`);
      console.log(`   • Year Built: ${profile.preferredCharacteristics.preferredYearBuilt.min}-${profile.preferredCharacteristics.preferredYearBuilt.max}`);
      console.log(`   • Square Feet: ${profile.preferredCharacteristics.minSquareFeet}+`);
      console.log(`   • Bedrooms: ${profile.preferredCharacteristics.minBedrooms}+`);
      console.log(`   • Target ZIPs: ${profile.targetZipCodes.length}\n`);

      console.log('🎯 Expected Impact on Jacksonville Properties:');
      console.log('   Property: 1119 GRANT ST (1942, 744 sqft, $24k)');
      console.log('   • NOW ACCEPTED: Year 1942 ✓');
      console.log('   • NOW ACCEPTED: 744 sqft ✓');
      console.log('   • NOW ACCEPTED: $24k price ✓');
      console.log('   • Expected score: ~72 points ✅\n');

      console.log('🚀 Next Steps:');
      console.log('   1. Restart your dev server to pick up changes');
      console.log('   2. Go to: https://primary-production-8b46.up.railway.app/workflow/ORNrSAWVXWeNqAb4');
      console.log('   3. Execute workflow manually');
      console.log('   4. Properties should now pass 50-point threshold!\n');
    } else {
      console.error('❌ Update failed - no rows changed\n');
    }

    db.close();
  } catch (error) {
    console.error('❌ Error updating database:', error.message);
    console.error('\n💡 To restore backup:');
    console.error(`   cp "${BACKUP_PATH}" "${DB_PATH}"\n`);
    throw error;
  }
}

updateDatabase().catch(console.error);
