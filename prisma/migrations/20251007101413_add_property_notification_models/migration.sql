-- CreateTable
CREATE TABLE "DealSpec" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "maxExposureUsd" REAL NOT NULL,
    "targetRoiPct" REAL NOT NULL,
    "arv" REAL,
    "region" TEXT DEFAULT 'Miami',
    "grade" TEXT DEFAULT 'Standard',
    "startAt" DATETIME,
    "dailyBurnUsd" REAL DEFAULT 0,
    "constraints" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScopeTreeNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "trade" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "quantity" JSONB NOT NULL,
    "finishLvl" TEXT,
    "assumptions" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScopeTreeNode_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "DealSpec" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CostModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "region" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "trade" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "material" REAL NOT NULL,
    "labor" REAL NOT NULL,
    "contingencyPct" REAL NOT NULL,
    "riskPremiumPct" REAL NOT NULL,
    "source" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BudgetLedger" (
    "dealId" TEXT NOT NULL PRIMARY KEY,
    "baseline" TEXT NOT NULL,
    "committed" TEXT NOT NULL,
    "actuals" TEXT NOT NULL,
    "variance" TEXT NOT NULL,
    "contingencyRemaining" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BudgetLedger_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "DealSpec" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "subtotal" REAL NOT NULL,
    "includes" JSONB NOT NULL,
    "excludes" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "normalized" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bid_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "DealSpec" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Bid_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChangeOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "trade" TEXT NOT NULL,
    "deltaUsd" REAL NOT NULL,
    "impactDays" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "rationale" TEXT,
    "simResults" JSONB,
    "decidedAt" DATETIME,
    "decidedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChangeOrder_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "DealSpec" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT,
    "actor" TEXT NOT NULL,
    "artifact" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "diff" TEXT,
    "checksum" TEXT NOT NULL,
    "ts" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "DealSpec" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "trade" TEXT NOT NULL,
    "region" TEXT,
    "onTimePct" REAL NOT NULL DEFAULT 100,
    "onBudgetPct" REAL NOT NULL DEFAULT 100,
    "reliability" REAL NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "vendorId" TEXT,
    "trade" TEXT NOT NULL,
    "lineItemId" TEXT,
    "amount" REAL NOT NULL,
    "docUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "region" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "maxExposureUsd" REAL NOT NULL,
    "targetRoiPct" REAL NOT NULL,
    "contingencyTargetPct" REAL NOT NULL,
    "varianceTier1Pct" REAL NOT NULL,
    "varianceTier2Pct" REAL NOT NULL,
    "bidSpreadMaxPct" REAL NOT NULL,
    "coSlaHours" INTEGER NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "ownerName" TEXT,
    "score" INTEGER NOT NULL,
    "potentialProfit" REAL NOT NULL,
    "foreclosure" BOOLEAN NOT NULL DEFAULT false,
    "preForeclosure" BOOLEAN NOT NULL DEFAULT false,
    "taxDelinquent" BOOLEAN NOT NULL DEFAULT false,
    "vacant" BOOLEAN NOT NULL DEFAULT false,
    "bankruptcy" BOOLEAN NOT NULL DEFAULT false,
    "absenteeOwner" BOOLEAN NOT NULL DEFAULT false,
    "enriched" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dealId" TEXT,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "n8nExecId" TEXT,
    "n8nWorkflow" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE INDEX "DealSpec_address_idx" ON "DealSpec"("address");

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
CREATE INDEX "Policy_region_grade_idx" ON "Policy"("region", "grade");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_region_grade_key" ON "Policy"("region", "grade");

-- CreateIndex
CREATE INDEX "Property_score_idx" ON "Property"("score");

-- CreateIndex
CREATE INDEX "Property_city_state_idx" ON "Property"("city", "state");

-- CreateIndex
CREATE INDEX "Property_createdAt_idx" ON "Property"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Property_address_city_state_zip_key" ON "Property"("address", "city", "state", "zip");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_eventId_key" ON "Notification"("eventId");

-- CreateIndex
CREATE INDEX "Notification_type_occurredAt_idx" ON "Notification"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "Notification_dealId_idx" ON "Notification"("dealId");

-- CreateIndex
CREATE INDEX "Notification_processed_idx" ON "Notification"("processed");
