import { NextRequest, NextResponse } from "next/server";
import { readRunResult } from "@/lib/run-store";

export async function GET(req: NextRequest) {
    const eventId = req.nextUrl.searchParams.get("eventId");
    if (!eventId) {
        return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const result = readRunResult(eventId) as { executionLog: unknown[] } | null;
    if (result) {
        return NextResponse.json({ status: "Completed", executionLog: result.executionLog });
    }

    // Not saved yet: ask Inngest whether the run failed, otherwise report "Running"
    try {
        const res = await fetch(`http://localhost:8288/v1/events/${eventId}/runs`);
        if (res.ok) {
            const json = await res.json();
            const status = json?.data?.[0]?.status;
            if (status === "Failed" || status === "Cancelled") {
                return NextResponse.json({ status });
            }
        }
    } catch {
        // dev server unreachable: fall through and keep reporting "Running"
    }
    return NextResponse.json({ status: "Running" });
}