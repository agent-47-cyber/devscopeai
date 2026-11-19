export interface LogPayload {
  requestId?: string;
  userId?: string;
  action: string;
  provider?: string;
  duration?: number;
  message?: string;
  error?: any;
  meta?: any;
}

export const logger = {
  info(payload: LogPayload) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      ...payload
    }));
  },

  warn(payload: LogPayload) {
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      ...payload
    }));
  },

  error(payload: LogPayload) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      ...payload,
      error: payload.error instanceof Error ? {
        message: payload.error.message,
        stack: payload.error.stack
      } : payload.error
    }));
  }
};
