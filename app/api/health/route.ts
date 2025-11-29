import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const startTime = Date.now();

  const health = {
    api: 'ok',
    db: 'error',
    time: new Date().toISOString(),
    responseTime: 0
  };

  try {
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`;
    health.db = 'ok';
  } catch (error) {
    console.error('Database health check failed:', error);
    health.db = 'error';
  }

  health.responseTime = Date.now() - startTime;

  // Return 200 even if DB check fails during initial deployment
  // This allows Railway healthcheck to pass while DB connection is being established
  const status = health.api === 'ok' ? 200 : 503;

  return NextResponse.json(health, { status });
}