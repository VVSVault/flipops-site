-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "clerkId" TEXT,
    "name" TEXT,
    "companyName" TEXT,
    "targetMarkets" TEXT NOT NULL,
    "propertyTypes" TEXT,
    "minScore" INTEGER NOT NULL DEFAULT 70,
    "maxBudget" DOUBLE PRECISION,
    "investorProfile" TEXT,
    "investorType" TEXT,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "slackWebhook" TEXT,
    "emailAlerts" BOOLEAN NOT NULL DEFAULT true,
    "dailyDigest" BOOLEAN NOT NULL DEFAULT true,
    "digestTime" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "tier" TEXT NOT NULL DEFAULT 'pro',
    "monthlyDeals" INTEGER NOT NULL DEFAULT 0,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "onboardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealSpec" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT,
    "contractId" TEXT,
    "address" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "maxExposureUsd" DOUBLE PRECISION NOT NULL,
    "targetRoiPct" DOUBLE PRECISION NOT NULL,
    "arv" DOUBLE PRECISION,
    "region" TEXT DEFAULT 'Miami',
    "grade" TEXT DEFAULT 'Standard',
    "status" TEXT NOT NULL DEFAULT 'planning',
    "startAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "dailyBurnUsd" DOUBLE PRECISION DEFAULT 0,
    "constraints" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScopeTreeNode" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "trade" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "quantity" JSONB NOT NULL,
    "finishLvl" TEXT,
    "assumptions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScopeTreeNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostModel" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "trade" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "material" DOUBLE PRECISION NOT NULL,
    "labor" DOUBLE PRECISION NOT NULL,
    "contingencyPct" DOUBLE PRECISION NOT NULL,
    "riskPremiumPct" DOUBLE PRECISION NOT NULL,
    "source" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLedger" (
    "dealId" TEXT NOT NULL,
    "baseline" TEXT NOT NULL,
    "committed" TEXT NOT NULL,
    "actuals" TEXT NOT NULL,
    "variance" TEXT NOT NULL,
    "contingencyRemaining" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetLedger_pkey" PRIMARY KEY ("dealId")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "includes" JSONB NOT NULL,
    "excludes" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "normalized" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeOrder" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "trade" TEXT NOT NULL,
    "deltaUsd" DOUBLE PRECISION NOT NULL,
    "impactDays" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "rationale" TEXT,
    "simResults" JSONB,
    "decidedAt" TIMESTAMP(3),
    "decidedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChangeOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "dealId" TEXT,
    "actor" TEXT NOT NULL,
    "artifact" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "diff" TEXT,
    "checksum" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "trade" TEXT NOT NULL,
    "region" TEXT,
    "onTimePct" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "onBudgetPct" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "reliability" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "vendorId" TEXT,
    "trade" TEXT NOT NULL,
    "lineItemId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "docUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "region" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "maxExposureUsd" DOUBLE PRECISION NOT NULL,
    "targetRoiPct" DOUBLE PRECISION NOT NULL,
    "contingencyTargetPct" DOUBLE PRECISION NOT NULL,
    "varianceTier1Pct" DOUBLE PRECISION NOT NULL,
    "varianceTier2Pct" DOUBLE PRECISION NOT NULL,
    "bidSpreadMaxPct" DOUBLE PRECISION NOT NULL,
    "coSlaHours" INTEGER NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "county" TEXT,
    "apn" TEXT,
    "ownerName" TEXT,
    "propertyType" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "squareFeet" INTEGER,
    "lotSize" INTEGER,
    "yearBuilt" INTEGER,
    "assessedValue" DOUBLE PRECISION,
    "taxAmount" DOUBLE PRECISION,
    "lastSaleDate" TEXT,
    "lastSalePrice" DOUBLE PRECISION,
    "estimatedValue" DOUBLE PRECISION,
    "score" INTEGER,
    "scoreBreakdown" TEXT,
    "scoredAt" TIMESTAMP(3),
    "potentialProfit" DOUBLE PRECISION,
    "foreclosure" BOOLEAN NOT NULL DEFAULT false,
    "preForeclosure" BOOLEAN NOT NULL DEFAULT false,
    "taxDelinquent" BOOLEAN NOT NULL DEFAULT false,
    "vacant" BOOLEAN NOT NULL DEFAULT false,
    "bankruptcy" BOOLEAN NOT NULL DEFAULT false,
    "absenteeOwner" BOOLEAN NOT NULL DEFAULT false,
    "phoneNumbers" TEXT,
    "emails" TEXT,
    "outreachStatus" TEXT DEFAULT 'not_contacted',
    "lastContactDate" TIMESTAMP(3),
    "lastContactMethod" TEXT,
    "contactNotes" TEXT,
    "ownerResponse" TEXT,
    "nextFollowUpDate" TIMESTAMP(3),
    "sentiment" TEXT,
    "offerAmount" DOUBLE PRECISION,
    "offerDate" TIMESTAMP(3),
    "offerStatus" TEXT,
    "dataSource" TEXT NOT NULL,
    "sourceId" TEXT,
    "enriched" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT,
    "dealId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "arv" DOUBLE PRECISION NOT NULL,
    "arvMethod" TEXT NOT NULL,
    "compsUsed" TEXT,
    "repairTotal" DOUBLE PRECISION NOT NULL,
    "repairItems" TEXT,
    "maxOffer" DOUBLE PRECISION NOT NULL,
    "rule" TEXT NOT NULL DEFAULT '70%',
    "offerAmount" DOUBLE PRECISION,
    "purchasePrice" DOUBLE PRECISION,
    "closingCosts" DOUBLE PRECISION,
    "holdingCosts" DOUBLE PRECISION,
    "holdingMonths" INTEGER,
    "sellingCosts" DOUBLE PRECISION,
    "projectedProfit" DOUBLE PRECISION,
    "roi" DOUBLE PRECISION,
    "name" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "analysisId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "terms" TEXT,
    "contingencies" TEXT,
    "closingDate" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "earnestMoney" DOUBLE PRECISION,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "responseAt" TIMESTAMP(3),
    "responseNotes" TEXT,
    "counterAmount" DOUBLE PRECISION,
    "counterTerms" TEXT,
    "counterDate" TIMESTAMP(3),
    "documentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "signedAt" TIMESTAMP(3),
    "escrowOpenedAt" TIMESTAMP(3),
    "closingDate" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "documentUrls" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Buyer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "propertyTypes" TEXT,
    "minPrice" DOUBLE PRECISION,
    "maxPrice" DOUBLE PRECISION,
    "targetMarkets" TEXT,
    "cashBuyer" BOOLEAN NOT NULL DEFAULT false,
    "dealsClosed" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reliability" TEXT NOT NULL DEFAULT 'unknown',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Buyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractAssignment" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "assignmentFee" DOUBLE PRECISION NOT NULL,
    "assignmentDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "feeReceived" BOOLEAN NOT NULL DEFAULT false,
    "feeReceivedDate" TIMESTAMP(3),
    "documentUrls" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rental" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "contractId" TEXT,
    "address" TEXT NOT NULL,
    "monthlyRent" DOUBLE PRECISION NOT NULL,
    "deposit" DOUBLE PRECISION,
    "leaseStart" TIMESTAMP(3),
    "leaseEnd" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'vacant',
    "purchasePrice" DOUBLE PRECISION,
    "mortgagePayment" DOUBLE PRECISION,
    "propertyTax" DOUBLE PRECISION,
    "insurance" DOUBLE PRECISION,
    "hoa" DOUBLE PRECISION,
    "utilities" DOUBLE PRECISION,
    "maintenance" DOUBLE PRECISION,
    "totalIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "occupancyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rental_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "emergencyContact" TEXT,
    "leaseStart" TIMESTAMP(3) NOT NULL,
    "leaseEnd" TIMESTAMP(3) NOT NULL,
    "monthlyRent" DOUBLE PRECISION NOT NULL,
    "deposit" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'active',
    "moveInDate" TIMESTAMP(3),
    "moveOutDate" TIMESTAMP(3),
    "moveOutReason" TEXT,
    "paymentMethod" TEXT,
    "autoPay" BOOLEAN NOT NULL DEFAULT false,
    "latePayments" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalIncome" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'rent',
    "description" TEXT,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "referenceNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalIncome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalExpense" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "referenceNumber" TEXT,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dealId" TEXT,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "n8nExecId" TEXT,
    "n8nWorkflow" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "User_tier_idx" ON "User"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "DealSpec_contractId_key" ON "DealSpec"("contractId");

