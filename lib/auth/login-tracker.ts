/**
 * In-memory Login Security & Anti-Brute-Force Tracker
 *
 * Policies:
 * - Max 5 failed attempts per account/email.
 * - Lock duration: 15 minutes upon exceeding 5 failed attempts.
 * - Auto reset upon successful login.
 * - Cleanup of expired records every 5 minutes.
 */

interface AccountLockRecord {
  failedAttempts: number;
  lastAttemptAt: number;
  lockUntil: number | null;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const loginAttempts = new Map<string, AccountLockRecord>();

/**
 * Check if an account is currently locked out due to excessive failed attempts.
 */
export function checkAccountLockout(email: string): {
  isLocked: boolean;
  minutesRemaining: number;
  failedAttempts: number;
} {
  const normalized = email.trim().toLowerCase();
  const record = loginAttempts.get(normalized);

  if (!record || !record.lockUntil) {
    return {
      isLocked: false,
      minutesRemaining: 0,
      failedAttempts: record?.failedAttempts || 0,
    };
  }

  const now = Date.now();
  if (now >= record.lockUntil) {
    // Lock has expired; reset
    loginAttempts.delete(normalized);
    return {
      isLocked: false,
      minutesRemaining: 0,
      failedAttempts: 0,
    };
  }

  const msRemaining = record.lockUntil - now;
  const minutesRemaining = Math.max(1, Math.ceil(msRemaining / (60 * 1000)));

  return {
    isLocked: true,
    minutesRemaining,
    failedAttempts: record.failedAttempts,
  };
}

/**
 * Record a failed authentication attempt for an email.
 * If failed attempts reach or exceed MAX_FAILED_ATTEMPTS, locks account for 15 minutes.
 */
export function recordFailedAttempt(email: string): {
  isLocked: boolean;
  minutesRemaining: number;
  remainingAttempts: number;
} {
  const normalized = email.trim().toLowerCase();
  const now = Date.now();
  const record = loginAttempts.get(normalized) || {
    failedAttempts: 0,
    lastAttemptAt: now,
    lockUntil: null,
  };

  record.failedAttempts += 1;
  record.lastAttemptAt = now;

  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    record.lockUntil = now + LOCKOUT_DURATION_MS;
    loginAttempts.set(normalized, record);
    return {
      isLocked: true,
      minutesRemaining: 15,
      remainingAttempts: 0,
    };
  }

  loginAttempts.set(normalized, record);
  return {
    isLocked: false,
    minutesRemaining: 0,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - record.failedAttempts),
  };
}

/**
 * Clear lockout record on successful login.
 */
export function recordSuccessfulLogin(email: string): void {
  const normalized = email.trim().toLowerCase();
  loginAttempts.delete(normalized);
}

/**
 * Reset tracker (primarily for test environments).
 */
export function resetLoginTracker(): void {
  loginAttempts.clear();
}

// Background cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of loginAttempts.entries()) {
      if (record.lockUntil && now >= record.lockUntil) {
        loginAttempts.delete(key);
      } else if (!record.lockUntil && now - record.lastAttemptAt > 60 * 60 * 1000) {
        // Clear stale failed attempts older than 1 hour
        loginAttempts.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
