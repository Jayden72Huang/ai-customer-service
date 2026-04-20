import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();

  if (!email || !password) {
    return Response.json({ error: "Email and password required" }, { status: 400 });
  }

  const sql = getDb();

  // Check if user exists
  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    return Response.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await hash(password, 12);

  const rows = await sql`
    INSERT INTO users (email, password_hash, name)
    VALUES (${email}, ${passwordHash}, ${name || email.split("@")[0]})
    RETURNING id, email, name
  `;

  return Response.json({ user: rows[0] });
}