-- CreateIndex
CREATE INDEX "DealSpec_userId_idx" ON "DealSpec"("userId");

-- CreateIndex
CREATE INDEX "DealSpec_propertyId_idx" ON "DealSpec"("propertyId");

-- CreateIndex
CREATE INDEX "DealSpec_contractId_idx" ON "DealSpec"("contractId");

-- CreateIndex
CREATE INDEX "DealSpec_address_idx" ON "DealSpec"("address");

-- CreateIndex
CREATE INDEX "DealSpec_status_idx" ON "DealSpec"("status");

-- CreateIndex
CREATE INDEX "DealSpec_createdAt_idx" ON "DealSpec"("createdAt");

-- CreateIndex
CREATE INDEX "ScopeTreeNode_dealId_idx" ON "ScopeTreeNode"("dealId");

-- CreateIndex
CREATE INDEX "ScopeTreeNode_trade_idx" ON "ScopeTreeNode"("trade");

-- CreateIndex
CREATE UNIQUE INDEX "ScopeTreeNode_dealId_trade_task_key" ON "ScopeTreeNode"("dealId", "trade", "task");

-- CreateIndex
CREATE INDEX "CostModel_region_grade_idx" ON "CostModel"("region", "grade");

-- CreateIndex
CREATE INDEX "CostModel_trade_task_idx" ON "CostModel"("trade", "task");

