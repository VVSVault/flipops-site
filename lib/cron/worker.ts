#!/usr/bin/env tsx
/**
 * FlipOps Cron Worker Service
 *
 * A single long-running process that executes all 9 TypeScript cron workflows
 * using node-cron for scheduling. This runs 24/7 and handles all automated tasks.
 *
 * Usage:
 *   Development: npm run worker
 *   Production: Deployed as separate Railway service
 *
 * Schedules:
 * - Guardrails (G1-G4): Every 15 minutes
 * - Data Refresh: Daily at 8:00 AM UTC
 * - Pipeline Monitoring: Daily at 9:00 AM UTC
 * - Contractor Performance: Daily at 10:00 AM UTC
 * - ATTOM Property Discovery: Daily at 6:00 AM UTC
 * - Skip Tracing: Weekly Sunday at 7:00 AM UTC
 */

import cron from 'node-cron';
import { execSync } from 'child_process';
import path from 'path';

// Environment validation
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'ATTOM_API_KEY',
  'BATCHDATA_API_KEY',
];

// Simple logging helpers
const log = (msg: string) => console.log(`[INFO] ${msg}`);
const error = (msg: string) => console.error(`[ERROR] ${msg}`);
const success = (msg: string) => console.log(`[SUCCESS] ✅ ${msg}`);
const warn = (msg: string) => console.warn(`[WARN] ⚠️  ${msg}`);

function validateEnvironment(): void {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);

  if (missing.length > 0) {
    error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  success('Environment validation passed');
}

// Workflow execution wrapper
interface WorkflowExecution {
  name: string;
  path: string;
  lastRun?: Date;
  lastStatus?: 'success' | 'error';
  lastError?: string;
  executionCount: number;
}

const workflows: Record<string, WorkflowExecution> = {
  'data-refresh': {
    name: 'Data Refresh & Sync',
    path: path.join(__dirname, 'monitoring', 'data-refresh-sync.ts'),
    executionCount: 0,
  },
  'pipeline-monitoring': {
    name: 'Pipeline Monitoring',
    path: path.join(__dirname, 'monitoring', 'pipeline-monitoring.ts'),
    executionCount: 0,
  },
  'contractor-performance': {
    name: 'Contractor Performance',
    path: path.join(__dirname, 'monitoring', 'contractor-performance.ts'),
    executionCount: 0,
  },
  'g1-deal-approval': {
    name: 'G1: Deal Approval Alert',
    path: path.join(__dirname, 'guardrails', 'g1-deal-approval.ts'),
    executionCount: 0,
  },
  'g2-bid-spread': {
    name: 'G2: Bid Spread Alert',
    path: path.join(__dirname, 'guardrails', 'g2-bid-spread.ts'),
    executionCount: 0,
  },
  'g3-invoice-budget': {
    name: 'G3: Invoice & Budget Guardian',
    path: path.join(__dirname, 'guardrails', 'g3-invoice-budget.ts'),
    executionCount: 0,
  },
  'g4-change-order': {
    name: 'G4: Change Order Gatekeeper',
    path: path.join(__dirname, 'guardrails', 'g4-change-order.ts'),
    executionCount: 0,
  },
  'attom-discovery': {
    name: 'ATTOM Property Discovery',
    path: path.join(__dirname, 'discovery', 'attom-property-discovery.ts'),
    executionCount: 0,
  },
  'skip-tracing': {
    name: 'Skip Tracing & Enrichment',
    path: path.join(__dirname, 'discovery', 'skip-tracing-enrichment.ts'),
    executionCount: 0,
  },
};

/**
 * Execute a workflow and track its status
 */
async function executeWorkflow(workflowKey: string): Promise<void> {
  const workflow = workflows[workflowKey];
  const startTime = Date.now();

  log(`[${workflow.name}] Starting execution #${workflow.executionCount + 1}...`);

  try {
    // Execute the workflow using tsx
    execSync(`npx tsx ${workflow.path}`, {
      cwd: path.join(__dirname, '..', '..'),
      stdio: 'inherit', // Show output in real-time
      env: process.env,
    });

    const duration = Date.now() - startTime;
    workflow.lastRun = new Date();
    workflow.lastStatus = 'success';
    workflow.executionCount++;
    delete workflow.lastError;

    success(`[${workflow.name}] Completed successfully in ${duration}ms`);
  } catch (err) {
    const duration = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);

    workflow.lastRun = new Date();
    workflow.lastStatus = 'error';
    workflow.lastError = errorMessage;
    workflow.executionCount++;

    error(`[${workflow.name}] Failed after ${duration}ms: ${errorMessage}`);
  }
}

/**
 * Health check endpoint data
 */
