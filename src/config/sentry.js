import * as Sentry from '@sentry/node';
import logger from '../utils/logger.js';

export const initSentry = () => {
  if (!process.env.SENTRY_DSN) {
    logger.warn('Sentry DSN not found — error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });

  logger.info('Sentry initialized for error tracking');
};

export default Sentry;