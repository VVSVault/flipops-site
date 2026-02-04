# CoreLogic vs ATTOM: Data Provider Comparison for FlipOps

**Date:** November 19, 2025
**Purpose:** Determine if CoreLogic should be added to FlipOps alongside ATTOM

---

## 📊 Quick Comparison

| Feature | ATTOM | CoreLogic (Cotality) |
|---------|-------|----------------------|
| **Coverage** | 158M+ properties (99% of US) | 155M+ properties |
| **Focus** | PropTech, investors, developers | Lenders, insurers, financial institutions |
| **Data Depth** | Very deep (20-step validation) | Enterprise-grade (mortgage/risk focused) |
| **API Accessibility** | ✅ Developer-friendly | ⚠️ Enterprise-focused |
| **Pricing** | ~$500-1k/month (trial available) | Custom quotes ($2-11/call for some APIs) |
| **Ideal For** | Real estate investors, PropTech | Banks, lenders, insurance companies |
| **Trial** | ✅ 30 days free | ❌ Contact sales |

---

## 🎯 ATTOM Data Solutions (Currently Using)

### What It Is
**Market Position:** The PropTech standard for comprehensive property data
**Coverage:** 158M+ residential & commercial properties across US
**Validation:** 20-step standardization with automated + human quality checks

### Strengths for FlipOps
1. **Investor-Focused Data**
   - Foreclosure records (pre-foreclosure, auction, REO stages)
   - Property characteristics (beds, baths, sqft, year built)
   - Transaction history (sales dates, prices)
   - Tax assessments and delinquency
   - Owner information (absentee owner detection)
   - Market trends and neighborhood data

2. **API-First Design**
   - Developer-friendly REST APIs
   - On-demand queries (no bulk requirements)
   - Flexible filtering capabilities
   - Real-time data access

3. **Cost-Effective**
   - **30-day free trial** (already activated)
   - Predictable monthly pricing (~$500-1k)
   - No per-call fees for standard API
   - Scales with business

4. **Property Discovery Features**
   - Sales Snapshot endpoint (perfect for lead generation)
   - Property Detail endpoint (enrichment)
   - Expanded Profile (deep dive data)
   - Neighborhood/school/environmental overlays

### Perfect For
- ✅ Real estate investors sourcing deals
- ✅ PropTech startups needing flexible APIs
- ✅ Deal analysis and underwriting
- ✅ Property lead generation
- ✅ Market analysis and trends

### Current FlipOps Usage
```
ATTOM Sales Snapshot API
    ↓
Filter by investor criteria (foreclosure, price, equity)
    ↓
Transform to FlipOps format
    ↓
Score properties (0-100)
    ↓
Send daily digest to investors
```

---

## 🏦 CoreLogic / Cotality (Evaluation)

### What It Is
**Market Position:** The financial industry standard for property data
**Coverage:** 155M+ properties with half-century legacy
**Focus:** Mortgage underwriting, risk assessment, insurance

### Strengths
1. **Financial-Grade Accuracy**
   - Used by banks for underwriting decisions
   - Rigorous compliance standards
   - Unmatched data integrity for lenders

2. **Risk Assessment Tools**
   - Automated Valuation Models (AVMs)
   - Mortgage performance tracking
   - Default risk analysis
   - Flood/hazard risk data

3. **Institutional Trust**
   - Government agency approved
   - Lender/insurer standard
   - Regulatory compliance built-in

### Limitations for FlipOps
1. **Enterprise Pricing**
   - Per-call fees: $2.30-$11.50 per API call
   - No transparent monthly pricing
   - Custom quotes required (typically $$$)
   - Trestle connection: $100/month + per-call fees

2. **Lender-Centric Design**
   - Optimized for mortgage workflows
   - Less focused on property discovery
   - More focused on risk/valuation
   - Not designed for investor lead generation

3. **Higher Barrier to Entry**
   - No free trial
   - Sales process required
   - Enterprise contracts
   - Complex integration

### Best Use Cases
- Banks doing mortgage underwriting
- Insurance companies assessing risk
- Government agencies needing compliance
- Large institutional investors (REITs, hedge funds)

