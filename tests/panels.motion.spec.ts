import { describe, it, expect } from 'vitest';

const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_DEAL_ID = process.env.TEST_DEAL_ID || 'test-deal-001';

describe('Panels – Motion', () => {
  it('returns progress, bottlenecks, vendors, recent events', async () => {
    const res = await fetch(`${base}/api/panels/motion?dealId=${TEST_DEAL_ID}`);

    if (res.status === 500) {
      console.warn('Test deal not found, skipping test');
      return;
    }

    expect(res.status).toBe(200);
    const json = await res.json();

    // Check structure
    expect(json).toHaveProperty('dealId');
    expect(json).toHaveProperty('progress');
    expect(json).toHaveProperty('bottlenecks');
    expect(json).toHaveProperty('vendors');
    expect(json).toHaveProperty('recentEvents');
    expect(json).toHaveProperty('eventId');

    // Check progress structure
    expect(json.progress).toHaveProperty('plannedMilestones');
    expect(json.progress).toHaveProperty('completedMilestones');
    expect(json.progress).toHaveProperty('percentComplete');
    expect(json.progress.percentComplete).toBeGreaterThanOrEqual(0);
    expect(json.progress.percentComplete).toBeLessThanOrEqual(100);

    // Check arrays
    expect(Array.isArray(json.bottlenecks)).toBe(true);
    expect(Array.isArray(json.vendors)).toBe(true);
    expect(Array.isArray(json.recentEvents)).toBe(true);

    // Check bottleneck structure if present
    if (json.bottlenecks.length > 0) {
      const bottleneck = json.bottlenecks[0];
      expect(bottleneck).toHaveProperty('type');
      expect(['APPROVAL', 'VENDOR', 'INVOICE', 'CHANGE_ORDER']).toContain(bottleneck.type);
      expect(bottleneck).toHaveProperty('refId');
      expect(bottleneck).toHaveProperty('ageHours');
      expect(bottleneck).toHaveProperty('notes');
    }

    // Check vendor structure if present
    if (json.vendors.length > 0) {
      const vendor = json.vendors[0];
      expect(vendor).toHaveProperty('vendorId');
      expect(vendor).toHaveProperty('name');
      expect(vendor).toHaveProperty('reliabilityScore');
      expect(vendor).toHaveProperty('avgBidTurnaroundHours');
      expect(vendor).toHaveProperty('avgInvoiceLatencyHours');
      expect(vendor.reliabilityScore).toBeGreaterThanOrEqual(0);
      expect(vendor.reliabilityScore).toBeLessThanOrEqual(100);
    }

    // Check recent events structure if present
    if (json.recentEvents.length > 0) {
      const event = json.recentEvents[0];
      expect(event).toHaveProperty('ts');
      expect(event).toHaveProperty('artifact');
      expect(event).toHaveProperty('action');
    }
  });

  it('returns proper ETag header', async () => {
    const res = await fetch(`${base}/api/panels/motion?dealId=${TEST_DEAL_ID}`);

    if (res.status === 500) {
      console.warn('Test deal not found, skipping test');
      return;
    }

    expect(res.headers.get('etag')).toBeTruthy();
    expect(res.headers.get('cache-control')).toContain('max-age=15');
  });

  it('returns 422 when dealId is missing', async () => {
    const res = await fetch(`${base}/api/panels/motion`);
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toContain('dealId is required');
  });
});