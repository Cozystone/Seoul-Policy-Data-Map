import { NextResponse } from "next/server";
import { fetchSeoulRealtime } from "@/lib/seoul-realtime";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const area = url.searchParams.get("area") ?? undefined;
  const snapshot = await fetchSeoulRealtime(area);

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"
    }
  });
}
