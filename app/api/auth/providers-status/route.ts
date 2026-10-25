import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasGoogle = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_CLIENT_ID.trim() !== "" &&
      !process.env.GOOGLE_CLIENT_ID.includes("your-google")
  );

  const githubId = process.env.GITHUB_ID || process.env.GITHUB_CLIENT_ID;
  const githubSecret = process.env.GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET;
  const hasGithub = Boolean(
    githubId &&
      githubSecret &&
      githubId.trim() !== "" &&
      !githubId.includes("your-github")
  );

  return NextResponse.json({
    google: hasGoogle,
    github: hasGithub,
  });
}
