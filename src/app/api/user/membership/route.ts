import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET — get current user's membership
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getDb();
  const rows = await sql`SELECT membership, membership_updated_at FROM users WHERE id = ${session.user.id}`;

  return Response.json({
    membership: rows[0]?.membership || "free",
    updated_at: rows[0]?.membership_updated_at || null,
  });
}

// POST — upgrade to premium (for demo/self-service; integrate Stripe later)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = await req.json();

  const sql = getDb();

  if (action === "upgrade") {
    await sql`
      UPDATE users SET membership = 'premium', membership_updated_at = now()
      WHERE id = ${session.user.id}
    `;
    return Response.json({ success: true, membership: "premium" });
  }

  if (action === "downgrade") {
    await sql`
      UPDATE users SET membership = 'free', membership_updated_at = now()
      WHERE id = ${session.user.id}
    `;
    return Response.json({ success: true, membership: "free" });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
