/**
 * Diagnose workflow scoring issues
 * Checks what data n8n is receiving from the API
 */

const FO_API_BASE_URL = 'http://localhost:3007';

async function diagnoseWorkflow() {
  console.log('🔍 Diagnosing Workflow Issue\n');
  console.log('=' .repeat(60) + '\n');

  try {
    // Step 1: Check what API returns
    console.log('STEP 1: Checking FlipOps API Response');
    console.log('-'.repeat(60));

    const response = await fetch(`${FO_API_BASE_URL}/api/users`);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const jacksonville = data.users?.find((u: any) => u.id === 'test-investor-jacksonville');

    if (!jacksonville) {
      console.error('❌ Jacksonville investor not found in API response!');
      console.log(`   Found ${data.users?.length || 0} users:`, data.users?.map((u: any) => u.id));
      return;
    }

    console.log(`✅ Found Jacksonville investor in API`);
    console.log(`   Name: ${jacksonville.name}`);
    console.log(`   Email: ${jacksonville.email}`);
    console.log(`   Min Score: ${jacksonville.minScore}`);

    // Parse investorProfile
    const profile = typeof jacksonville.investorProfile === 'string'
      ? JSON.parse(jacksonville.investorProfile)
      : jacksonville.investorProfile;

    if (!profile) {
      console.error('❌ No investorProfile in API response!');
      return;
    }

    console.log('\n📋 Profile Configuration:');
    console.log(`   Min Bedrooms: ${profile.preferredCharacteristics?.minBedrooms}`);
    console.log(`   Min Square Feet: ${profile.preferredCharacteristics?.minSquareFeet}`);
    console.log(`   Year Built: ${profile.preferredCharacteristics?.preferredYearBuilt?.min}-${profile.preferredCharacteristics?.preferredYearBuilt?.max}`);

    console.log('\n💰 Price Ranges:');
    profile.priceRanges?.forEach((range: any) => {
      console.log(`   - $${range.min.toLocaleString()}-$${range.max.toLocaleString()} (${range.label}, weight: ${range.weight})`);
    });

    // Step 2: Check if this is the OLD or NEW profile
    console.log('\n' + '='.repeat(60));
    console.log('STEP 2: Profile Version Check');
    console.log('-'.repeat(60));

    const isOldProfile =
      jacksonville.minScore === 65 &&
      profile.preferredCharacteristics?.minSquareFeet === 800 &&
      profile.preferredCharacteristics?.preferredYearBuilt?.min === 1950;

    const isNewProfile =
      jacksonville.minScore === 50 &&
      profile.preferredCharacteristics?.minSquareFeet === 500 &&
      profile.preferredCharacteristics?.preferredYearBuilt?.min === 1900;

    if (isOldProfile) {
      console.log('❌ API IS RETURNING OLD PROFILE!');
      console.log('   This means the API is still reading from SQLite, not PostgreSQL');
      console.log('\n   PROBLEM: The dev server needs to be restarted OR .env files are wrong');
    } else if (isNewProfile) {
      console.log('✅ API IS RETURNING NEW PROFILE!');
      console.log('   PostgreSQL is being used correctly');
    } else {
      console.log('⚠️  MIXED PROFILE (some old, some new values)');
      console.log(`   minScore: ${jacksonville.minScore} (should be 50)`);
      console.log(`   minSquareFeet: ${profile.preferredCharacteristics?.minSquareFeet} (should be 500)`);
      console.log(`   yearBuilt.min: ${profile.preferredCharacteristics?.preferredYearBuilt?.min} (should be 1900)`);
    }

    // Step 3: Test scoring with example property
    console.log('\n' + '='.repeat(60));
    console.log('STEP 3: Test Scoring with Example Property');
    console.log('-'.repeat(60));

    const testProperty = {
      address: '1119 GRANT ST',
      city: 'Jacksonville',
      state: 'FL',
      sale: {
        saleAmountData: { saleAmt: 24000 }
      },
      building: {
        size: { livingSize: 744 },
        rooms: { beds: 2 }
      },
      summary: {
        yearBuilt: 1942
      },
      assessment: {
        delinquentyear: 2023,
        owner: {
          absenteeOwnerStatus: 'A',
          corporateIndicator: 'Y'
        },
        market: {
          mktTtlValue: 50000
        }
      }
    };

    console.log('\n🏠 Test Property: 1119 GRANT ST');
    console.log(`   Year Built: ${testProperty.summary.yearBuilt}`);
    console.log(`   Square Feet: ${testProperty.building.size.livingSize}`);
    console.log(`   Price: $${testProperty.sale.saleAmountData.saleAmt.toLocaleString()}`);
    console.log(`   Bedrooms: ${testProperty.building.rooms.beds}`);

    // Calculate score manually
    let score = 0;
    const salePrice = testProperty.sale.saleAmountData.saleAmt;
    const year = testProperty.summary.yearBuilt;
    const sqft = testProperty.building.size.livingSize;
    const beds = testProperty.building.rooms.beds;

    // Price match (30 points max)
    for (const range of (profile.priceRanges || [])) {
      if (salePrice >= range.min && salePrice <= range.max) {
        const points = 30 * (range.weight || 1.0);
        score += points;
        console.log(`\n✅ Price Match: $${salePrice.toLocaleString()} in ${range.label} tier → +${points.toFixed(1)} points`);
        break;
      }
    }

    // Distress indicators (40 points max)
    let distressScore = 0;
    if (testProperty.assessment.delinquentyear) {
      const weight = profile.distressIndicators?.taxDelinquent || 0;
      distressScore += weight * 10;
      console.log(`✅ Tax Delinquent → +${(weight * 10).toFixed(1)} points`);
    }
    if (testProperty.assessment.owner.absenteeOwnerStatus === 'A') {
      const weight = profile.distressIndicators?.absenteeOwner || 0;
      distressScore += weight * 10;
      console.log(`✅ Absentee Owner → +${(weight * 10).toFixed(1)} points`);
    }
    if (testProperty.assessment.owner.corporateIndicator === 'Y') {
      const weight = profile.distressIndicators?.absenteeOwner || 0;
      distressScore += weight * 10;
      console.log(`✅ Corporate Owned → +${(weight * 10).toFixed(1)} points`);
    }
    score += Math.min(distressScore, 40);

    // Property characteristics (20 points max)
    let charScore = 0;
    const minBeds = profile.preferredCharacteristics?.minBedrooms || 0;
    const maxBeds = profile.preferredCharacteristics?.maxBedrooms || 100;
    if (beds >= minBeds && beds <= maxBeds) {
      charScore += 5;
      console.log(`✅ Bedrooms (${beds}) in range → +5 points`);
    } else {
      console.log(`❌ Bedrooms (${beds}) NOT in range ${minBeds}-${maxBeds} → +0 points`);
    }

    const minSqft = profile.preferredCharacteristics?.minSquareFeet || 0;
    const maxSqft = profile.preferredCharacteristics?.maxSquareFeet || 100000;
    if (sqft >= minSqft && sqft <= maxSqft) {
      charScore += 5;
      console.log(`✅ Square Feet (${sqft}) in range → +5 points`);
    } else {
      console.log(`❌ Square Feet (${sqft}) NOT in range ${minSqft}-${maxSqft} → +0 points`);
    }

    const minYear = profile.preferredCharacteristics?.preferredYearBuilt?.min || 1800;
    const maxYear = profile.preferredCharacteristics?.preferredYearBuilt?.max || new Date().getFullYear();
    if (year >= minYear && year <= maxYear) {
      charScore += 5;
      console.log(`✅ Year Built (${year}) in range ${minYear}-${maxYear} → +5 points`);
    } else {
      console.log(`❌ Year Built (${year}) NOT in range ${minYear}-${maxYear} → +0 points`);
    }

    score += Math.min(charScore, 20);

    console.log('\n' + '='.repeat(60));
    console.log(`📊 TOTAL SCORE: ${Math.round(score)} points`);
    console.log(`   Threshold: ${jacksonville.minScore} points`);

    if (score >= jacksonville.minScore) {
      console.log(`   ✅ PASSES threshold!`);
    } else {
      console.log(`   ❌ FAILS threshold (needs ${jacksonville.minScore - score} more points)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('DIAGNOSIS SUMMARY');
    console.log('-'.repeat(60));

    if (isOldProfile) {
      console.log('❌ ROOT CAUSE: API is returning OLD profile from SQLite');
      console.log('\n   SOLUTION:');
      console.log('   1. Kill all Node.js processes');
      console.log('   2. Verify .env has PostgreSQL connection string');
      console.log('   3. Restart dev server: PORT=3007 npm run start');
    } else if (isNewProfile && score < jacksonville.minScore) {
      console.log('⚠️  Profile is correct, but property still doesn\'t meet threshold');
      console.log('\n   This suggests the n8n workflow scoring logic may be different');
      console.log('   from what we\'re testing here. We need to see the n8n node output.');
    } else if (isNewProfile && score >= jacksonville.minScore) {
      console.log('✅ Everything looks correct!');
      console.log('\n   Property should pass. If n8n workflow is still failing:');
      console.log('   1. Check n8n is fetching users from correct URL');
      console.log('   2. Verify n8n workflow code matches scoring algorithm');
      console.log('   3. Check ATTOM API is returning property data correctly');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

diagnoseWorkflow().catch(console.error);
