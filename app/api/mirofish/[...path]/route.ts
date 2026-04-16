import { NextResponse } from "next/server";
import { fetchMiroFish } from "@/lib/mirofish-client";

async function proxy(request: Request, params: { path: string[] }) {
  try {
    const path = params.path?.join("/");
    if (!path) {
      return NextResponse.json({ success: false, error: "Missing path" }, { status: 400 });
    }

    const upstreamPath = `/api/${path}${new URL(request.url).search}`;
    const headers = new Headers();
    const contentType = request.headers.get("content-type");

    if (contentType) {
      headers.set("content-type", contentType);
    }

    const init: RequestInit = {
      method: request.method,
      headers
    };

    if (!["GET", "HEAD"].includes(request.method)) {
      init.body = await request.text();
    }

    const response = await fetchMiroFish(upstreamPath, init);
    const responseType = response.headers.get("content-type") ?? "";

    if (responseType.includes("application/json")) {
      const json = await response.json();
      return NextResponse.json(json, { status: response.status });
    }

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: responseType ? { "content-type": responseType } : undefined
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Proxy request failed"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params);
}

export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params);
}

