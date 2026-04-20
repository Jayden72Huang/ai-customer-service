import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { url, api_key } = await req.json();

  if (!url) {
    return Response.json({ ok: false, message: "Please enter a URL" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AICSBot/1.0)",
        "Accept": "text/html",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      return Response.json({
        ok: false,
        message: `Could not reach ${url} (HTTP ${res.status}). Make sure the URL is correct.`,
      });
    }

    const html = await res.text();

    // Check for widget.js
    const hasWidget = html.includes("widget.js");
    const hasApiKey = api_key ? html.includes(api_key) : false;

    if (hasWidget && hasApiKey) {
      return Response.json({
        ok: true,
        message: "Widget is installed and configured correctly!",
      });
    } else if (hasWidget) {
      return Response.json({
        ok: true,
        message: "Widget script found, but could not verify API key. It may still work — try visiting your site.",
      });
    } else {
      return Response.json({
        ok: false,
        message: "Widget script not found on the page. Make sure you added the <script> tag and deployed your changes.",
      });
    }
  } catch {
    return Response.json({
      ok: false,
      message: "Could not reach the URL. Check that the domain is correct and publicly accessible.",
    });
  }
}
