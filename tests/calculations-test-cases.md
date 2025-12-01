# Financial Calculations Test Cases

**Created:** November 30, 2025
**Purpose:** Verify accuracy of all financial calculations in FlipOps
**Status:** Ready for testing

---

## Test Case 1: Wholesaler Assignment Revenue

### Scenario
A wholesaler locks up a property under contract and assigns it to an end buyer for an assignment fee.

### Input Data
- **Property Address:** 123 Test St, Austin, TX 78701
- **Purchase Price (Contract):** $150,000
- **Assignment Fee:** $10,000
- **Buyer:** Test Buyer LLC
- **Assignment Status:** Completed
- **Payment Status:** Paid

### Expected Calculations

**Total Revenue (Single Assignment):**
```
Revenue = Assignment Fee = $10,000
```

**Average Assignment Fee (Multiple Deals):**
```
Avg Assignment Fee = Sum(All Completed & Paid Assignment Fees) / Count(Completed & Paid Assignments)

Example with 3 deals:
- Deal 1: $10,000
- Deal 2: $8,000
- Deal 3: $12,000
Avg = ($10,000 + $8,000 + $12,000) / 3 = $10,000
```

### Verification Steps
1. Create wholesaler account
2. Create property lead
3. Create offer for $150,000
4. Convert offer to contract
5. Add buyer "Test Buyer LLC"
6. Assign contract to buyer with $10,000 fee
7. Mark assignment as "completed" and "paid"
8. Navigate to dashboard
9. Verify "Total Revenue" shows $10,000
10. Verify assignment appears in "Active Assignments" (if in progress) or "Completed" (if done)

### Code Location
`app/api/dashboard/investor-stats/route.ts` lines 85-103

### Edge Cases to Test
- ✅ What if assignment fee = $0? (Should still count as assignment)
- ✅ What if assignment is completed but not paid? (Should NOT count in revenue)
- ✅ What if assignment is cancelled? (Should NOT count)
- ✅ What if there are zero assignments? (Should show $0, not error)

---

## Test Case 2: Flipper Renovation ROI

### Scenario
An investor purchases a distressed property, renovates it, and sells it for a profit.

### Input Data
- **Property Address:** 456 Flip Ave, Dallas, TX 75201
- **Purchase Price:** $200,000
- **Rehab Budget:** $50,000
- **ARV (After Repair Value):** $325,000
- **Actual Rehab Spent:** $48,000 (not used in ROI calc, but tracked)
- **Status:** Completed

### Expected Calculations

**ROI Formula:**
```
Total Investment = Purchase Price + Rehab Budget
Profit = ARV - Total Investment
ROI % = (Profit / Total Investment) × 100

Calculation:
Total Investment = $200,000 + $50,000 = $250,000
Profit = $325,000 - $250,000 = $75,000
ROI % = ($75,000 / $250,000) × 100 = 30%
```

**Breakdown:**
- **Total Investment:** $250,000
- **ARV:** $325,000
- **Gross Profit:** $75,000
- **ROI:** 30%

### Verification Steps
1. Create flipper account
2. Create property lead
3. Create offer for $200,000
4. Convert offer to contract
5. Start renovation from contract
6. Set ARV to $325,000
7. Set Rehab Budget to $50,000
8. Mark renovation as "completed"
9. Navigate to dashboard
10. Verify "Avg ROI" shows 30.0%
11. If multiple projects exist, verify it's the average of all completed project ROIs

### Code Location
`app/api/dashboard/investor-stats/route.ts` lines 144-174

### Edge Cases to Test
- ✅ What if Purchase Price = 0? (Division by zero - should handle gracefully)
- ✅ What if Rehab Budget = 0? (Valid case - cosmetic flip)
- ✅ What if ARV < Total Investment? (Negative ROI - should display correctly, e.g., -10%)
- ✅ What if ARV is null/missing? (Should skip this project from average)
- ✅ What if there are zero completed projects? (Should show 0.0% or "N/A")

