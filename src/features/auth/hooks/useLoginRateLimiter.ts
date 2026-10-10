import { useState, useEffect, useCallback } from 'react';
import { loginRateLimiter } from '../services/loginRateLimiter';

export function useLoginRateLimiter() {
  const [status, setStatus] = useState(() => loginRateLimiter.getLockStatus());

  useEffect(() => {
    if (!status.isLocked) {
      return;
    }

    const interval = window.setInterval(() => {
      const current = loginRateLimiter.getLockStatus();
      setStatus(current);
      if (!current.isLocked) {
        window.clearInterval(interval);
      }
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [status.isLocked]);

  const recordFailedAttempt = useCallback(() => {
    const updated = loginRateLimiter.recordFailure();
    setStatus(updated);
  }, []);

  const resetAttempts = useCallback(() => {
    loginRateLimiter.reset();
    setStatus({ isLocked: false, remainingSeconds: 0, attempts: 0 });
  }, []);

  return {
    isLocked: status.isLocked,
    remainingSeconds: status.remainingSeconds,
    attempts: status.attempts,
    recordFailedAttempt,
    resetAttempts,
  };
}
