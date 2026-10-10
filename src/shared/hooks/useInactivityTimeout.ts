import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { AUTH_SECURITY_CONFIG, AUTH_STORAGE_KEYS } from '../constants/authConstants';

export function useInactivityTimeout(timeoutMs: number = AUTH_SECURITY_CONFIG.INACTIVITY_TIMEOUT_MS) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const lastRecordedRef = useRef<number>(0);

  useEffect(() => {
    if (!user) {
      return;
    }

    lastRecordedRef.current = Date.now();

    const recordActivity = () => {
      const now = Date.now();
      if (now - lastRecordedRef.current > AUTH_SECURITY_CONFIG.INACTIVITY_THROTTLE_MS) {
        lastRecordedRef.current = now;
        try {
          localStorage.setItem(AUTH_STORAGE_KEYS.LAST_ACTIVITY, now.toString());
        } catch {
          // Storage unavailable fallback
        }
      }
    };

    recordActivity();

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((event) => {
      window.addEventListener(event, recordActivity, { passive: true });
    });

    const intervalId = window.setInterval(() => {
      let lastActivity = Date.now();
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEYS.LAST_ACTIVITY);
        if (stored) {
          lastActivity = parseInt(stored, 10);
        }
      } catch {
        lastActivity = lastRecordedRef.current;
      }

      if (Date.now() - lastActivity > timeoutMs) {
        try {
          localStorage.removeItem(AUTH_STORAGE_KEYS.LAST_ACTIVITY);
        } catch {
          // Storage unavailable fallback
        }
        void logout().finally(() => {
          navigate('/login?reason=inactivity', { replace: true });
        });
      }
    }, AUTH_SECURITY_CONFIG.INACTIVITY_CHECK_INTERVAL_MS);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, recordActivity);
      });
      window.clearInterval(intervalId);
    };
  }, [user, logout, navigate, timeoutMs]);
}