---

## 💡 Analysis: Do We Need CoreLogic?

### Current FlipOps Needs

| Need | ATTOM | CoreLogic | Winner |
|------|-------|-----------|--------|
| **Property Discovery** | ✅ Sales Snapshot API | ❌ Not designed for this | ATTOM |
| **Foreclosure Data** | ✅ Included | ✅ Included | TIE |
| **Owner Information** | ✅ Included | ✅ Included | TIE |
| **Transaction History** | ✅ Included | ✅ Included | TIE |
| **Flexible Filtering** | ✅ Query by ZIP, price, type | ⚠️ Less flexible | ATTOM |
| **Cost for Startups** | ✅ $500-1k/month | ❌ $$$ custom quote | ATTOM |
| **API Accessibility** | ✅ Developer-friendly | ⚠️ Enterprise-focused | ATTOM |
| **AVMs (Valuations)** | ⚠️ Basic | ✅ Best in class | CoreLogic |
| **Lead Generation** | ✅ Perfect for this | ❌ Not designed for this | ATTOM |

### Cost Comparison Example

**Scenario:** 10 investors, each getting 50 properties/day = 500 properties/day = 15,000/month

#### ATTOM
```
Monthly subscription: $500-1,000
Per-property cost: $0
Total: $500-1,000/month
```

#### CoreLogic (estimated based on per-call pricing)
```
Monthly connection: $100
API calls per property: ~3-5 calls (property detail, valuation, risk)
Per-property cost: $6-23 (at $2-11/call)
Total for 15k properties: $90,000-$345,000/month 🚨
```

**Winner:** ATTOM by orders of magnitude

---

## 🤔 When Would CoreLogic Make Sense?

### Potential Future Use Cases

1. **Advanced Valuations (Phase 2)**
   - Once we have deal analysis built
   - Need best-in-class AVMs for ARV estimation
   - Can justify per-call costs for high-value deals
   - **When:** After 20+ paying customers

2. **Institutional Clients (Phase 3)**
   - Hedge funds or REITs as customers
   - They require CoreLogic-grade data for compliance
   - Can pass through costs to enterprise tier customers
   - **When:** Enterprise tier launched ($2.5k+/month)

3. **Lending Features (Future)**
   - If we build financing/lending into platform
   - Need mortgage performance data
   - Risk assessment for lender partners
   - **When:** Series A funding + lending partnerships

### Not Needed For MVP Because:
- ✅ ATTOM provides all data needed for property discovery
- ✅ ATTOM has foreclosure data
- ✅ ATTOM has transaction history
- ✅ ATTOM pricing scales with startup budget
- ✅ ATTOM has 30-day trial (already activated)
- ✅ No investor has requested CoreLogic-specific data

---

## ✅ Recommendation: Stick with ATTOM for Now

### Why ATTOM Is Perfect for MVP

**1. Solves the Core Problem**
Your investor's complaint: *"RedBarn leads were lackluster and didn't match what I look for"*

ATTOM provides:
- ✅ Foreclosure/distress data (for heavy rehab deals)
- ✅ Recent sales data (for quick flip opportunities)
- ✅ Owner information (for absentee owner targeting)
- ✅ Property details (for filtering by investor criteria)

**2. Cost-Effective Validation**
- Free trial = prove value before spending
- $500-1k/month = profitable at 2-3 customers
- CoreLogic = would need 200+ customers to justify cost

**3. API-First Design**
- Easy integration (already working!)
- Flexible filtering for personalization
- Real-time on-demand queries

**4. Room to Grow**
- Can layer in CoreLogic later for AVMs
- Can add BatchData for contact info (already have)
- Can add other sources as needed

---

## 📋 Data Stack Recommendation

### Current (MVP - Months 1-6)
```
Primary: ATTOM ($500-1k/month)
  ↓ Property discovery, foreclosure data, transaction history

Secondary: BatchData ($0.20/property)
  ↓ Skip tracing, owner contact info (only for scored properties)

Tertiary: Zillow/Redfin scraping (free)
  ↓ MLS listings for quick flip opportunities
```

