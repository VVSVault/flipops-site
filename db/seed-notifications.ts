#!/usr/bin/env tsx
/**
 * Seed Notifications for Testing
 * Creates demo notification records
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNotifications() {
  console.log('🌱 Seeding notifications...\n');

  try {
    // Clean existing notifications
    await prisma.notification.deleteMany({
      where: {
        eventId: {
          startsWith: 'evt_demo_'
        }
      }
    });

    // Create demo notifications
    const notifications = await prisma.notification.createMany({
      data: [
        {
          eventId: 'evt_demo_001',
          type: 'property.alert',
          message: 'High-score property found: 123 Main St, Miami FL',
          metadata: JSON.stringify({
            score: 92,
            address: '123 Main St',
            city: 'Miami',
            state: 'FL',
            alerts_sent: ['slack', 'email']
          }),
          occurredAt: new Date(Date.now() - 3600000), // 1 hour ago
        },
        {
          eventId: 'evt_demo_002',
          type: 'g1.denied',
          dealId: 'deal_test_001',
          message: 'Guardrail G1 blocked: P80 exceeds max exposure',
          metadata: JSON.stringify({
            p80: 245000,
            maxExposureUsd: 230000,
            excess: 15000
          }),
          occurredAt: new Date(Date.now() - 7200000), // 2 hours ago
        },
        {
          eventId: 'evt_demo_003',
          type: 'property.enriched',
          message: 'Property enriched with skip trace data',
          metadata: JSON.stringify({
            address: '456 Oak Ave',
            owner_phone: '555-0123',
            owner_email: 'owner@example.com'
          }),
          occurredAt: new Date(Date.now() - 1800000), // 30 min ago
          processed: true
        }
      ]
    });

    console.log(`✅ Created ${notifications.count} demo notifications\n`);

    // Display sample data
    const samples = await prisma.notification.findMany({
      take: 3,
      orderBy: { occurredAt: 'desc' }
    });

    console.log('📋 Sample notifications:');
    samples.forEach(n => {
      console.log(`   ${n.type}: ${n.message}`);
      console.log(`      Event ID: ${n.eventId}`);
      console.log(`      Time: ${n.occurredAt.toISOString()}\n`);
    });

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  console.log('✨ Seeding complete!\n');
}

// Run if called directly
if (require.main === module) {
  seedNotifications().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { seedNotifications };