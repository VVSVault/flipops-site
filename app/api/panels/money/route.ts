import { NextRequest, NextResponse } from "next/server";
import { buildMoneyPanel } from "../../../../lib/panels";
import { etagFor } from "../../../../lib/panel-utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dealId = searchParams.get("dealId");

  if (!dealId) {
    return NextResponse.json(
      { error: "dealId is required" },
      { status: 422 }
    );
  }

  try {
    const data = await buildMoneyPanel(dealId);
    const etag = etagFor(data);
    const payload = { ...data, eventId: `evt_${etag}` };

    const res = NextResponse.json(payload, { status: 200 });
    res.headers.set("ETag", etag);
    res.headers.set("Cache-Control", "public, max-age=15");

    return res;
  } catch (error: any) {
    console.error("Money panel error:", error);

    // Return 404 for "not found" errors, 500 for others
    const isNotFound = error.message?.includes("not found") || error.message?.includes("missing");
    return NextResponse.json(
      { error: error.message || "Internal error" },
      { status: isNotFound ? 404 : 500 }
    );
  }
}