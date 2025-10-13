#!/bin/bash

echo "🚀 Testing Gate G2 - Bid Award (Spread Control)"
echo "==============================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL=${BASE_URL:-http://localhost:3000}

echo -e "${YELLOW}Testing against: $BASE_URL${NC}"
echo ""

# First, get some bid IDs from the database
echo -e "${BLUE}Note: You'll need to replace the bid IDs with actual IDs from your seed data${NC}"
echo -e "${BLUE}Run 'npm run prisma:seed' first to get the IDs printed in console${NC}"
echo ""

# Test 1: Award safe bid (should succeed - low spread)
echo "1. Testing SAFE bid award (spread <15%, should AWARD)..."
echo "   Replace SAFE_BID_ID with an actual ID from seed output"
curl -s -X POST $BASE_URL/api/bids/award \
  -H "Content-Type: application/json" \
  -d '{
    "dealId": "SAFE_DEAL_001",
    "winningBidId": "SAFE_BID_ID"
  }' | python -m json.tool

echo ""
echo "---"
echo ""

# Test 2: Award risky bid (should block - high spread)
echo "2. Testing RISKY bid award (spread >15%, should BLOCK)..."
echo "   Replace RISKY_BID_ID with an actual ID from seed output"
curl -s -X POST $BASE_URL/api/bids/award \
  -H "Content-Type: application/json" \
  -d '{
    "dealId": "RISKY_DEAL_001",
    "winningBidId": "RISKY_BID_ID"
  }' | python -m json.tool

echo ""
echo "---"
echo ""

# Test 3: Non-existent bid (should 404)
echo "3. Testing non-existent bid (should 404)..."
curl -s -X POST $BASE_URL/api/bids/award \
  -H "Content-Type: application/json" \
  -d '{
    "dealId": "SAFE_DEAL_001",
    "winningBidId": "NON_EXISTENT_BID"
  }' | python -m json.tool

echo ""
echo "---"
echo ""

# Test 4: Missing required field (should 422)
echo "4. Testing missing winningBidId (should fail with 422)..."
curl -s -X POST $BASE_URL/api/bids/award \
  -H "Content-Type: application/json" \
  -d '{
    "dealId": "SAFE_DEAL_001"
  }' | python -m json.tool

echo ""
echo -e "${GREEN}✅ Gate G2 tests complete!${NC}"
echo ""
echo -e "${YELLOW}Remember to check:${NC}"
echo "  - Safe bids award successfully with spread <15%"
echo "  - Risky bids are blocked with spread >15%"
echo "  - Unit normalization works (squares → sqft)"
echo "  - Budget ledger updates on award"
echo "  - Events are created for both AWARD and BLOCK"