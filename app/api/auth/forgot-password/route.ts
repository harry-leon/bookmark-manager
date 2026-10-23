import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Invalid email" },
        { status: 400 }
      );
    }

    const email = result.data.email.trim().toLowerCase();

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    let devResetUrl: string | undefined = undefined;

    if (user) {
      // Generate 32-byte secure random hex token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Invalidate existing tokens for this email
      await db.passwordResetToken.deleteMany({
        where: { email },
      });

      // Save new reset token
      await db.passwordResetToken.create({
        data: {
          email,
          token,
          expiresAt,
        },
      });

      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

      // In development or when SMTP is not configured, expose dev link
      devResetUrl = resetUrl;
      console.log(`[PASSWORD RESET] Generated reset URL for ${email}: ${resetUrl}`);
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a password reset link has been dispatched.",
      devResetUrl: process.env.NODE_ENV !== "production" || !process.env.SMTP_HOST ? devResetUrl : undefined,
    });
  } catch (err: unknown) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
