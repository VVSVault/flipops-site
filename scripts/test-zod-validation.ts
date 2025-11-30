import { z } from 'zod';
import fs from 'fs';

/**
 * Test Zod validation with actual ATTOM payload
 * to isolate which field is causing the error
 */

// Read the actual payload
const payload = JSON.parse(fs.readFileSync('attom-payload.json', 'utf-8'));

// Test schemas progressively
console.log('🧪 Testing Zod v4 Validation...\n');

// Test 1: Minimal schema
console.log('Test 1: Minimal required fields only');
const MinimalSchema = z.object({
  userId: z.string(),
  source: z.enum(['attom', 'batchdata', 'manual', 'google_sheets']),
  properties: z.array(z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
  }))
});

try {
  const result1 = MinimalSchema.parse(payload);
  console.log('✅ Minimal schema passed\n');
} catch (error) {
  console.log('❌ Minimal schema failed:', error);
  process.exit(1);
}

// Test 2: Add nullable optional fields
console.log('Test 2: Add nullable optional fields');
const WithOptionalSchema = z.object({
  userId: z.string(),
  source: z.enum(['attom', 'batchdata', 'manual', 'google_sheets']),
  properties: z.array(z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    county: z.string().nullable().optional(),
    apn: z.string().nullable().optional(),
    ownerName: z.string().nullable().optional(),
  }))
});

try {
  const result2 = WithOptionalSchema.parse(payload);
  console.log('✅ Optional fields passed\n');
} catch (error) {
  console.log('❌ Optional fields failed:', error);
  process.exit(1);
}

// Test 3: Add number fields
console.log('Test 3: Add nullable number fields');
const WithNumbersSchema = z.object({
  userId: z.string(),
  source: z.enum(['attom', 'batchdata', 'manual', 'google_sheets']),
  properties: z.array(z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    county: z.string().nullable().optional(),
    apn: z.string().nullable().optional(),
    ownerName: z.string().nullable().optional(),
    bedrooms: z.number().int().nullable().optional(),
    bathrooms: z.number().nullable().optional(),
    squareFeet: z.number().int().nullable().optional(),
    lotSize: z.number().int().nullable().optional(),
    yearBuilt: z.number().int().nullable().optional(),
  }))
});

try {
  const result3 = WithNumbersSchema.parse(payload);
  console.log('✅ Number fields passed\n');
} catch (error) {
  console.log('❌ Number fields failed:', error);
  process.exit(1);
}

// Test 4: Add boolean fields with defaults
console.log('Test 4: Add boolean fields with defaults');
const WithBooleansSchema = z.object({
  userId: z.string(),
  source: z.enum(['attom', 'batchdata', 'manual', 'google_sheets']),
  properties: z.array(z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    county: z.string().nullable().optional(),
    apn: z.string().nullable().optional(),
    ownerName: z.string().nullable().optional(),
    bedrooms: z.number().int().nullable().optional(),
    bathrooms: z.number().nullable().optional(),
    squareFeet: z.number().int().nullable().optional(),
    lotSize: z.number().int().nullable().optional(),
    yearBuilt: z.number().int().nullable().optional(),
    foreclosure: z.boolean().default(false),
    preForeclosure: z.boolean().default(false),
    taxDelinquent: z.boolean().default(false),
    vacant: z.boolean().default(false),
    bankruptcy: z.boolean().default(false),
    absenteeOwner: z.boolean().default(false),
  }))
});

try {
  const result4 = WithBooleansSchema.parse(payload);
  console.log('✅ Boolean fields passed\n');
} catch (error) {
  console.log('❌ Boolean fields failed:', error);
  console.log(JSON.stringify(error, null, 2));
  process.exit(1);
}

// Test 5: Add metadata field (likely culprit)
console.log('Test 5: Add metadata field with z.record()');
const WithMetadataSchema = z.object({
  userId: z.string(),
  source: z.enum(['attom', 'batchdata', 'manual', 'google_sheets']),
  properties: z.array(z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    county: z.string().nullable().optional(),
    apn: z.string().nullable().optional(),
    ownerName: z.string().nullable().optional(),
    bedrooms: z.number().int().nullable().optional(),
    bathrooms: z.number().nullable().optional(),
    squareFeet: z.number().int().nullable().optional(),
    lotSize: z.number().int().nullable().optional(),
    yearBuilt: z.number().int().nullable().optional(),
    foreclosure: z.boolean().default(false),
    preForeclosure: z.boolean().default(false),
    taxDelinquent: z.boolean().default(false),
    vacant: z.boolean().default(false),
    bankruptcy: z.boolean().default(false),
    absenteeOwner: z.boolean().default(false),
    sourceId: z.string().nullable().optional(),
    metadata: z.record(z.any()).nullable().optional(),
  }))
});

try {
  const result5 = WithMetadataSchema.parse(payload);
  console.log('✅ Metadata field passed\n');
} catch (error) {
  console.log('❌ Metadata field failed - THIS IS THE CULPRIT');
  console.log('Error:', error);
  process.exit(1);
}

console.log('🎉 All tests passed!');
