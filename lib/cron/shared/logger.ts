/**
 * Logging utility for cron jobs
 * Provides consistent logging format across all workflows
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  workflow: string;
  message: string;
  data?: any;
}

const colors = {
  info: '\x1b[36m',    // Cyan
  warn: '\x1b[33m',    // Yellow
  error: '\x1b[31m',   // Red
  success: '\x1b[32m', // Green
  debug: '\x1b[90m',   // Gray
  reset: '\x1b[0m',
};

const icons = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
  success: '✅',
  debug: '🔍',
};

export class CronLogger {
  private workflowName: string;
  private startTime: number;

  constructor(workflowName: string) {
    this.workflowName = workflowName;
    this.startTime = Date.now();
  }

  private log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const duration = Date.now() - this.startTime;

    const logEntry: LogEntry = {
      timestamp,
      level,
      workflow: this.workflowName,
      message,
      data,
    };

    const color = colors[level];
    const icon = icons[level];
    const prefix = `${color}${icon} [${this.workflowName}]${colors.reset}`;

    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }

    // Log duration for success messages
    if (level === 'success') {
      console.log(`${colors.debug}⏱️  Duration: ${duration}ms${colors.reset}\n`);
    }

    return logEntry;
  }

  info(message: string, data?: any) {
    return this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    return this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    return this.log('error', message, data);
  }

  success(message: string, data?: any) {
    return this.log('success', message, data);
  }

  debug(message: string, data?: any) {
    if (process.env.DEBUG === 'true') {
      return this.log('debug', message, data);
    }
  }

  /**
   * Create a sub-logger for a specific step
   */
  step(stepName: string): CronLogger {
    return new CronLogger(`${this.workflowName} > ${stepName}`);
  }
}

/**
 * Create a logger for a workflow
 */
export function createLogger(workflowName: string): CronLogger {
  return new CronLogger(workflowName);
}
