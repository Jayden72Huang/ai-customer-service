import { getDb } from "./db";
import type { MembershipTier } from "./types";

export async function getUserMembership(userId: string): Promise<MembershipTier> {
  const sql = getDb();
  const rows = await sql`SELECT membership FROM users WHERE id = ${userId}`;
  return (rows[0]?.membership as MembershipTier) || "free";
}

export async function isPremiumUser(userId: string): Promise<boolean> {
  return (await getUserMembership(userId)) === "premium";
}

export async function isPremiumSite(siteId: string): Promise<boolean> {
  const sql = getDb();
  const rows = await sql`
    SELECT u.membership FROM users u
    JOIN sites s ON s.owner_id = u.id
    WHERE s.id = ${siteId}
  `;
  return rows.length > 0 && rows[0].membership === "premium";
}
