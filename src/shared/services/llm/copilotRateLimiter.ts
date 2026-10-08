const STORAGE_KEY = 'admin_copilot_daily_usage';
const MAX_DAILY_QUOTA = 25;

interface DailyUsageRecord {
  date: string;
  count: number;
}

export class CopilotRateLimiter {
  private static getTodayKey(): string {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  private static getRecord(): DailyUsageRecord {
    const today = this.getTodayKey();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { date: today, count: 0 };
      }
      const parsed = JSON.parse(raw) as DailyUsageRecord;
      if (parsed.date !== today) {
        return { date: today, count: 0 };
      }
      return parsed;
    } catch {
      return { date: today, count: 0 };
    }
  }

  private static saveRecord(record: DailyUsageRecord): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch (err: unknown) {
      console.warn('No se pudo guardar la cuota del copiloto:', err);
    }
  }

  static isRateLimitActive(): boolean {
    const mode = (import.meta.env.MODE as string) || '';
    return (
      import.meta.env.DEV ||
      mode === 'qa' ||
      mode === 'debug' ||
      import.meta.env.VITE_ENABLE_RATE_LIMIT === 'true'
    );
  }

  static getMaxDailyQuota(): number {
    return MAX_DAILY_QUOTA;
  }

  static getRemainingQuota(): number {
    const record = this.getRecord();
    return Math.max(0, MAX_DAILY_QUOTA - record.count);
  }

  static canMakeRequest(): boolean {
    return this.hasQuotaFor(1);
  }

  static hasQuotaFor(count: number): boolean {
    if (!this.isRateLimitActive()) {
      return true;
    }
    return this.getRemainingQuota() >= count;
  }

  static recordRequest(): void {
    this.recordRequests(1);
  }

  static recordRequests(count: number): void {
    if (!this.isRateLimitActive() || count <= 0) {
      return;
    }
    const record = this.getRecord();
    record.count += count;
    this.saveRecord(record);
  }
}

export const copilotRateLimiter = CopilotRateLimiter;
