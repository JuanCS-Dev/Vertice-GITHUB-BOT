import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

/**
 * Winston Logger Configuration
 *
 * Purpose: Structured logging with constitutional compliance
 * Constitutional Requirement: P4 Rastreabilidade Total
 *
 * Features:
 * - Structured JSON logging
 * - Multiple transports (console, file, error file)
 * - Log levels based on environment
 * - Correlation IDs for request tracing
 * - Constitutional compliance metadata
 */

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

export const winstonConfig: WinstonModuleOptions = {
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
  ),
  defaultMeta: {
    service: 'vertice-github-bot',
    environment: process.env.NODE_ENV || 'development',
    constitutionalCompliance: true,
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          const contextStr = context ? `[${context}]` : '';
          return `${timestamp} ${level} ${contextStr} ${message} ${metaStr}`;
        }),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 10,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
};
