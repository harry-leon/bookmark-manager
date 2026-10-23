import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validations";
import { recordSuccessfulLogin } from "@/lib/auth/login-tracker";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { token, email, password } = result.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Find token record
    const resetRecord = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetRecord || resetRecord.email.toLowerCase() !== normalizedEmail) {
      return NextResponse.json(
        { error: "Invalid or expired password reset link" },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > resetRecord.expiresAt) {
      // Invalidate expired token
      await db.passwordResetToken.delete({
        where: { id: resetRecord.id },
      });
      return NextResponse.json(
        { error: "Password reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    // Hash new password with 12 salt rounds
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password & delete used token in transaction
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      db.passwordResetToken.delete({
        where: { id: resetRecord.id },
      }),
    ]);

    // Clear any active brute-force lockouts for this user
    recordSuccessfulLogin(normalizedEmail);

    return NextResponse.json({
      success: true,
      message: "Your password has been reset successfully. You can now log in.",
    });
  } catch (err: unknown) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
