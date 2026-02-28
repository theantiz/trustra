import { NextResponse } from "next/server";
import { simulateMaliciousCluster } from "@/lib/trust";

export async function POST() {
  const result = simulateMaliciousCluster();
  return NextResponse.json(result, { status: 200 });
}
