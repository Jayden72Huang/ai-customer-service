import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET — list knowledge entries for a site
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

  const entries = await sql`
    SELECT ke.* FROM knowledge_entries ke
    JOIN sites s ON s.id = ke.site_id
    WHERE ke.site_id = ${siteId} AND s.owner_id = ${session.user.id}
    ORDER BY ke.created_at DESC
  `;

  return Response.json({ entries });
}

// POST — add knowledge entry (single or CSV batch)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { site_id, entries, entry } = body;

  if (!site_id) {
    return Response.json({ error: "Missing site_id" }, { status: 400 });
  }

  const sql = getDb();

  // Verify ownership
  const check = await sql`SELECT id FROM sites WHERE id = ${site_id} AND owner_id = ${session.user.id}`;
  if (check.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Batch import (from CSV)
  if (entries && Array.isArray(entries)) {
    let imported = 0;
    for (const e of entries) {
      await sql`
        INSERT INTO knowledge_entries (site_id, question, answer, category, source)
        VALUES (${site_id}, ${e.question}, ${e.answer}, ${e.category || "general"}, 'csv_import')
      `;
      imported++;
    }
    return Response.json({ imported });
  }

  // Single entry
  if (entry) {
    const rows = await sql`
      INSERT INTO knowledge_entries (site_id, question, answer, category, source)
      VALUES (${site_id}, ${entry.question}, ${entry.answer}, ${entry.category || "general"}, 'manual')
      RETURNING *
    `;
    return Response.json({ entry: rows[0] });
  }

  return Response.json({ error: "Missing entry or entries" }, { status: 400 });
}

// PUT — update a knowledge entry
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, question, answer, category, enabled } = await req.json();

  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  const sql = getDb();

  const rows = await sql`
    UPDATE knowledge_entries ke
    SET question = COALESCE(${question ?? null}, ke.question),
        answer = COALESCE(${answer ?? null}, ke.answer),
        category = COALESCE(${category ?? null}, ke.category),
        enabled = COALESCE(${enabled ?? null}, ke.enabled)
    FROM sites s
    WHERE ke.id = ${id} AND ke.site_id = s.id AND s.owner_id = ${session.user.id}
    RETURNING ke.*
  `;

  if (rows.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ entry: rows[0] });
}

// DELETE — remove a knowledge entry
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
    DELETE FROM knowledge_entries ke
    USING sites s
    WHERE ke.id = ${id} AND ke.site_id = s.id AND s.owner_id = ${session.user.id}
  `;

  return Response.json({ success: true });
}
