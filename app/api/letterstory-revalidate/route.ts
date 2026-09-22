// Receives Letterstory's article.published / flow_run.completed webhook and
// revalidates this app's content. Registered via the set_webhook MCP tool
// (or Settings -> API keys), pointed at this route's URL.
//
// Only meaningful if you passed a webhook_secret to set_webhook: set
// LETTERSTORY_WEBHOOK_SECRET to the same value here to verify deliveries.
// Without a secret, any caller who finds this URL can trigger a revalidation
// (annoying, not a data leak) -- setting a secret is recommended.

import { createHmac, timingSafeEqual } from "crypto";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	const body = await request.text();

	const secret = process.env.LETTERSTORY_WEBHOOK_SECRET;
	if (secret) {
		const signature = request.headers.get("x-letterstory-signature") ?? "";
		const expected = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
		const signatureBuf = Buffer.from(signature);
		const expectedBuf = Buffer.from(expected);
		const valid = signatureBuf.length === expectedBuf.length && timingSafeEqual(signatureBuf, expectedBuf);
		if (!valid) return NextResponse.json({ error: "invalid signature" }, { status: 401 });
	}

	// TODO: revalidate whatever path(s) actually render published content.
	revalidatePath("/");

	return NextResponse.json({ revalidated: true });
}