function getWorkerStatus() {
  return {
    uptime: process.uptime(),
    workflows: Object.entries(workflows).map(([key, workflow]) => ({
      id: key,
      name: workflow.name,
      lastRun: workflow.lastRun,
      lastStatus: workflow.lastStatus,
      executionCount: workflow.executionCount,
      lastError: workflow.lastError,
    })),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Graceful shutdown handler
 */
function setupShutdownHandlers(): void {
  const shutdown = (signal: string) => {
    warn(`\n${signal} received, shutting down gracefully...`);

    // Log final status
    const status = getWorkerStatus();
    log('Final worker status:');
    console.log(JSON.stringify(status, null, 2));

    // Stop all cron jobs
    cron.getTasks().forEach(task => task.stop());

    success('Worker shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Main worker initialization
 */
function startWorker(): void {
  log('🚀 FlipOps Cron Worker starting...\n');

  // Validate environment
  validateEnvironment();

  // Setup graceful shutdown
  setupShutdownHandlers();

  // Schedule all workflows
  log('📅 Scheduling workflows:\n');

  // Guardrails - Every 15 minutes
  log('⚠️  Guardrail Workflows (Every 15 minutes):');
  cron.schedule('*/15 * * * *', () => executeWorkflow('g1-deal-approval'), {
    timezone: 'UTC',
  });
  log('   ✓ G1: Deal Approval Alert');

  cron.schedule('*/15 * * * *', () => executeWorkflow('g2-bid-spread'), {
    timezone: 'UTC',
  });
  log('   ✓ G2: Bid Spread Alert');

  cron.schedule('*/15 * * * *', () => executeWorkflow('g3-invoice-budget'), {
    timezone: 'UTC',
  });
  log('   ✓ G3: Invoice & Budget Guardian');

  cron.schedule('*/15 * * * *', () => executeWorkflow('g4-change-order'), {
    timezone: 'UTC',
  });
  log('   ✓ G4: Change Order Gatekeeper\n');

  // Monitoring - Daily
  log('📊 Monitoring Workflows (Daily):');
  cron.schedule('0 8 * * *', () => executeWorkflow('data-refresh'), {
    timezone: 'UTC',
  });
  log('   ✓ Data Refresh & Sync (8:00 AM UTC)');

  cron.schedule('0 9 * * *', () => executeWorkflow('pipeline-monitoring'), {
    timezone: 'UTC',
  });
  log('   ✓ Pipeline Monitoring (9:00 AM UTC)');

  cron.schedule('0 10 * * *', () => executeWorkflow('contractor-performance'), {
    timezone: 'UTC',
  });
  log('   ✓ Contractor Performance (10:00 AM UTC)\n');

  // Discovery - Daily and Weekly
  log('🔍 Discovery Workflows:');
  cron.schedule('0 6 * * *', () => executeWorkflow('attom-discovery'), {
    timezone: 'UTC',
  });
  log('   ✓ ATTOM Property Discovery (Daily 6:00 AM UTC)');

  cron.schedule('0 7 * * 0', () => executeWorkflow('skip-tracing'), {
    timezone: 'UTC',
  });
  log('   ✓ Skip Tracing & Enrichment (Weekly Sunday 7:00 AM UTC)\n');

  success('✅ All workflows scheduled successfully!\n');

  // Log current status
  log('Worker is now running. Press Ctrl+C to stop.\n');
  log('Next scheduled executions:');
  log('  • Guardrails: Every 15 minutes (next in ~15 min)');
  log('  • ATTOM Discovery: Daily at 6:00 AM UTC');
  log('  • Skip Tracing: Sundays at 7:00 AM UTC');
  log('  • Data Refresh: Daily at 8:00 AM UTC');
  log('  • Pipeline Monitoring: Daily at 9:00 AM UTC');
  log('  • Contractor Performance: Daily at 10:00 AM UTC\n');

  // Status update every hour
  cron.schedule('0 * * * *', () => {
    log('\n📊 Hourly Status Update:');
    const status = getWorkerStatus();
    log(`Uptime: ${Math.floor(status.uptime / 3600)}h ${Math.floor((status.uptime % 3600) / 60)}m`);
    log(`Total executions: ${status.workflows.reduce((sum, w) => sum + w.executionCount, 0)}`);

    const recentFailures = status.workflows.filter(
      w => w.lastStatus === 'error' && w.lastRun &&
      (Date.now() - new Date(w.lastRun).getTime()) < 3600000 // Last hour
    );

    if (recentFailures.length > 0) {
      warn(`⚠️  ${recentFailures.length} workflow(s) failed in the last hour`);
      recentFailures.forEach(w => {
        error(`   ${w.name}: ${w.lastError}`);
      });
    } else {
      success('✅ All workflows running smoothly');
    }
    log('');
  }, {
    timezone: 'UTC',
  });
}

// Start the worker
if (require.main === module) {
  startWorker();

  // Keep the process alive
  process.stdin.resume();
}

export { startWorker, getWorkerStatus, workflows };
