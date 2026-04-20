import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET — list all document versions for a site
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

  const docs = await sql`
    SELECT id, title, version, source, changes_summary,
           LENGTH(content) as content_length, created_at
    FROM knowledge_documents
    WHERE site_id = ${siteId}
    ORDER BY version DESC
  `;

  // Get latest full document
  const latest = await sql`
    SELECT * FROM knowledge_documents
    WHERE site_id = ${siteId}
    ORDER BY version DESC LIMIT 1
  `;

  return Response.json({
    documents: docs,
    latest: latest.length > 0 ? latest[0] : null,
  });
}
