import { NextResponse } from "next/server";
import { getTrustById } from "@/lib/trust";

type Context = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(_: Request, context: Context) {
  const { userId } = await context.params;
  const result = getTrustById(userId);

  if (!result) {
    return NextResponse.json(
      { message: "User not found or insufficient data" },
      { status: 404 }
    );
  }

  return NextResponse.json(result, { status: 200 });
}
