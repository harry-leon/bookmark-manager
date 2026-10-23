import { describe, it, expect } from "vitest";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations";
import bcrypt from "bcryptjs";

describe("Password Management Schemas", () => {
  describe("changePasswordSchema", () => {
    it("should accept valid password change payload", () => {
      const payload = {
        currentPassword: "OldPassword123!",
        newPassword: "NewSecurePassword456!",
        confirmPassword: "NewSecurePassword456!",
      };
      const res = changePasswordSchema.safeParse(payload);
      expect(res.success).toBe(true);
    });

    it("should reject when new password is identical to current password", () => {
      const payload = {
        currentPassword: "SamePassword123!",
        newPassword: "SamePassword123!",
        confirmPassword: "SamePassword123!",
      };
      const res = changePasswordSchema.safeParse(payload);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.errors[0]?.message).toContain("different from current password");
      }
    });

    it("should reject when confirm password does not match", () => {
      const payload = {
        currentPassword: "OldPassword123!",
        newPassword: "NewPassword123!",
        confirmPassword: "DifferentPassword123!",
      };
      const res = changePasswordSchema.safeParse(payload);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.errors[0]?.message).toContain("do not match");
      }
    });

    it("should reject passwords that fail complexity rules", () => {
      // Missing uppercase
      expect(
        changePasswordSchema.safeParse({
          currentPassword: "OldPassword123!",
          newPassword: "password123!",
          confirmPassword: "password123!",
        }).success
      ).toBe(false);

      // Missing number
      expect(
        changePasswordSchema.safeParse({
          currentPassword: "OldPassword123!",
          newPassword: "PasswordNoNumber!",
          confirmPassword: "PasswordNoNumber!",
        }).success
      ).toBe(false);

      // Too short (< 8 chars)
      expect(
        changePasswordSchema.safeParse({
          currentPassword: "OldPassword123!",
          newPassword: "Pass1!",
          confirmPassword: "Pass1!",
        }).success
      ).toBe(false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("should accept valid email", () => {
      expect(
        forgotPasswordSchema.safeParse({ email: "user@example.com" }).success
      ).toBe(true);
    });

    it("should reject invalid email format", () => {
      expect(
        forgotPasswordSchema.safeParse({ email: "invalid-email" }).success
      ).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    it("should accept valid reset payload", () => {
      const payload = {
        token: "f0a8d927c3e1b4a5",
        email: "user@example.com",
        password: "BrandNewPassword789!",
        confirmPassword: "BrandNewPassword789!",
      };
      const res = resetPasswordSchema.safeParse(payload);
      expect(res.success).toBe(true);
    });

    it("should reject when passwords do not match", () => {
      const payload = {
        token: "f0a8d927c3e1b4a5",
        email: "user@example.com",
        password: "BrandNewPassword789!",
        confirmPassword: "MismatchedPassword789!",
      };
      const res = resetPasswordSchema.safeParse(payload);
      expect(res.success).toBe(false);
    });
  });

  describe("bcrypt Hashing & Verification (12 salt rounds)", () => {
    it("should hash and verify passwords with 12 rounds", async () => {
      const rawPassword = "TestPassword123!";
      const hash = await bcrypt.hash(rawPassword, 12);

      expect(hash).toBeDefined();
      expect(hash.startsWith("$2a$12$") || hash.startsWith("$2b$12$")).toBe(true);

      const isValid = await bcrypt.compare(rawPassword, hash);
      expect(isValid).toBe(true);

      const isInvalid = await bcrypt.compare("WrongPassword123!", hash);
      expect(isInvalid).toBe(false);
    });
  });
});
