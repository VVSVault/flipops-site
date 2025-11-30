/*
  Warnings:

  - Added the required column `userId` to the `DealSpec` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "clerkId" TEXT,
    "name" TEXT,
    "companyName" TEXT,
    "targetMarkets" TEXT NOT NULL,
    "propertyTypes" TEXT,
    "minScore" INTEGER NOT NULL DEFAULT 70,
    "maxBudget" REAL,
    "slackWebhook" TEXT,
    "emailAlerts" BOOLEAN NOT NULL DEFAULT true,
    "dailyDigest" BOOLEAN NOT NULL DEFAULT true,
    "digestTime" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "tier" TEXT NOT NULL DEFAULT 'pro',
    "monthlyDeals" INTEGER NOT NULL DEFAULT 0,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "onboardedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME
);

-- Create default system user for existing data
INSERT INTO "User" ("id", "email", "name", "targetMarkets", "updatedAt", "onboarded")
VALUES ('default-user-id', 'system@flipops.com', 'System Default User', '["Miami-Dade, FL"]', CURRENT_TIMESTAMP, true);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DealSpec" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DealSpec_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DealSpec" ("userId", "address", "arv", "constraints", "createdAt", "dailyBurnUsd", "grade", "id", "maxExposureUsd", "region", "startAt", "targetRoiPct", "type", "updatedAt") SELECT 'default-user-id', "address", "arv", "constraints", "createdAt", "dailyBurnUsd", "grade", "id", "maxExposureUsd", "region", "startAt", "targetRoiPct", "type", "updatedAt" FROM "DealSpec";
DROP TABLE "DealSpec";
ALTER TABLE "new_DealSpec" RENAME TO "DealSpec";
CREATE INDEX "DealSpec_userId_idx" ON "DealSpec"("userId");
CREATE INDEX "DealSpec_address_idx" ON "DealSpec"("address");
CREATE INDEX "DealSpec_createdAt_idx" ON "DealSpec"("createdAt");
CREATE TABLE "new_Policy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Policy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Policy" ("bidSpreadMaxPct", "coSlaHours", "contingencyTargetPct", "createdAt", "grade", "id", "maxExposureUsd", "region", "targetRoiPct", "updatedAt", "updatedBy", "varianceTier1Pct", "varianceTier2Pct") SELECT "bidSpreadMaxPct", "coSlaHours", "contingencyTargetPct", "createdAt", "grade", "id", "maxExposureUsd", "region", "targetRoiPct", "updatedAt", "updatedBy", "varianceTier1Pct", "varianceTier2Pct" FROM "Policy";
DROP TABLE "Policy";
ALTER TABLE "new_Policy" RENAME TO "Policy";
CREATE INDEX "Policy_userId_idx" ON "Policy"("userId");
CREATE INDEX "Policy_region_grade_idx" ON "Policy"("region", "grade");
CREATE UNIQUE INDEX "Policy_userId_region_grade_key" ON "Policy"("userId", "region", "grade");
CREATE TABLE "new_Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "assessedValue" REAL,
    "taxAmount" REAL,
    "lastSaleDate" TEXT,
    "lastSalePrice" REAL,
    "estimatedValue" REAL,
    "score" INTEGER,
    "scoreBreakdown" TEXT,
    "scoredAt" DATETIME,
    "potentialProfit" REAL,
    "foreclosure" BOOLEAN NOT NULL DEFAULT false,
    "preForeclosure" BOOLEAN NOT NULL DEFAULT false,
    "taxDelinquent" BOOLEAN NOT NULL DEFAULT false,
    "vacant" BOOLEAN NOT NULL DEFAULT false,
    "bankruptcy" BOOLEAN NOT NULL DEFAULT false,
    "absenteeOwner" BOOLEAN NOT NULL DEFAULT false,
    "phoneNumbers" TEXT,
    "emails" TEXT,
    "dataSource" TEXT NOT NULL,
    "sourceId" TEXT,
    "enriched" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Property" ("userId", "absenteeOwner", "address", "apn", "assessedValue", "bankruptcy", "bathrooms", "bedrooms", "city", "county", "createdAt", "dataSource", "emails", "enriched", "estimatedValue", "foreclosure", "id", "lastSaleDate", "lastSalePrice", "lotSize", "metadata", "ownerName", "phoneNumbers", "potentialProfit", "preForeclosure", "propertyType", "score", "scoreBreakdown", "scoredAt", "sourceId", "squareFeet", "state", "taxAmount", "taxDelinquent", "updatedAt", "vacant", "yearBuilt", "zip") SELECT 'default-user-id', "absenteeOwner", "address", "apn", "assessedValue", "bankruptcy", "bathrooms", "bedrooms", "city", "county", "createdAt", "dataSource", "emails", "enriched", "estimatedValue", "foreclosure", "id", "lastSaleDate", "lastSalePrice", "lotSize", "metadata", "ownerName", "phoneNumbers", "potentialProfit", "preForeclosure", "propertyType", "score", "scoreBreakdown", "scoredAt", "sourceId", "squareFeet", "state", "taxAmount", "taxDelinquent", "updatedAt", "vacant", "yearBuilt", "zip" FROM "Property";
DROP TABLE "Property";
ALTER TABLE "new_Property" RENAME TO "Property";
CREATE INDEX "Property_userId_idx" ON "Property"("userId");
CREATE INDEX "Property_score_idx" ON "Property"("score");
CREATE INDEX "Property_city_state_idx" ON "Property"("city", "state");
CREATE INDEX "Property_createdAt_idx" ON "Property"("createdAt");
CREATE INDEX "Property_dataSource_idx" ON "Property"("dataSource");
CREATE UNIQUE INDEX "Property_userId_address_city_state_zip_key" ON "Property"("userId", "address", "city", "state", "zip");
CREATE TABLE "new_Vendor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "trade" TEXT NOT NULL,
    "region" TEXT,
    "onTimePct" REAL NOT NULL DEFAULT 100,
    "onBudgetPct" REAL NOT NULL DEFAULT 100,
    "reliability" REAL NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Vendor" ("createdAt", "email", "id", "name", "onBudgetPct", "onTimePct", "phone", "region", "reliability", "trade", "updatedAt") SELECT "createdAt", "email", "id", "name", "onBudgetPct", "onTimePct", "phone", "region", "reliability", "trade", "updatedAt" FROM "Vendor";
DROP TABLE "Vendor";
ALTER TABLE "new_Vendor" RENAME TO "Vendor";
CREATE INDEX "Vendor_userId_idx" ON "Vendor"("userId");
CREATE INDEX "Vendor_trade_idx" ON "Vendor"("trade");
CREATE INDEX "Vendor_region_idx" ON "Vendor"("region");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

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
