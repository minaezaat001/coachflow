import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "CoachFlow",
    short_name: "CoachFlow",
    description: "منصة متكاملة لإدارة النوادي الرياضية والمدربين الشخصيين",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    orientation: "portrait-primary",
    icons: [
      { src: "/assets/logo.png", sizes: "192x192", type: "image/png" },
      { src: "/assets/logo.png", sizes: "512x512", type: "image/png" },
    ],
  });
}
