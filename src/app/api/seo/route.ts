import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET — list SEO articles for a site
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const siteId = url.searchParams.get("site_id");

  if (!siteId) {
    return Response.json({ error: "Missing site_id" }, { status: 400 });
  }

  const sql = getDb();

  const articles = await sql`
    SELECT sa.id, sa.title, sa.slug, sa.content, sa.topics, sa.word_count, sa.status, sa.created_at
    FROM seo_articles sa
    JOIN sites s ON s.id = sa.site_id
    WHERE sa.site_id = ${siteId} AND s.owner_id = ${session.user.id}
    ORDER BY sa.created_at DESC
  `;

  return Response.json({ articles });
}

// DELETE — remove an SEO article
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  const sql = getDb();

  await sql`
    DELETE FROM seo_articles sa
    USING sites s
    WHERE sa.id = ${id} AND sa.site_id = s.id AND s.owner_id = ${session.user.id}
  `;

  return Response.json({ success: true });
}
