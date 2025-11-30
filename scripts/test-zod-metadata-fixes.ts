import { z } from 'zod';
import fs from 'fs';

/**
 * Test different approaches to fix the metadata field issue in Zod v4
 */

const payload = JSON.parse(fs.readFileSync('attom-payload.json', 'utf-8'));

console.log('🔧 Testing Metadata Field Fixes for Zod v4\n');
console.log('=' .repeat(80));

// Fix 1: Remove .nullable().optional() - use .optional() only
console.log('\n✅ Fix 1: z.record(z.any()).optional() (no .nullable())');
const Fix1Schema = z.object({
  userId: z.string(),
  source: z.enum(['attom', 'batchdata', 'manual', 'google_sheets']),
  properties: z.array(z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    county: z.string().nullable().optional(),
    foreclosure: z.boolean().default(false),
    sourceId: z.string().nullable().optional(),
    metadata: z.record(z.any()).optional(),  // CHANGE: removed .nullable()
  }))
});

try {
  const result1 = Fix1Schema.parse(payload);
  console.log('✅ SUCCESS! z.record(z.any()).optional() works\n');
} catch (error) {
  console.log('❌ Failed:', (error as Error).message);
}

// Fix 2: Use z.record(z.string(), z.any())
console.log('✅ Fix 2: z.record(z.string(), z.any()).optional()');
const Fix2Schema = z.object({
  userId: z.string(),
  source: z.enum(['attom', 'batchdata', 'manual', 'google_sheets']),
  properties: z.array(z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    county: z.string().nullable().optional(),
    foreclosure: z.boolean().default(false),
    sourceId: z.string().nullable().optional(),
    metadata: z.record(z.string(), z.any()).optional(),  // CHANGE: explicit key type
  }))
});

try {
  const result2 = Fix2Schema.parse(payload);
  console.log('✅ SUCCESS! z.record(z.string(), z.any()).optional() works\n');
} catch (error) {
  console.log('❌ Failed:', (error as Error).message);
}

// Fix 3: Use z.any() directly
console.log('✅ Fix 3: z.any().optional()');
const Fix3Schema = z.object({
  userId: z.string(),
  source: z.enum(['attom', 'batchdata', 'manual', 'google_sheets']),
  properties: z.array(z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    county: z.string().nullable().optional(),
    foreclosure: z.boolean().default(false),
    sourceId: z.string().nullable().optional(),
    metadata: z.any().optional(),  // CHANGE: just z.any()
  }))
});

try {
  const result3 = Fix3Schema.parse(payload);
  console.log('✅ SUCCESS! z.any().optional() works\n');
} catch (error) {
  console.log('❌ Failed:', (error as Error).message);
}

// Fix 4: Use .nullish() instead of .nullable().optional()
console.log('✅ Fix 4: z.record(z.any()).nullish()');
const Fix4Schema = z.object({
  userId: z.string(),
  source: z.enum(['attom', 'batchdata', 'manual', 'google_sheets']),
  properties: z.array(z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    county: z.string().nullable().optional(),
    foreclosure: z.boolean().default(false),
    sourceId: z.string().nullable().optional(),
    metadata: z.record(z.any()).nullish(),  // CHANGE: .nullish() = .nullable().optional()
  }))
});

try {
  const result4 = Fix4Schema.parse(payload);
  console.log('✅ SUCCESS! z.record(z.any()).nullish() works\n');
} catch (error) {
  console.log('❌ Failed:', (error as Error).message);
}

// Fix 5: Use union with null
console.log('✅ Fix 5: z.union([z.record(z.any()), z.null()]).optional()');
const Fix5Schema = z.object({
  userId: z.string(),
  source: z.enum(['attom', 'batchdata', 'manual', 'google_sheets']),
  properties: z.array(z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    county: z.string().nullable().optional(),
    foreclosure: z.boolean().default(false),
    sourceId: z.string().nullable().optional(),
    metadata: z.union([z.record(z.any()), z.null()]).optional(),
  }))
});

try {
  const result5 = Fix5Schema.parse(payload);
  console.log('✅ SUCCESS! z.union([z.record(z.any()), z.null()]).optional() works\n');
} catch (error) {
  console.log('❌ Failed:', (error as Error).message);
}

console.log('=' .repeat(80));
console.log('\n🎯 Recommendation: Use the simplest working solution');
