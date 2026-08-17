import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "intracore",
    timestamp: new Date().toISOString(),
  });
}
