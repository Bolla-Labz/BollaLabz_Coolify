// Last Modified: 2025-11-23 17:30
/**
 * Base error classes for the application
 * Extracted from backend with frontend adaptations
 *
 * These errors provide user-friendly messages and are designed for
 * both logging and user display
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(message: string, statusCode: number, isOperational = true, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication Errors (401)
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required. Please log in to access this resource.', details?: any) {
    super(message, 401, true, details);
    this.name = 'AuthenticationError';
  }
}

export class InvalidTokenError extends AuthenticationError {
  constructor(message = 'Your session has expired or is invalid. Please log in again.') {
    super(message);
    this.name = 'InvalidTokenError';
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(message = 'Your session has expired. Please log in again to continue.') {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor(message = 'The email or password you entered is incorrect. Please try again.') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}

/**
 * Authorization Errors (403)
 */
export class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to access this resource.', details?: any) {
    super(message, 403, true, details);
    this.name = 'AuthorizationError';
  }
}

export class InsufficientPermissionsError extends AuthorizationError {
  constructor(resourceType: string) {
    super(`You don't have permission to ${resourceType}. Please contact your administrator if you believe this is an error.`);
    this.name = 'InsufficientPermissionsError';
  }
}

/**
 * Resource Errors (404)
 */
export class NotFoundError extends AppError {
  constructor(resourceType: string, identifier?: string, details?: any) {
    const message = identifier
      ? `${resourceType} with identifier "${identifier}" was not found. Please verify the ID and try again.`
      : `The requested ${resourceType} was not found. It may have been deleted or never existed.`;
    super(message, 404, true, details);
    this.name = 'NotFoundError';
  }
}

export class AgentNotFoundError extends NotFoundError {
  constructor(agentId: string) {
    super('Agent', agentId, {
      suggestion: 'Check your agent list at /agents to see available agents.',
      agentId,
    });
    this.name = 'AgentNotFoundError';
  }
}

export class ConversationNotFoundError extends NotFoundError {
  constructor(conversationId: string) {
    super('Conversation', conversationId, {
      suggestion: 'This conversation may have been deleted or you may not have access to it.',
      conversationId,
    });
    this.name = 'ConversationNotFoundError';
  }
}

