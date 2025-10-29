import { ConstitutionalValidation } from '../../constitutional/constitutional.service';

/**
 * Express Request Type Extension
 *
 * Purpose: Extend Express Request type with custom properties
 * Constitutional Requirement: Type safety (P1 Completude Obrigatória)
 *
 * Adds: constitutionalValidation property to Request interface
 */

declare global {
  namespace Express {
    interface Request {
      constitutionalValidation?: ConstitutionalValidation;
    }
  }
}

export {};
