import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET — list conversations for authenticated site owner
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();
  const url = new URL(req.url);
  const siteId = url.searchParams.get("site_id");
  const status = url.searchParams.get("status");
  const needsHuman = url.searchParams.get("needs_human");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  // Build query dynamically
  let conversations;
  if (siteId && status && needsHuman === "true") {
    conversations = await sql`
      SELECT c.*, json_agg(json_build_object('id', m.id, 'role', m.role, 'content', m.content, 'created_at', m.created_at) ORDER BY m.created_at) AS messages
      FROM conversations c
      JOIN sites s ON s.id = c.site_id AND s.owner_id = ${session.user.id}
      LEFT JOIN messages m ON m.conversation_id = c.id
      WHERE c.site_id = ${siteId} AND c.status = ${status} AND c.needs_human = true
      GROUP BY c.id ORDER BY c.updated_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (siteId && needsHuman === "true") {
    conversations = await sql`
      SELECT c.*, json_agg(json_build_object('id', m.id, 'role', m.role, 'content', m.content, 'created_at', m.created_at) ORDER BY m.created_at) AS messages
      FROM conversations c
      JOIN sites s ON s.id = c.site_id AND s.owner_id = ${session.user.id}
      LEFT JOIN messages m ON m.conversation_id = c.id
      WHERE c.site_id = ${siteId} AND c.needs_human = true
      GROUP BY c.id ORDER BY c.updated_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (siteId && status) {
    conversations = await sql`
      SELECT c.*, json_agg(json_build_object('id', m.id, 'role', m.role, 'content', m.content, 'created_at', m.created_at) ORDER BY m.created_at) AS messages
      FROM conversations c
      JOIN sites s ON s.id = c.site_id AND s.owner_id = ${session.user.id}
      LEFT JOIN messages m ON m.conversation_id = c.id
      WHERE c.site_id = ${siteId} AND c.status = ${status}
      GROUP BY c.id ORDER BY c.updated_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (siteId) {
    conversations = await sql`
      SELECT c.*, json_agg(json_build_object('id', m.id, 'role', m.role, 'content', m.content, 'created_at', m.created_at) ORDER BY m.created_at) AS messages
      FROM conversations c
      JOIN sites s ON s.id = c.site_id AND s.owner_id = ${session.user.id}
      LEFT JOIN messages m ON m.conversation_id = c.id
      WHERE c.site_id = ${siteId}
      GROUP BY c.id ORDER BY c.updated_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  } else {
    conversations = await sql`
      SELECT c.*, json_agg(json_build_object('id', m.id, 'role', m.role, 'content', m.content, 'created_at', m.created_at) ORDER BY m.created_at) AS messages
      FROM conversations c
      JOIN sites s ON s.id = c.site_id AND s.owner_id = ${session.user.id}
      LEFT JOIN messages m ON m.conversation_id = c.id
      GROUP BY c.id ORDER BY c.updated_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  }

  return Response.json({ conversations, total: conversations.length, page, limit });
}

// POST — admin reply to a conversation
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversation_id, content, resolve } = await req.json();

  if (!conversation_id || !content) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const sql = getDb();

  // Verify ownership
  const check = await sql`
    SELECT c.id FROM conversations c
    JOIN sites s ON s.id = c.site_id
    WHERE c.id = ${conversation_id} AND s.owner_id = ${session.user.id}
  `;

  if (check.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Insert admin message
  await sql`
    INSERT INTO messages (conversation_id, role, content)
    VALUES (${conversation_id}, 'admin', ${content})
  `;

  // Optionally resolve
  if (resolve) {
    await sql`
      UPDATE conversations
      SET status = 'resolved', needs_human = false
      WHERE id = ${conversation_id}
    `;
  }

  return Response.json({ success: true });
}