export class PhoneNumberNotFoundError extends NotFoundError {
  constructor(phoneNumberId: string) {
    super('Phone Number', phoneNumberId, {
      suggestion: 'Check your phone numbers at /numbers to see available numbers.',
      phoneNumberId,
    });
    this.name = 'PhoneNumberNotFoundError';
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(userId: string) {
    super('User', userId);
    this.name = 'UserNotFoundError';
  }
}

/**
 * Validation Errors (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, details);
    this.name = 'ValidationError';
  }
}

export class InvalidInputError extends ValidationError {
  constructor(field: string, issue: string, expectedFormat?: string) {
    const message = expectedFormat
      ? `Invalid ${field}: ${issue}. Expected format: ${expectedFormat}`
      : `Invalid ${field}: ${issue}`;
    super(message, { field, issue, expectedFormat });
    this.name = 'InvalidInputError';
  }
}

export class MissingFieldError extends ValidationError {
  constructor(field: string) {
    super(`Required field "${field}" is missing. Please provide this field and try again.`, { field });
    this.name = 'MissingFieldError';
  }
}

export class InvalidEmailError extends ValidationError {
  constructor(email?: string) {
    super(
      `The email address ${email ? `"${email}"` : 'provided'} is not valid. Please enter a valid email address (e.g., user@example.com).`,
      { email, expectedFormat: 'user@example.com' }
    );
    this.name = 'InvalidEmailError';
  }
}

export class WeakPasswordError extends ValidationError {
  constructor() {
    super(
      'Password does not meet security requirements. Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.',
      {
        requirements: [
          'At least 8 characters',
          'One uppercase letter (A-Z)',
          'One lowercase letter (a-z)',
          'One number (0-9)',
          'One special character (!@#$%^&*)',
        ],
      }
    );
    this.name = 'WeakPasswordError';
  }
}

export class InvalidPhoneNumberError extends ValidationError {
  constructor(phoneNumber?: string) {
    super(
      `The phone number ${phoneNumber ? `"${phoneNumber}"` : 'provided'} is not valid. Phone numbers must be in E.164 format.`,
      {
        phoneNumber,
        expectedFormat: '+12345678900',
        documentation: 'https://www.twilio.com/docs/glossary/what-e164',
      }
    );
    this.name = 'InvalidPhoneNumberError';
  }
}

/**
 * Conflict Errors (409)
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, true, details);
    this.name = 'ConflictError';
  }
}

export class DuplicateResourceError extends ConflictError {
  constructor(resourceType: string, field: string, value: string) {
    super(
      `A ${resourceType} with ${field} "${value}" already exists. Please use a different ${field} or update the existing resource.`,
      { resourceType, field, value }
    );
    this.name = 'DuplicateResourceError';
  }
}

export class EmailAlreadyExistsError extends ConflictError {
  constructor(email: string) {
    super(
      `An account with email "${email}" already exists. If this is your account, try logging in instead.`,
      {
        email,
        suggestion: 'Use the login page or password reset if you forgot your password.',
      }
    );
    this.name = 'EmailAlreadyExistsError';
  }
}

export class PhoneNumberInUseError extends ConflictError {
  constructor(phoneNumber: string) {
    super(
      `Phone number "${phoneNumber}" is already assigned to another agent. Please choose a different number or unassign it from the current agent.`,
      { phoneNumber }
    );
    this.name = 'PhoneNumberInUseError';
  }
}

/**
 * Rate Limit Errors (429)
 */
export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    const message = retryAfter
      ? `Too many requests. Please wait ${retryAfter} seconds before trying again.`
      : 'Too many requests. Please slow down and try again in a few moments.';
    super(message, 429, true, { retryAfter });
    this.name = 'RateLimitError';
  }
}

/**
 * External Service Errors (502/503)
 */
export class ExternalServiceError extends AppError {
  constructor(serviceName: string, message?: string) {
    const errorMessage =
      message ||
      `Unable to connect to ${serviceName}. This is a temporary issue. Please try again in a few moments.`;
    super(errorMessage, 503, true, { serviceName });
    this.name = 'ExternalServiceError';
  }
}

export class TwilioError extends ExternalServiceError {
  constructor(message?: string) {
    super('Twilio', message || 'Failed to communicate with Twilio phone service. Please try again later.');
    this.name = 'TwilioError';
  }
}

export class VapiError extends ExternalServiceError {
  constructor(message?: string) {
    super('VAPI', message || 'Failed to communicate with VAPI voice AI service. Please try again later.');
    this.name = 'VapiError';
  }
}

/**
 * Business Logic Errors (422)
 */
export class BusinessLogicError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 422, true, details);
    this.name = 'BusinessLogicError';
  }
}

export class InactiveAgentError extends BusinessLogicError {
  constructor(agentId: string) {
    super(
      `Agent "${agentId}" is currently inactive and cannot process calls. Please activate the agent first.`,
      { agentId, suggestion: 'Go to the agent settings and toggle "Active" to enable it.' }
    );
    this.name = 'InactiveAgentError';
  }
}

export class ConversationInProgressError extends BusinessLogicError {
  constructor(conversationId: string) {
    super(
      `Conversation "${conversationId}" is still in progress. You cannot delete or modify an active conversation.`,
      { conversationId, suggestion: 'Wait for the conversation to complete or end it manually first.' }
    );
    this.name = 'ConversationInProgressError';
  }
}

export class InsufficientCreditsError extends BusinessLogicError {
  constructor(required: number, available: number) {
    super(
      `Insufficient credits. This action requires ${required} credits but you only have ${available} available. Please add more credits to continue.`,
      { required, available, suggestion: 'Visit the billing page to add credits to your account.' }
    );
    this.name = 'InsufficientCreditsError';
  }
}

/**
 * Helper function to check if error is operational
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}