### ROI Calculation Validation
**Formula Verification:**
```typescript
// From code (lines 168-169):
const totalCost = purchase + rehab;
const roi = totalCost > 0 ? ((arv - totalCost) / totalCost) * 100 : 0;

// Manual check:
totalCost = 200000 + 50000 = 250000
roi = ((325000 - 250000) / 250000) * 100
roi = (75000 / 250000) * 100
roi = 0.3 * 100
roi = 30 ✅ CORRECT
```

---

## Test Case 3: Buy-and-Hold Rental Cash Flow & Cap Rate

### Scenario
A buy-and-hold investor purchases a rental property and leases it to a tenant.

### Input Data
- **Property Address:** 789 Rental Rd, Houston, TX 77001
- **Purchase Price:** $250,000
- **Monthly Rent:** $2,000
- **Monthly Expenses:**
  - Mortgage Payment: $1,200
  - Property Tax: $200
  - Insurance: $100
  - HOA: $0
  - Utilities: $0
  - Maintenance Reserve: $100
- **Lease Status:** Leased
- **Occupancy:** 100%

### Expected Calculations

#### 1. Monthly Cash Flow
```
Monthly Cash Flow = Monthly Rent - All Monthly Expenses

Expenses:
- Mortgage: $1,200
- Property Tax: $200
- Insurance: $100
- HOA: $0
- Utilities: $0
- Maintenance: $100
Total Monthly Expenses = $1,600

Cash Flow = $2,000 - $1,600 = $400/month
```

#### 2. Cap Rate (Capitalization Rate)
```
Annual Rent = Monthly Rent × 12 = $2,000 × 12 = $24,000

Annual Operating Expenses (excludes mortgage):
- Property Tax: $200 × 12 = $2,400
- Insurance: $100 × 12 = $1,200
- HOA: $0
- Utilities: $0
- Maintenance: $100 × 12 = $1,200
Total Annual OpEx = $4,800

NOI (Net Operating Income) = Annual Rent - Annual OpEx
NOI = $24,000 - $4,800 = $19,200

Cap Rate = (NOI / Purchase Price) × 100
Cap Rate = ($19,200 / $250,000) × 100 = 7.68%
```

**IMPORTANT:** Cap rate does NOT include mortgage. Cash flow DOES include mortgage.

#### 3. Occupancy Rate
```
Occupancy Rate = (Leased Properties / Total Properties) × 100

With 1 leased property:
Occupancy = (1 / 1) × 100 = 100%

With 3 properties (2 leased, 1 vacant):
Occupancy = (2 / 3) × 100 = 66.67% or 67%
```

### Verification Steps
1. Create buy-and-hold investor account
2. Create property lead
3. Create offer for $250,000
4. Convert offer to contract
5. Start rental from contract
6. Set monthly rent to $2,000
7. Set expenses:
   - Mortgage: $1,200/mo
   - Property Tax: $200/mo
   - Insurance: $100/mo
   - Maintenance: $100/mo
8. Add tenant and mark lease as active
9. Navigate to dashboard
10. Verify "Monthly Cash Flow" shows $400
11. Verify "Avg Cap Rate" shows 7.7% (or 7.68% if more precision)
12. Verify "Occupancy Rate" shows 100%

### Code Location
- **Cash Flow:** `app/api/dashboard/investor-stats/route.ts` lines 229-239
- **Cap Rate:** `app/api/dashboard/investor-stats/route.ts` lines 242-259
- **Occupancy Rate:** `app/api/dashboard/investor-stats/route.ts` lines 265-269

### Edge Cases to Test
- ✅ What if Monthly Rent < Monthly Expenses? (Negative cash flow - should display in red)
- ✅ What if Purchase Price = 0? (Division by zero - should skip from cap rate avg)
- ✅ What if there are no expenses? (Valid case - fully paid off property)
- ✅ What if all properties are vacant? (Occupancy = 0%)
- ✅ What if expense fields are null? (Should default to 0, as per code line 249-253)