-- CreateIndex
CREATE UNIQUE INDEX "CostModel_region_grade_trade_task_unit_key" ON "CostModel"("region", "grade", "trade", "task", "unit");

-- CreateIndex
CREATE INDEX "Bid_dealId_idx" ON "Bid"("dealId");

-- CreateIndex
CREATE INDEX "Bid_vendorId_idx" ON "Bid"("vendorId");

-- CreateIndex
CREATE INDEX "Bid_status_idx" ON "Bid"("status");

-- CreateIndex
CREATE INDEX "ChangeOrder_dealId_idx" ON "ChangeOrder"("dealId");

-- CreateIndex
CREATE INDEX "ChangeOrder_status_idx" ON "ChangeOrder"("status");

-- CreateIndex
CREATE INDEX "ChangeOrder_trade_idx" ON "ChangeOrder"("trade");

-- CreateIndex
CREATE INDEX "Event_dealId_idx" ON "Event"("dealId");

-- CreateIndex
CREATE INDEX "Event_actor_idx" ON "Event"("actor");

-- CreateIndex
CREATE INDEX "Event_artifact_idx" ON "Event"("artifact");

-- CreateIndex
CREATE INDEX "Event_ts_idx" ON "Event"("ts");

-- CreateIndex
CREATE INDEX "Vendor_userId_idx" ON "Vendor"("userId");

-- CreateIndex
CREATE INDEX "Vendor_trade_idx" ON "Vendor"("trade");

-- CreateIndex
CREATE INDEX "Vendor_region_idx" ON "Vendor"("region");

-- CreateIndex
CREATE INDEX "Invoice_dealId_idx" ON "Invoice"("dealId");

