/*
  Warnings:

  - Added the required column `dataSource` to the `Property` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Property" ("absenteeOwner", "address", "bankruptcy", "city", "createdAt", "enriched", "foreclosure", "id", "metadata", "ownerName", "potentialProfit", "preForeclosure", "score", "state", "taxDelinquent", "updatedAt", "vacant", "zip") SELECT "absenteeOwner", "address", "bankruptcy", "city", "createdAt", "enriched", "foreclosure", "id", "metadata", "ownerName", "potentialProfit", "preForeclosure", "score", "state", "taxDelinquent", "updatedAt", "vacant", "zip" FROM "Property";
DROP TABLE "Property";
ALTER TABLE "new_Property" RENAME TO "Property";
CREATE INDEX "Property_score_idx" ON "Property"("score");
CREATE INDEX "Property_city_state_idx" ON "Property"("city", "state");
CREATE INDEX "Property_createdAt_idx" ON "Property"("createdAt");
CREATE INDEX "Property_dataSource_idx" ON "Property"("dataSource");
CREATE UNIQUE INDEX "Property_address_city_state_zip_key" ON "Property"("address", "city", "state", "zip");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