**Total Cost:** ~$520-1,020/month
**Break-even:** 2-3 customers @ $500/month

### Future (Growth - Months 7-12)
```
Primary: ATTOM
  ↓ Continue for discovery

Add: CoreLogic AVMs (per-call)
  ↓ Only for high-value deals >$500k
  ↓ Better ARV estimation

Continue: BatchData
  ↓ Skip tracing

Add: Propstream or REIRail
  ↓ Additional deal sourcing
```

### Enterprise (Year 2+)
```
Multi-source strategy:
- ATTOM for discovery
- CoreLogic for institutional clients
- BatchData for contact enrichment
- MLS feeds for realtor partner integration
- Custom data sources per client need
```

---

## 🎯 Action Plan

### Immediate (This Week)
1. ✅ Continue with ATTOM (30-day trial active)
2. ✅ Build ATTOM Property Discovery workflow
3. ✅ Test with Jacksonville/Orlando/Tampa markets
4. ✅ Validate data quality with your test investor

### Short-Term (Months 1-3)
1. Monitor ATTOM data quality
2. Track investor feedback on lead quality
3. Measure conversion rate (leads → deals)
4. Calculate ROI per lead source

### Long-Term (Months 6-12)
1. Re-evaluate CoreLogic if:
   - We have 20+ customers (can justify cost)
   - Investors request better AVMs
   - We add lending features
   - Enterprise clients require it

2. Consider other data sources:
   - Propstream (wholesaler-focused)
   - REIRail (aggregator)
   - Local county records (free, but slow)

---

## 💰 Cost Analysis

### ATTOM-Only Stack (Recommended for MVP)

**Monthly Costs:**
- ATTOM API: $500-1,000
- BatchData: ~$100 (500 properties @ $0.20)
- n8n (Railway): $20
- Hosting (Vercel): $0 (free tier)
**Total: $620-1,120/month**

**Break-even: 2-3 customers @ $500/month**

### With CoreLogic (Not Recommended Yet)

**Monthly Costs:**
- ATTOM API: $500-1,000
- CoreLogic: $100 base + ($6-23 per property × 15k) = $90k-345k
- BatchData: $100
- Infrastructure: $20
**Total: ~$91,000-$346,000/month** 🚨

**Break-even: 182-692 customers @ $500/month**

---

## 📊 Decision Matrix

| Factor | Weight | ATTOM Score | CoreLogic Score |
|--------|--------|-------------|-----------------|
| Data for investor leads | 40% | 10/10 | 6/10 |
| Cost for startup | 30% | 10/10 | 2/10 |
| API accessibility | 15% | 10/10 | 6/10 |
| Foreclosure data | 10% | 10/10 | 10/10 |
| Valuation accuracy | 5% | 7/10 | 10/10 |
| **Weighted Total** | **100%** | **9.45/10** | **5.35/10** |

**Winner:** ATTOM (by a significant margin)

---

## 🎓 Key Takeaway

**CoreLogic is the Ferrari of property data - extremely powerful, but:**
- You're building a Formula 1 car when you need a reliable Toyota
- It's designed for banks doing millions in loans
- FlipOps needs lead generation, not mortgage underwriting

**ATTOM is the perfect fit because:**
- ✅ Designed for exactly what you're building
- ✅ Cost-effective for startups
- ✅ Already has foreclosure/distress data
- ✅ API-first for flexibility
- ✅ 30-day trial = prove it works first

**Bottom Line:** Use ATTOM now, consider CoreLogic when you're doing $1M+/month in revenue and have institutional clients demanding it.

---

## 🚀 Next Steps

1. **Today:** Continue building ATTOM Property Discovery workflow
2. **This Week:** Test with Jacksonville investor's criteria
3. **Month 1-3:** Monitor lead quality, gather investor feedback
4. **Month 6:** Re-evaluate if need for CoreLogic emerges

**Status:** ATTOM is the right choice for MVP ✅
**CoreLogic:** Revisit in 6-12 months or at 20+ customers
