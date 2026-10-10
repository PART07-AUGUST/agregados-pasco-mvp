export const AUTH_SECURITY_CONFIG = {
  INACTIVITY_TIMEOUT_MS: 15 * 60 * 1000,
  INACTIVITY_CHECK_INTERVAL_MS: 10_000,
  INACTIVITY_THROTTLE_MS: 5_000,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 60_000,
} as const;

export const AUTH_STORAGE_KEYS = {
  LAST_ACTIVITY: 'agregados_last_activity',
  LOGIN_RATE_LIMIT: 'agregados_login_rate_limit',
  REMEMBER_SESSION: 'agregados_remember_session',
} as const;
