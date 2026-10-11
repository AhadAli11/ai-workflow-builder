import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest";

export async function POST(req: NextRequest) {
    const body = await req.json();

    const result = await inngest.send({
        name: "workflow/run",
        data: body,
    });

    return NextResponse.json({ eventId: result.ids[0] });
}