-- Update Jacksonville test investor with realistic, research-backed criteria
-- Run this directly on your Supabase database

UPDATE users
SET
  "investorProfile" = '{
    "strategies": ["heavy_rehab", "quick_flip", "wholesale"],
    "priceRanges": [
      {
        "min": 10000,
        "max": 75000,
        "weight": 0.8,
        "label": "wholesale"
      },
      {
        "min": 75000,
        "max": 250000,
        "weight": 1.0,
        "label": "primary"
      },
      {
        "min": 250000,
        "max": 400000,
        "weight": 0.7,
        "label": "premium"
      }
    ],
    "equityRequirements": {
      "minEquityPercent": 20,
      "preferredEquityPercent": 30
    },
    "distressIndicators": {
      "foreclosure": 1.0,
      "preForeclosure": 0.95,
      "taxDelinquent": 0.9,
      "vacant": 0.9,
      "absenteeOwner": 0.75,
      "bankruptcy": 0.7
    },
    "preferredCharacteristics": {
      "minBedrooms": 1,
      "maxBedrooms": 5,
      "minBathrooms": 1,
      "maxBathrooms": 4,
      "minSquareFeet": 500,
      "maxSquareFeet": 3500,
      "preferredYearBuilt": {
        "min": 1900,
        "max": 2025,
        "sweetSpot": {
          "min": 1950,
          "max": 1990,
          "bonus": 3
        }
      }
    },
    "preferredCondition": {
      "distressed": true,
      "turnkey": false,
      "minRepairNeeds": 10000,
      "maxRepairNeeds": 100000
    },
    "partnerPreferences": {
      "hasRealtorPartner": true,
      "hasContractorNetwork": true,
      "prefersMLS": false,
      "canCloseQuickly": true
    },
    "dealBreakers": {
      "noCondos": false,
      "noMobileHomes": true,
      "noCommercial": true,
      "noCoops": true,
      "maxHOAFees": 250
    },
    "timeHorizon": "short_term",
    "riskTolerance": "moderate_to_high",
    "leadPreferences": {
      "dailyMaxLeads": 25,
      "minMatchScore": 50,
      "topLeadsPerDay": 10
    },
    "targetZipCodes": [
      "32202", "32204", "32205", "32206", "32207",
      "32208", "32209", "32210", "32211", "32216",
      "32217", "32218", "32219", "32220", "32221",
      "32801", "32803", "32804", "32805", "32806"
    ]
  }'::jsonb,
  "minScore" = 50
WHERE id = 'test-investor-jacksonville';

-- Verify the update
SELECT
  id,
  name,
  email,
  "minScore",
  "investorProfile"->>'strategies' as strategies,
  jsonb_array_length("investorProfile"->'targetZipCodes') as zip_count,
  ("investorProfile"->'preferredCharacteristics'->'preferredYearBuilt'->>'min')::int as min_year,
  ("investorProfile"->'preferredCharacteristics'->'preferredYearBuilt'->>'max')::int as max_year,
  ("investorProfile"->'preferredCharacteristics'->>'minSquareFeet')::int as min_sqft
FROM users
WHERE id = 'test-investor-jacksonville';
