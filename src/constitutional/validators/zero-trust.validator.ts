import { Injectable, Logger } from '@nestjs/common';
import { validate as uuidValidate } from 'uuid';

/**
 * Zero Trust Input Validator
 *
 * Purpose: Validate all inputs with zero trust principle
 * Constitutional Requirement: P1 Completude + P2 Validação Preventiva
 * Article III: Zero Trust - Never trust, always verify
 *
 * Validates: Type safety, nullability, format, length, patterns
 * No assumptions, all inputs validated before processing
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: unknown;
}

export interface StringValidationOptions {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  allowEmpty?: boolean;
  trim?: boolean;
}

export interface NumberValidationOptions {
  min?: number;
  max?: number;
  integer?: boolean;
  positive?: boolean;
}

export interface ArrayValidationOptions {
  minLength?: number;
  maxLength?: number;
  itemValidator?: (item: unknown) => ValidationResult;
}

@Injectable()
export class ZeroTrustValidator {
  private readonly logger = new Logger(ZeroTrustValidator.name);

  /**
   * Validate string input with comprehensive checks
   * P2: Validação Preventiva - catch issues before processing
   */
  validateString(
    value: unknown,
    fieldName: string,
    options: StringValidationOptions = {},
  ): ValidationResult {
    const errors: string[] = [];

    if (value === null || value === undefined) {
      if (!options.allowEmpty) {
        errors.push(`${fieldName} is required`);
      }
      return { valid: errors.length === 0, errors };
    }

    if (typeof value !== 'string') {
      errors.push(`${fieldName} must be a string`);
      return { valid: false, errors };
    }

    let sanitized = options.trim ? value.trim() : value;

    if (!options.allowEmpty && sanitized.length === 0) {
      errors.push(`${fieldName} cannot be empty`);
    }

    if (options.minLength !== undefined && sanitized.length < options.minLength) {
      errors.push(`${fieldName} must be at least ${options.minLength} characters`);
    }

    if (options.maxLength !== undefined && sanitized.length > options.maxLength) {
      errors.push(`${fieldName} must be at most ${options.maxLength} characters`);
    }

    if (options.pattern && !options.pattern.test(sanitized)) {
      errors.push(`${fieldName} format is invalid`);
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Validate number input with range checks
   */
  validateNumber(
    value: unknown,
    fieldName: string,
    options: NumberValidationOptions = {},
  ): ValidationResult {
    const errors: string[] = [];

    if (value === null || value === undefined) {
      errors.push(`${fieldName} is required`);
      return { valid: false, errors };
    }

    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (typeof num !== 'number' || isNaN(num)) {
      errors.push(`${fieldName} must be a valid number`);
      return { valid: false, errors };
    }

    if (options.integer && !Number.isInteger(num)) {
      errors.push(`${fieldName} must be an integer`);
    }

    if (options.positive && num <= 0) {
      errors.push(`${fieldName} must be positive`);
    }

    if (options.min !== undefined && num < options.min) {
      errors.push(`${fieldName} must be at least ${options.min}`);
    }

    if (options.max !== undefined && num > options.max) {
      errors.push(`${fieldName} must be at most ${options.max}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: num,
    };
  }

  /**
   * Validate boolean input
   */
  validateBoolean(value: unknown, fieldName: string): ValidationResult {
    const errors: string[] = [];

    if (value === null || value === undefined) {
      errors.push(`${fieldName} is required`);
      return { valid: false, errors };
    }

    if (typeof value === 'boolean') {
      return { valid: true, errors: [], sanitized: value };
    }

    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true') {
        return { valid: true, errors: [], sanitized: true };
      }
      if (lower === 'false') {
        return { valid: true, errors: [], sanitized: false };
      }
    }

    errors.push(`${fieldName} must be a boolean`);
    return { valid: false, errors };
  }

  /**
   * Validate array input with optional item validation
   */
  validateArray(
    value: unknown,
    fieldName: string,
    options: ArrayValidationOptions = {},
  ): ValidationResult {
    const errors: string[] = [];

    if (value === null || value === undefined) {
      errors.push(`${fieldName} is required`);
      return { valid: false, errors };
    }

    if (!Array.isArray(value)) {
      errors.push(`${fieldName} must be an array`);
      return { valid: false, errors };
    }

    if (options.minLength !== undefined && value.length < options.minLength) {
      errors.push(`${fieldName} must contain at least ${options.minLength} items`);
    }

    if (options.maxLength !== undefined && value.length > options.maxLength) {
      errors.push(`${fieldName} must contain at most ${options.maxLength} items`);
    }

    if (options.itemValidator) {
      value.forEach((item, index) => {
        const itemResult = options.itemValidator!(item);
        if (!itemResult.valid) {
          errors.push(`${fieldName}[${index}]: ${itemResult.errors.join(', ')}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: value,
    };
  }

  /**
   * Validate object has required keys
   */
  validateObject(
    value: unknown,
    fieldName: string,
    requiredKeys: string[],
  ): ValidationResult {
    const errors: string[] = [];

    if (value === null || value === undefined) {
      errors.push(`${fieldName} is required`);
      return { valid: false, errors };
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      errors.push(`${fieldName} must be an object`);
      return { valid: false, errors };
    }

    const obj = value as Record<string, unknown>;

    requiredKeys.forEach((key) => {
      if (!(key in obj)) {
        errors.push(`${fieldName}.${key} is required`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      sanitized: obj,
    };
  }

  /**
   * Validate email format
   */
  validateEmail(value: unknown, fieldName: string): ValidationResult {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const stringResult = this.validateString(value, fieldName, {
      minLength: 3,
      maxLength: 254,
      pattern: emailPattern,
      trim: true,
    });

    if (!stringResult.valid) {
      return stringResult;
    }

    return {
      valid: true,
      errors: [],
      sanitized: (stringResult.sanitized as string).toLowerCase(),
    };
  }

  /**
   * Validate URL format
   */
  validateUrl(value: unknown, fieldName: string): ValidationResult {
    const errors: string[] = [];

    const stringResult = this.validateString(value, fieldName, {
      minLength: 10,
      maxLength: 2048,
      trim: true,
    });

    if (!stringResult.valid) {
      return stringResult;
    }

    try {
      new URL(stringResult.sanitized as string);
      return {
        valid: true,
        errors: [],
        sanitized: stringResult.sanitized,
      };
    } catch {
      errors.push(`${fieldName} must be a valid URL`);
      return { valid: false, errors };
    }
  }

  /**
   * Validate UUID format
   */
  validateUuid(value: unknown, fieldName: string): ValidationResult {
    const errors: string[] = [];

    const stringResult = this.validateString(value, fieldName, {
      minLength: 36,
      maxLength: 36,
      trim: true,
    });

    if (!stringResult.valid) {
      return stringResult;
    }

    if (!uuidValidate(stringResult.sanitized as string)) {
      errors.push(`${fieldName} must be a valid UUID`);
      return { valid: false, errors };
    }

    return {
      valid: true,
      errors: [],
      sanitized: stringResult.sanitized,
    };
  }

  /**
   * Validate date input
   */
  validateDate(value: unknown, fieldName: string): ValidationResult {
    const errors: string[] = [];

    if (value === null || value === undefined) {
      errors.push(`${fieldName} is required`);
      return { valid: false, errors };
    }

    let date: Date;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value);
    } else {
      errors.push(`${fieldName} must be a valid date`);
      return { valid: false, errors };
    }

    if (isNaN(date.getTime())) {
      errors.push(`${fieldName} must be a valid date`);
      return { valid: false, errors };
    }

    return {
      valid: true,
      errors: [],
      sanitized: date,
    };
  }

  /**
   * Validate enum value
   */
  validateEnum<T extends string | number>(
    value: unknown,
    fieldName: string,
    allowedValues: T[],
  ): ValidationResult {
    const errors: string[] = [];

    if (value === null || value === undefined) {
      errors.push(`${fieldName} is required`);
      return { valid: false, errors };
    }

    if (!allowedValues.includes(value as T)) {
      errors.push(
        `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      );
      return { valid: false, errors };
    }

    return {
      valid: true,
      errors: [],
      sanitized: value,
    };
  }

  /**
   * Validate GitHub event type
   */
  validateGitHubEventType(value: unknown): ValidationResult {
    const allowedEvents = [
      'issues',
      'issue_comment',
      'pull_request',
      'pull_request_review',
      'pull_request_review_comment',
      'push',
      'create',
      'delete',
      'release',
      'ping',
    ];

    return this.validateEnum(value, 'eventType', allowedEvents);
  }

  /**
   * Validate repository full name (owner/repo)
   */
  validateRepositoryName(value: unknown): ValidationResult {
    const repoPattern = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/;

    return this.validateString(value, 'repository', {
      minLength: 3,
      maxLength: 255,
      pattern: repoPattern,
      trim: true,
    });
  }

  /**
   * Sanitize HTML to prevent XSS
   */
  sanitizeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate and sanitize JSON payload
   */
  validateJsonPayload(
    value: unknown,
    fieldName: string,
    maxSizeBytes: number = 1048576,
  ): ValidationResult {
    const errors: string[] = [];

    if (value === null || value === undefined) {
      errors.push(`${fieldName} is required`);
      return { valid: false, errors };
    }

    let parsed: unknown;

    if (typeof value === 'string') {
      if (value.length > maxSizeBytes) {
        errors.push(`${fieldName} exceeds maximum size of ${maxSizeBytes} bytes`);
        return { valid: false, errors };
      }

      try {
        parsed = JSON.parse(value);
      } catch {
        errors.push(`${fieldName} must be valid JSON`);
        return { valid: false, errors };
      }
    } else if (typeof value === 'object') {
      parsed = value;
    } else {
      errors.push(`${fieldName} must be an object or JSON string`);
      return { valid: false, errors };
    }

    return {
      valid: true,
      errors: [],
      sanitized: parsed,
    };
  }

  /**
   * Log validation failure for audit trail
   * P4: Rastreabilidade Total
   */
  logValidationFailure(
    fieldName: string,
    errors: string[],
    context?: Record<string, unknown>,
  ): void {
    this.logger.warn(
      `Validation failed for ${fieldName}: ${errors.join(', ')}`,
      context,
    );
  }
}
