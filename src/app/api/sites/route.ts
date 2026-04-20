import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET — list current user's sites
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();
  const sites = await sql`
    SELECT * FROM sites WHERE owner_id = ${session.user.id} ORDER BY created_at DESC
  `;

  return Response.json({ sites });
}

// POST — create a new site
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, domain, settings } = await req.json();

  if (!name) {
    return Response.json({ error: "Site name is required" }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`
    INSERT INTO sites (name, domain, owner_id, settings)
    VALUES (${name}, ${domain || null}, ${session.user.id}, ${JSON.stringify(settings || {})})
    RETURNING *
  `;

  return Response.json({ site: rows[0] });
}

// PUT — update a site
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, name, domain, settings } = await req.json();

  if (!id) {
    return Response.json({ error: "Missing site id" }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`
    UPDATE sites
    SET name = COALESCE(${name ?? null}, name),
        domain = COALESCE(${domain ?? null}, domain),
        settings = COALESCE(${settings ? JSON.stringify(settings) : null}::jsonb, settings)
    WHERE id = ${id} AND owner_id = ${session.user.id}
    RETURNING *
  `;

  if (rows.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ site: rows[0] });
}
