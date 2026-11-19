export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    public userMessage: string,
    public details?: any
  ) {
    super(userMessage);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(userMessage: string, details?: any) {
    super(400, 'VALIDATION_ERROR', userMessage, details);
  }
}

export class AuthError extends AppError {
  constructor(userMessage: string = 'Unauthorized access.') {
    super(401, 'UNAUTHORIZED', userMessage);
  }
}

export class RateLimitError extends AppError {
  constructor(userMessage: string = 'Too many requests. Please try again later.', public retryAfter?: number) {
    super(429, 'RATE_LIMIT_EXCEEDED', userMessage, { retryAfter });
  }
}

export class ExternalAPIError extends AppError {
  constructor(code: string, userMessage: string, details?: any) {
    super(502, code, userMessage, details);
  }
}

export class GeminiQuotaError extends AppError {
  constructor(userMessage: string = 'Gemini model rate limit reached. Evaluation runs on fallback engine.') {
    super(503, 'GEMINI_QUOTA_EXCEEDED', userMessage);
  }
}

export class InternalError extends AppError {
  constructor(userMessage: string = 'An unexpected error occurred.', details?: any) {
    super(500, 'INTERNAL_SERVER_ERROR', userMessage, details);
  }
}