-- CreateIndex
CREATE INDEX "Invoice_vendorId_idx" ON "Invoice"("vendorId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Policy_userId_idx" ON "Policy"("userId");

-- CreateIndex
CREATE INDEX "Policy_region_grade_idx" ON "Policy"("region", "grade");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_userId_region_grade_key" ON "Policy"("userId", "region", "grade");

-- CreateIndex
CREATE INDEX "Property_userId_idx" ON "Property"("userId");

-- CreateIndex
CREATE INDEX "Property_score_idx" ON "Property"("score");

-- CreateIndex
CREATE INDEX "Property_city_state_idx" ON "Property"("city", "state");

-- CreateIndex
CREATE INDEX "Property_createdAt_idx" ON "Property"("createdAt");

-- CreateIndex
CREATE INDEX "Property_dataSource_idx" ON "Property"("dataSource");

-- CreateIndex
CREATE UNIQUE INDEX "Property_userId_address_city_state_zip_key" ON "Property"("userId", "address", "city", "state", "zip");

-- CreateIndex
CREATE INDEX "Task_userId_dueDate_idx" ON "Task"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "Task_userId_completed_idx" ON "Task"("userId", "completed");

-- CreateIndex
CREATE INDEX "Task_propertyId_idx" ON "Task"("propertyId");

-- CreateIndex
CREATE INDEX "Task_dealId_idx" ON "Task"("dealId");

-- CreateIndex
CREATE INDEX "DealAnalysis_userId_createdAt_idx" ON "DealAnalysis"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DealAnalysis_propertyId_idx" ON "DealAnalysis"("propertyId");

-- CreateIndex
CREATE INDEX "Offer_userId_status_idx" ON "Offer"("userId", "status");

-- CreateIndex
CREATE INDEX "Offer_propertyId_idx" ON "Offer"("propertyId");

-- CreateIndex
CREATE INDEX "Offer_status_idx" ON "Offer"("status");

-- CreateIndex
CREATE INDEX "Offer_createdAt_idx" ON "Offer"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_offerId_key" ON "Contract"("offerId");

-- CreateIndex
CREATE INDEX "Contract_userId_status_idx" ON "Contract"("userId", "status");

-- CreateIndex
CREATE INDEX "Contract_propertyId_idx" ON "Contract"("propertyId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Contract_createdAt_idx" ON "Contract"("createdAt");

-- CreateIndex
CREATE INDEX "Buyer_userId_idx" ON "Buyer"("userId");

-- CreateIndex
CREATE INDEX "Buyer_email_idx" ON "Buyer"("email");

-- CreateIndex
CREATE INDEX "Buyer_name_idx" ON "Buyer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ContractAssignment_contractId_key" ON "ContractAssignment"("contractId");

-- CreateIndex
CREATE INDEX "ContractAssignment_buyerId_idx" ON "ContractAssignment"("buyerId");

-- CreateIndex
CREATE INDEX "ContractAssignment_status_idx" ON "ContractAssignment"("status");

-- CreateIndex
CREATE INDEX "ContractAssignment_createdAt_idx" ON "ContractAssignment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Rental_contractId_key" ON "Rental"("contractId");

-- CreateIndex
CREATE INDEX "Rental_userId_idx" ON "Rental"("userId");

-- CreateIndex
CREATE INDEX "Rental_propertyId_idx" ON "Rental"("propertyId");

-- CreateIndex
CREATE INDEX "Rental_contractId_idx" ON "Rental"("contractId");

-- CreateIndex
CREATE INDEX "Rental_status_idx" ON "Rental"("status");

-- CreateIndex
CREATE INDEX "Rental_createdAt_idx" ON "Rental"("createdAt");

-- CreateIndex
CREATE INDEX "Tenant_rentalId_idx" ON "Tenant"("rentalId");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- CreateIndex
CREATE INDEX "Tenant_leaseEnd_idx" ON "Tenant"("leaseEnd");

-- CreateIndex
CREATE INDEX "RentalIncome_rentalId_idx" ON "RentalIncome"("rentalId");

-- CreateIndex
CREATE INDEX "RentalIncome_receivedDate_idx" ON "RentalIncome"("receivedDate");

-- CreateIndex
CREATE INDEX "RentalIncome_type_idx" ON "RentalIncome"("type");

-- CreateIndex
CREATE INDEX "RentalExpense_rentalId_idx" ON "RentalExpense"("rentalId");

-- CreateIndex
CREATE INDEX "RentalExpense_expenseDate_idx" ON "RentalExpense"("expenseDate");

-- CreateIndex
CREATE INDEX "RentalExpense_category_idx" ON "RentalExpense"("category");

-- CreateIndex
CREATE INDEX "RentalExpense_paid_idx" ON "RentalExpense"("paid");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_eventId_key" ON "Notification"("eventId");

-- CreateIndex
CREATE INDEX "Notification_type_occurredAt_idx" ON "Notification"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "Notification_dealId_idx" ON "Notification"("dealId");

-- CreateIndex
CREATE INDEX "Notification_processed_idx" ON "Notification"("processed");

-- AddForeignKey
ALTER TABLE "DealSpec" ADD CONSTRAINT "DealSpec_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealSpec" ADD CONSTRAINT "DealSpec_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealSpec" ADD CONSTRAINT "DealSpec_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScopeTreeNode" ADD CONSTRAINT "ScopeTreeNode_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "DealSpec"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLedger" ADD CONSTRAINT "BudgetLedger_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "DealSpec"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "DealSpec"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeOrder" ADD CONSTRAINT "ChangeOrder_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "DealSpec"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "DealSpec"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "DealSpec"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealAnalysis" ADD CONSTRAINT "DealAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealAnalysis" ADD CONSTRAINT "DealAnalysis_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Buyer" ADD CONSTRAINT "Buyer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractAssignment" ADD CONSTRAINT "ContractAssignment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractAssignment" ADD CONSTRAINT "ContractAssignment_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalIncome" ADD CONSTRAINT "RentalIncome_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalExpense" ADD CONSTRAINT "RentalExpense_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

