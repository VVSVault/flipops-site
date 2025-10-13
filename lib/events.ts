import { prisma } from './prisma';
import { createHash } from 'crypto';
import * as jsonpatch from 'fast-json-patch';
import { logger } from './logger';

export interface EventPayload {
  dealId?: string;
  actor: string;
  artifact: string;
  action: string;
  before?: any;
  after?: any;
  metadata?: Record<string, any>;
}

/**
 * Computes a SHA-256 checksum for event integrity
 */
function computeChecksum(data: any): string {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(data));
  return hash.digest('hex');
}

/**
 * Writes an immutable event to the audit log
 */
export async function writeEvent({
  dealId,
  actor,
  artifact,
  action,
  before,
  after,
  metadata = {}
}: EventPayload): Promise<string> {
  try {
    // Compute JSON Patch diff if before and after are provided
    let diff: any = null;
    if (before && after) {
      diff = jsonpatch.compare(before, after);
    } else if (after && !before) {
      // Creation event
      diff = [{ op: 'add', path: '/', value: after }];
    } else if (before && !after) {
      // Deletion event
      diff = [{ op: 'remove', path: '/', value: before }];
    }

    // Compute checksum
    const eventData = {
      dealId,
      actor,
      artifact,
      action,
      diff,
      metadata,
      timestamp: new Date().toISOString()
    };
    const checksum = computeChecksum(eventData);

    // Write to database
    const event = await prisma.event.create({
      data: {
        dealId,
        actor,
        artifact,
        action,
        diff: diff || undefined,
        checksum
      }
    });

    logger.info({
      eventId: event.id,
      dealId,
      actor,
      artifact,
      action
    }, 'Event written successfully');

    return event.id;
  } catch (error) {
    logger.error({
      error,
      dealId,
      actor,
      artifact,
      action
    }, 'Failed to write event');
    throw error;
  }
}

/**
 * Wraps a mutation function with event logging and queue enqueuing
 */
export async function withEvent<T>(
  actor: string,
  artifact: string,
  action: string,
  mutateFn: () => Promise<T>,
  enqueueOptions?: {
    queue: string;
    payload: any;
  }
): Promise<{ result: T; eventId: string }> {
  let before: any = null;
  let result: T;
  let eventId: string;

  try {
    // Capture before state if updating
    if (action === 'UPDATE' || action === 'DELETE') {
      // This would need to be customized based on artifact type
      // For now, we'll let the caller handle before/after states
    }

    // Execute mutation
    result = await mutateFn();

    // Write event
    eventId = await writeEvent({
      actor,
      artifact,
      action,
      after: result
    });

    // Enqueue job if specified
    if (enqueueOptions) {
      const { enqueue } = await import('./queue');
      await enqueue(enqueueOptions.queue, {
        ...enqueueOptions.payload,
        eventId
      });
    }

    return { result, eventId };
  } catch (error) {
    logger.error({
      error,
      actor,
      artifact,
      action
    }, 'Failed to execute mutation with event');
    throw error;
  }
}

/**
 * Verifies event integrity by checking checksums
 */
export async function verifyEventIntegrity(eventId: string): Promise<boolean> {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return false;
    }

    const eventData = {
      dealId: event.dealId,
      actor: event.actor,
      artifact: event.artifact,
      action: event.action,
      diff: event.diff,
      metadata: {},
      timestamp: event.ts.toISOString()
    };

    const computedChecksum = computeChecksum(eventData);
    return computedChecksum === event.checksum;
  } catch (error) {
    logger.error({ error, eventId }, 'Failed to verify event integrity');
    return false;
  }
}

export default {
  writeEvent,
  withEvent,
  verifyEventIntegrity
};