### Cap Rate Calculation Validation
```typescript
// From code (lines 246-258):
const annualIncome = r.monthlyRent * 12;
const annualExpenses = (
  ((r.propertyTax || 0) * 12) +
  ((r.insurance || 0) * 12) +
  ((r.hoa || 0) * 12) +
  ((r.utilities || 0) * 12) +
  ((r.maintenance || 0) * 12)
); // Note: Mortgage excluded ✅ CORRECT
const noi = annualIncome - annualExpenses;
return (noi / r.purchasePrice!) * 100;

// Manual check:
annualIncome = 2000 * 12 = 24000
annualExpenses = (200*12) + (100*12) + 0 + 0 + (100*12)
               = 2400 + 1200 + 0 + 0 + 1200
               = 4800
noi = 24000 - 4800 = 19200
capRate = (19200 / 250000) * 100 = 7.68 ✅ CORRECT
```

### Cash Flow Calculation Validation
```typescript
// From code (lines 229-239):
const expenses =
  (rental.mortgagePayment || 0) +
  (rental.propertyTax || 0) +
  (rental.insurance || 0) +
  (rental.hoa || 0) +
  (rental.utilities || 0) +
  (rental.maintenance || 0);
return sum + (rental.monthlyRent - expenses);

// Manual check:
expenses = 1200 + 200 + 100 + 0 + 0 + 100 = 1600
cashFlow = 2000 - 1600 = 400 ✅ CORRECT
```

---

## Additional Test Scenarios

### Scenario 4: Mixed Portfolio (Hybrid Investor)
A hybrid investor with all three strategies should see all stats.

**Test Data:**
- 1 wholesale assignment: $10,000 fee
- 2 flips: 30% ROI and 25% ROI (avg = 27.5%)
- 3 rentals: 2 leased, 1 vacant (occupancy = 67%)

**Expected Dashboard:**
- Wholesaler stats: $10,000 revenue, 1 completed
- Flipper stats: 27.5% avg ROI, 2 completed
- Rental stats: 67% occupancy, cash flow varies

### Scenario 5: Zero-State (New User)
A brand new investor with no data.

**Expected Behavior:**
- All stats show 0 (not errors or "NaN")
- Dashboard shows empty states with helpful CTAs
- No division-by-zero errors

---

## Testing Checklist

### Wholesaler Path ✅
- [ ] Create account as wholesaler
- [ ] Add property lead
- [ ] Create offer and contract
- [ ] Add buyer
- [ ] Create assignment with $10,000 fee
- [ ] Mark as completed and paid
- [ ] Screenshot dashboard showing $10,000 revenue
- [ ] Verify calculation matches expected value

### Flipper Path ✅
- [ ] Create account as flipper
- [ ] Add property lead
- [ ] Create offer for $200k
- [ ] Convert to contract
- [ ] Start renovation
- [ ] Set ARV to $325k, budget to $50k
- [ ] Mark as completed
- [ ] Screenshot dashboard showing 30% ROI
- [ ] Verify calculation matches expected value

### Buy-and-Hold Path ✅
- [ ] Create account as buy-and-hold
- [ ] Add property lead
- [ ] Create offer for $250k
- [ ] Convert to contract
- [ ] Start rental
- [ ] Set rent to $2,000/mo
- [ ] Set all expenses as specified
- [ ] Add tenant and activate lease
- [ ] Screenshot dashboard showing:
  - [ ] $400 monthly cash flow
  - [ ] 7.68% cap rate
  - [ ] 100% occupancy
- [ ] Verify all calculations match expected values

### Edge Case Testing ✅
- [ ] Test negative ROI (ARV < investment)
- [ ] Test negative cash flow (rent < expenses)
- [ ] Test division by zero scenarios
- [ ] Test null/missing field handling
- [ ] Test zero-state (no data)

---

## Sign-Off

### Developer Testing
- **Tested By:** _________________
- **Date:** _________________
- **All Test Cases Pass:** ☐ Yes ☐ No
- **Screenshots Saved:** ☐ Yes ☐ No
- **Issues Found:** _________________

### Investor Validation
- **Validated By:** _________________ (Name of experienced investor)
- **Date:** _________________
- **Formulas Accurate:** ☐ Yes ☐ No
- **Feedback:** _________________
- **Additional Edge Cases:** _________________

---

## Notes & Findings

*(Record any discrepancies, bugs, or areas for improvement discovered during testing)*

---

**Document Version:** 1.0
**Last Updated:** November 30, 2025
**Next Review:** After beta user feedback
