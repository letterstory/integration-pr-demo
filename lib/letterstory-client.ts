// Thin client for Letterstory's read-only integration API — no CMS connector
// involved, this app reads published content straight from Letterstory. See
// https://app.letterstory.com/docs/onboard/custom-front-end for the full guide.
//
// Requires LETTERSTORY_API_KEY (Settings -> API keys -> Create key, "Read
// articles" capability only). Keep this file server-side: a client-side-only
// app must call it from a server component or route handler, never ship the
// key to the browser.

const LETTERSTORY_API_BASE = "https://app.letterstory.com/api/integrations";

export type PublishedArticle = {
	article_id: string;
	title: string;
	slug: string | null;
	content: string;
	published_at: string;
};

function apiKey(): string {
	const key = process.env.LETTERSTORY_API_KEY;
	if (!key) throw new Error("LETTERSTORY_API_KEY is not set");
	return key;
}

async function get<T>(path: string, params: Record<string, string | undefined>): Promise<T> {
	const url = new URL(LETTERSTORY_API_BASE + path);
	for (const [key, value] of Object.entries(params)) {
		if (value) url.searchParams.set(key, value);
	}
	const res = await fetch(url, { headers: { "x-integrations-key": apiKey() }, cache: "no-store" });
	if (!res.ok) throw new Error("Letterstory API request failed: " + res.status);
	return res.json() as Promise<T>;
}

/** Every published article, newest first. Paginate with cursor/next_cursor once has_more is true. */
export function listPublished(options: { format?: "html" | "md"; cursor?: string } = {}) {
	return get<{ items: PublishedArticle[]; count: number; has_more: boolean; next_cursor: string | null }>(
		"/published",
		{ format: options.format, cursor: options.cursor }
	);
}

/** One published article by id or slug. */
export function getPublished(options: { articleId?: string; slug?: string; format?: "html" | "md" }) {
	if (!options.articleId && !options.slug) throw new Error("getPublished needs articleId or slug");
	return get<PublishedArticle>("/published", {
		article_id: options.articleId,
		slug: options.slug,
		format: options.format,
	});
}
