import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET — fetch learning suggestions and stats
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

  // Verify ownership
  const check = await sql`SELECT id FROM sites WHERE id = ${siteId} AND owner_id = ${session.user.id}`;
  if (check.length === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Pending suggestions
  const suggestions = await sql`
    SELECT * FROM learning_suggestions
    WHERE site_id = ${siteId} AND status = 'pending'
    ORDER BY frequency DESC LIMIT 50
  `;

  // Stats
  const totalConv = await sql`SELECT COUNT(*)::int AS count FROM conversations WHERE site_id = ${siteId}`;
  const escalatedConv = await sql`SELECT COUNT(*)::int AS count FROM conversations WHERE site_id = ${siteId} AND needs_human = true`;
  const totalMsg = await sql`SELECT COUNT(*)::int AS count FROM interaction_logs WHERE site_id = ${siteId}`;

  const total = totalConv[0]?.count || 0;
  const escalated = escalatedConv[0]?.count || 0;

  // Category breakdown
  const categories = await sql`
    SELECT classification->>'category' AS category, COUNT(*)::int AS count
    FROM interaction_logs
    WHERE site_id = ${siteId} AND classification IS NOT NULL
    GROUP BY classification->>'category'
  `;

  const categoryBreakdown: Record<string, number> = {};
  categories.forEach((row) => {
    if (row.category) categoryBreakdown[row.category as string] = row.count as number;
  });

  return Response.json({
    suggestions,
    stats: {
      total_conversations: total,
      escalated,
      escalation_rate: total > 0 ? ((escalated / total) * 100).toFixed(1) + "%" : "0%",
      total_messages: totalMsg[0]?.count || 0,
      category_breakdown: categoryBreakdown,
    },
  });
}

// POST — approve or reject a learning suggestion
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { suggestion_id, action, site_id } = await req.json();

  if (!suggestion_id || !action) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const sql = getDb();

  if (action === "approve") {
    const rows = await sql`SELECT * FROM learning_suggestions WHERE id = ${suggestion_id}`;
    if (rows.length === 0) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const s = rows[0];

    // Add to knowledge base
    await sql`
      INSERT INTO knowledge_entries (site_id, question, answer, category, source)
      VALUES (${site_id || s.site_id}, ${s.suggested_question}, ${s.suggested_answer}, 'auto_learned', 'auto_learned')
    `;

    await sql`
      UPDATE learning_suggestions SET status = 'approved', reviewed_at = now() WHERE id = ${suggestion_id}
    `;

    return Response.json({ success: true, action: "approved" });
  }

  if (action === "reject") {
    await sql`
      UPDATE learning_suggestions SET status = 'rejected', reviewed_at = now() WHERE id = ${suggestion_id}
    `;
    return Response.json({ success: true, action: "rejected" });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
