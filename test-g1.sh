#!/bin/bash

echo "🚀 Testing Gate G1 - Deal Approval"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL=${BASE_URL:-http://localhost:3000}

echo -e "${YELLOW}Testing against: $BASE_URL${NC}"
echo ""

# Test 1: Risky deal should BLOCK
echo "1. Testing RISKY deal (should BLOCK)..."
curl -s -X POST $BASE_URL/api/deals/approve \
  -H "Content-Type: application/json" \
  -d '{
    "dealId": "RISKY_DEAL_001",
    "region": "Miami",
    "grade": "Standard"
  }' | python -m json.tool

echo ""
echo "---"
echo ""

# Test 2: Safe deal should APPROVE
echo "2. Testing SAFE deal (should APPROVE)..."
curl -s -X POST $BASE_URL/api/deals/approve \
  -H "Content-Type: application/json" \
  -d '{
    "dealId": "SAFE_DEAL_001",
    "region": "Miami",
    "grade": "Standard"
  }' | python -m json.tool

echo ""
echo "---"
echo ""

# Test 3: Invalid grade should fail validation
echo "3. Testing invalid grade (should fail with 422)..."
curl -s -X POST $BASE_URL/api/deals/approve \
  -H "Content-Type: application/json" \
  -d '{
    "dealId": "SAFE_DEAL_001",
    "region": "Miami",
    "grade": "InvalidGrade"
  }' | python -m json.tool

echo ""
echo "---"
echo ""

# Test 4: Non-existent deal should 404
echo "4. Testing non-existent deal (should 404)..."
curl -s -X POST $BASE_URL/api/deals/approve \
  -H "Content-Type: application/json" \
  -d '{
    "dealId": "NON_EXISTENT",
    "region": "Miami",
    "grade": "Standard"
  }' | python -m json.tool

echo ""
echo -e "${GREEN}✅ Gate G1 tests complete!${NC}"