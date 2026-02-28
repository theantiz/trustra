import { NextResponse } from "next/server";
import { simulateRandomTransactions } from "@/lib/trust";

export async function POST() {
  const result = simulateRandomTransactions();
  return NextResponse.json(result, { status: 200 });
}
