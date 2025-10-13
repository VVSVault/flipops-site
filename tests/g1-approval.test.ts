import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../lib/prisma';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('Gate G1 - Deal Approval (Maximum Exposure Protection)', () => {

  beforeAll(async () => {
    console.log('Ensuring test data exists...');

    // Ensure we have a safe deal that should pass
    const safeDeal = await prisma.dealSpec.findUnique({
      where: { id: 'SAFE_DEAL_001' }
    });

    // Ensure we have a risky deal that should fail
    const riskyDeal = await prisma.dealSpec.findUnique({
      where: { id: 'RISKY_DEAL_001' }
    });

    if (!safeDeal || !riskyDeal) {
      console.warn('Test deals not found. Please run: npm run prisma:seed');
    }
  });

  describe('POST /api/deals/approve', () => {

    it('should APPROVE a safe deal when P80 is below max exposure', async () => {
      const response = await fetch(`${BASE_URL}/api/deals/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealId: 'SAFE_DEAL_001',
          region: 'Miami',
          grade: 'Standard'
        })
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('APPROVED');
      expect(data.dealId).toBe('SAFE_DEAL_001');
      expect(data.metrics).toBeDefined();
      expect(data.metrics.p80).toBeDefined();
      expect(data.metrics.p80).toBeLessThanOrEqual(data.policy.maxExposureUsd);
      expect(data.eventId).toBeDefined();
      expect(data.headroom).toBeDefined();
      expect(data.headroom.amount).toBeGreaterThan(0);
    });

    it('should BLOCK a risky deal when P80 exceeds max exposure', async () => {
      const response = await fetch(`${BASE_URL}/api/deals/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealId: 'RISKY_DEAL_001',
          region: 'Miami',
          grade: 'Standard'
        })
      });

      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.status).toBe('BLOCKED_G1');
      expect(data.reason).toContain('P80 exceeds');
      expect(data.metrics).toBeDefined();
      expect(data.metrics.p80).toBeGreaterThan(data.metrics.maxExposureUsd);
      expect(data.metrics.overBy).toBeGreaterThan(0);
      expect(data.drivers).toBeDefined();
      expect(Array.isArray(data.drivers)).toBe(true);
      expect(data.drivers.length).toBeGreaterThan(0);
      expect(data.eventId).toBeDefined();
      expect(data.recommendation).toBeDefined();
    });

    it('should return 404 for non-existent deal', async () => {
      const response = await fetch(`${BASE_URL}/api/deals/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealId: 'NON_EXISTENT_DEAL',
          region: 'Miami',
          grade: 'Standard'
        })
      });

      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Deal not found');
    });

    it('should return 422 for invalid grade', async () => {
      const response = await fetch(`${BASE_URL}/api/deals/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealId: 'SAFE_DEAL_001',
          region: 'Miami',
          grade: 'InvalidGrade'
        })
      });

      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toContain('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should return 422 for missing required fields', async () => {
      const response = await fetch(`${BASE_URL}/api/deals/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealId: 'SAFE_DEAL_001'
          // Missing region and grade
        })
      });

      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toContain('Validation failed');
    });

    it('should return 422 when no policy exists for region/grade', async () => {
      const response = await fetch(`${BASE_URL}/api/deals/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealId: 'SAFE_DEAL_001',
          region: 'NonExistentRegion',
          grade: 'Standard'
        })
      });

      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toContain('No policy configured');
    });
  });

  describe('Event Logging', () => {

    it('should create an event for approved deals', async () => {
      const response = await fetch(`${BASE_URL}/api/deals/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealId: 'SAFE_DEAL_001',
          region: 'Miami',
          grade: 'Standard'
        })
      });

      const data = await response.json();
      expect(data.eventId).toBeDefined();

      // Verify event was created
      const event = await prisma.event.findUnique({
        where: { id: data.eventId }
      });

      expect(event).toBeDefined();
      expect(event?.action).toBe('APPROVE');
      expect(event?.artifact).toBe('DealSpec');
      expect(event?.actor).toBe('system:G1');
      expect(event?.checksum).toBeDefined();
    });

    it('should create an event for blocked deals', async () => {
      const response = await fetch(`${BASE_URL}/api/deals/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealId: 'RISKY_DEAL_001',
          region: 'Miami',
          grade: 'Standard'
        })
      });

      const data = await response.json();
      expect(data.eventId).toBeDefined();

      // Verify event was created
      const event = await prisma.event.findUnique({
        where: { id: data.eventId }
      });

      expect(event).toBeDefined();
      expect(event?.action).toBe('BLOCK');
      expect(event?.artifact).toBe('DealSpec');
      expect(event?.actor).toBe('system:G1');
      expect(event?.diff).toBeDefined();
    });
  });
});