import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = process.env.UPSTREAM_API_BASE ?? "https://dev-interface.cournot.ai/play/polymarket";
const GET_TIMEOUT_MS = 30_000;
const POST_TIMEOUT_MS = 300_000; // 5 min for AI pipeline calls

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");
  const search = request.nextUrl.search;
  const url = `${UPSTREAM}/${path}${search}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GET_TIMEOUT_MS);

    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return NextResponse.json(
        { error: "Upstream request timed out" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upstream request failed" },
      { status: 502 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");
  const search = request.nextUrl.search;
  const url = `${UPSTREAM}/${path}${search}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), POST_TIMEOUT_MS);

    const body = await request.text();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return NextResponse.json(
        { error: "Upstream request timed out" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upstream request failed" },
      { status: 502 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");
  const search = request.nextUrl.search;
  const url = `${UPSTREAM}/${path}${search}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), POST_TIMEOUT_MS);

    const body = await request.text();
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return NextResponse.json(
        { error: "Upstream request timed out" },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upstream request failed" },
      { status: 502 }
    );
  }
}
