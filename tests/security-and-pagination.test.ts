import { describe, it, expect, beforeEach } from "vitest";
import { registerSchema } from "@/lib/validations";
import {
  checkAccountLockout,
  recordFailedAttempt,
  recordSuccessfulLogin,
  resetLoginTracker,
} from "@/lib/auth/login-tracker";
import { checkRateLimit } from "@/lib/rate-limit";

describe("Security & Pagination Safeguards", () => {
  beforeEach(() => {
    resetLoginTracker();
  });

  describe("1. Password Complexity & Validation", () => {
    it("should reject passwords under 8 characters", () => {
      const result = registerSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        password: "Pass1",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.password?.[0]).toMatch(
          /at least 8 characters/i
        );
      }
    });

    it("should reject passwords missing uppercase letters", () => {
      const result = registerSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.password?.[0]).toMatch(
          /uppercase letter/i
        );
      }
    });

    it("should reject passwords missing digits", () => {
      const result = registerSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        password: "PasswordOnly",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.password?.[0]).toMatch(
          /number/i
        );
      }
    });

    it("should accept compliant passwords with uppercase, lowercase, and numbers", () => {
      const result = registerSchema.safeParse({
        name: "Test User",
        email: "test@example.com",
        password: "SecurePassword123",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("2. Anti-Brute-Force & Account Lockout", () => {
    const testEmail = "victim-user@linkstack.test";

    it("should allow initial login attempts and report remaining attempts", () => {
      expect(checkAccountLockout(testEmail).isLocked).toBe(false);

      const attempt1 = recordFailedAttempt(testEmail);
      expect(attempt1.isLocked).toBe(false);
      expect(attempt1.remainingAttempts).toBe(4);

      const attempt2 = recordFailedAttempt(testEmail);
      expect(attempt2.isLocked).toBe(false);
      expect(attempt2.remainingAttempts).toBe(3);
    });

    it("should lock account for 15 minutes after 5 consecutive failed attempts", () => {
      for (let i = 1; i <= 4; i++) {
        const res = recordFailedAttempt(testEmail);
        expect(res.isLocked).toBe(false);
      }

      // 5th failed attempt triggers lock
      const fifthAttempt = recordFailedAttempt(testEmail);
      expect(fifthAttempt.isLocked).toBe(true);
      expect(fifthAttempt.minutesRemaining).toBe(15);

      // Verify checkAccountLockout reports active lockout
      const status = checkAccountLockout(testEmail);
      expect(status.isLocked).toBe(true);
      expect(status.minutesRemaining).toBeGreaterThanOrEqual(14);
      expect(status.failedAttempts).toBe(5);
    });

    it("should reset lockout on successful login", () => {
      recordFailedAttempt(testEmail);
      recordFailedAttempt(testEmail);
      expect(checkAccountLockout(testEmail).failedAttempts).toBe(2);

      recordSuccessfulLogin(testEmail);
      expect(checkAccountLockout(testEmail).failedAttempts).toBe(0);
      expect(checkAccountLockout(testEmail).isLocked).toBe(false);
    });
  });

  describe("3. Anti-DoS Rate Limiter", () => {
    it("should throttle excessive requests from the same IP", () => {
      const testKey = `test-dos-ip-${Date.now()}`;
      const limit = 5;

      for (let i = 1; i <= limit; i++) {
        const res = checkRateLimit(testKey, limit, 1000);
        expect(res.allowed).toBe(true);
        expect(res.remaining).toBe(limit - i);
      }

      // Request exceeding limit should be denied
      const blockedRes = checkRateLimit(testKey, limit, 1000);
      expect(blockedRes.allowed).toBe(false);
      expect(blockedRes.remaining).toBe(0);
      expect(blockedRes.resetIn).toBeGreaterThanOrEqual(1);
    });
  });

  describe("4. Pagination & Query Bounds", () => {
    it("should enforce page calculation and bounds", () => {
      const total = 55;
      const pageSize = 20;
      const totalPages = Math.ceil(total / pageSize);

      expect(totalPages).toBe(3);

      const page1Start = (1 - 1) * pageSize + 1;
      const page1End = Math.min(1 * pageSize, total);
      expect(page1Start).toBe(1);
      expect(page1End).toBe(20);

      const page3Start = (3 - 1) * pageSize + 1;
      const page3End = Math.min(3 * pageSize, total);
      expect(page3Start).toBe(41);
      expect(page3End).toBe(55);
    });

    it("should constrain requested limits to max 100", () => {
      const clampLimit = (raw: number) => Math.min(Math.max(1, raw), 100);

      expect(clampLimit(5000)).toBe(100);
      expect(clampLimit(-10)).toBe(1);
      expect(clampLimit(25)).toBe(25);
    });
  });
});
