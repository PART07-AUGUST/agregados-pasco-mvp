import { AUTH_SECURITY_CONFIG, AUTH_STORAGE_KEYS } from '../../../shared/constants/authConstants';

interface RateLimitData {
  attempts: number;
  lockedUntil: number | null;
}

function getStoredData(): RateLimitData {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEYS.LOGIN_RATE_LIMIT);
    if (!raw) {
      return { attempts: 0, lockedUntil: null };
    }
    return JSON.parse(raw) as RateLimitData;
  } catch {
    return { attempts: 0, lockedUntil: null };
  }
}

function saveStoredData(data: RateLimitData): void {
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEYS.LOGIN_RATE_LIMIT, JSON.stringify(data));
  } catch {
    // SessionStorage unavailable fallback
  }
}

export const loginRateLimiter = {
  getLockStatus(): { isLocked: boolean; remainingSeconds: number; attempts: number } {
    const data = getStoredData();
    const now = Date.now();

    if (data.lockedUntil && data.lockedUntil > now) {
      const remainingSeconds = Math.ceil((data.lockedUntil - now) / 1000);
      return { isLocked: true, remainingSeconds, attempts: data.attempts };
    }

    if (data.lockedUntil && data.lockedUntil <= now) {
      this.reset();
      return { isLocked: false, remainingSeconds: 0, attempts: 0 };
    }

    return { isLocked: false, remainingSeconds: 0, attempts: data.attempts };
  },

  recordFailure(): { isLocked: boolean; remainingSeconds: number; attempts: number } {
    const data = getStoredData();
    const newAttempts = data.attempts + 1;
    let lockedUntil = data.lockedUntil;

    if (newAttempts >= AUTH_SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      lockedUntil = Date.now() + AUTH_SECURITY_CONFIG.LOCKOUT_DURATION_MS;
    }

    const updatedData: RateLimitData = {
      attempts: newAttempts,
      lockedUntil,
    };

    saveStoredData(updatedData);

    const remainingSeconds = lockedUntil ? Math.ceil((lockedUntil - Date.now()) / 1000) : 0;
    return {
      isLocked: newAttempts >= AUTH_SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS,
      remainingSeconds: Math.max(0, remainingSeconds),
      attempts: newAttempts,
    };
  },

  reset(): void {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEYS.LOGIN_RATE_LIMIT);
    } catch {
      // SessionStorage unavailable fallback
    }
  },
};
