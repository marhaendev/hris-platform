import { EventEmitter } from 'events';

// Prevent multiple instances in development (Next.js HMR)
const globalForEvents = global as unknown as { eventEmitter: EventEmitter };
const globalEmitter = globalForEvents.eventEmitter || new EventEmitter();

if (process.env.NODE_ENV !== 'production') globalForEvents.eventEmitter = globalEmitter;

// Types for better clarity
export const EVENTS = {
    LEAVE_CREATED: 'leave:created',
    LEAVE_UPDATED: 'leave:updated',
    WHATSAPP_STATUS_CHANGED: 'whatsapp:status_changed',
};

export default globalEmitter;
