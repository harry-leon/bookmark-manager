import { Metadata } from "next";
import { LandingView } from "@/components/landing/landing-view";

export const metadata: Metadata = {
  title: "Introduction & Features — LinkStack",
  description:
    "Discover LinkStack: Developer-first hierarchical URL and bookmark manager organized by Packages & Sections with OWASP security and high performance.",
};

export default function IntroPage() {
  return <LandingView />;
}
