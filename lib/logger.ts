import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Create logger instance with appropriate configuration
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  // Disabled transport to avoid worker thread issues in Next.js
  // transport: isDevelopment && !isTest
  //   ? {
  //       target: 'pino-pretty',
  //       options: {
  //         colorize: true,
  //         translateTime: 'SYS:standard',
  //         ignore: 'pid,hostname',
  //       },
  //     }
  //   : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  serializers: {
    error: pino.stdSerializers.err,
  },
  base: {
    env: process.env.NODE_ENV,
  },
});

// Helper function to create child loggers with context
export function createLogger(context: string) {
  return logger.child({ context });
}

// Middleware for Next.js API routes
export function loggerMiddleware(handler: any) {
  return async (req: any, res: any) => {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    // Add request ID to request object
    req.requestId = requestId;

    // Create child logger with request context
    req.log = logger.child({
      requestId,
      method: req.method,
      url: req.url,
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    });

    // Log request
    req.log.info('Request received');

    // Wrap response.end to log response
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const duration = Date.now() - start;
      req.log.info({
        statusCode: res.statusCode,
        duration,
      }, 'Request completed');
      originalEnd.apply(res, args);
    };

    try {
      await handler(req, res);
    } catch (error) {
      const duration = Date.now() - start;
      req.log.error({
        error,
        statusCode: 500,
        duration,
      }, 'Request failed');

      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal server error',
          requestId,
        });
      }
    }
  };
}

export default logger;