import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";

// GET — fetch widget config by api_key (public, used by embedded widget)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const apiKey = url.searchParams.get("api_key");

  if (!apiKey) {
    return Response.json({ error: "Missing api_key" }, { status: 400 });
  }

  const sql = getDb();

  const rows = await sql`
    SELECT id, name, settings FROM sites WHERE api_key = ${apiKey}
  `;

  if (rows.length === 0) {
    return Response.json({ error: "Invalid API key" }, { status: 401 });
  }

  const site = rows[0];
  const settings = site.settings as Record<string, unknown>;

  return Response.json(
    {
      site_id: site.id,
      name: site.name,
      color: settings.widget_color || "#2563eb",
      position: settings.widget_position || "bottom-right",
      welcome_message: settings.welcome_message || "Hi! How can I help you?",
      auto_detect_language: settings.auto_detect_language ?? true,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300",
      },
    }
  );
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
