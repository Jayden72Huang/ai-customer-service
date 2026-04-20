import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

export const maxDuration = 30;

// POST — upload MD/TXT file as knowledge document
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const siteId = formData.get("site_id") as string | null;

  if (!file || !siteId) {
    return Response.json({ error: "Missing file or site_id" }, { status: 400 });
  }

  const sql = getDb();

  // Verify ownership
  const check = await sql`SELECT id FROM sites WHERE id = ${siteId} AND owner_id = ${session.user.id}`;
  if (check.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const content = await file.text();
  const title = file.name.replace(/\.(md|txt|markdown)$/i, "");

  if (content.length < 20) {
    return Response.json({ error: "File is too short" }, { status: 400 });
  }

  // Check if there's an existing document for this site
  const existing = await sql`
    SELECT id, version FROM knowledge_documents
    WHERE site_id = ${siteId}
    ORDER BY version DESC LIMIT 1
  `;

  const version = existing.length > 0 ? (existing[0].version as number) + 1 : 1;
  const parentId = existing.length > 0 ? existing[0].id : null;

  // Store the document
  const rows = await sql`
    INSERT INTO knowledge_documents (site_id, title, content, version, parent_id, source)
    VALUES (${siteId}, ${title}, ${content}, ${version}, ${parentId}, 'upload')
    RETURNING id, version
  `;

  return Response.json({
    document: rows[0],
    message: `Document "${title}" uploaded as v${version}`,
  });
}
