"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export default function TestWidgetPage() {
  const [apiKey, setApiKey] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Try to get api_key from the user's site
    async function loadKey() {
      try {
        const res = await fetch("/api/sites");
        if (res.ok) {
          const data = await res.json();
          if (data.sites?.length > 0) {
            setApiKey(data.sites[0].api_key);
          }
        }
      } catch { /* ignore */ }
    }
    loadKey();
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 p-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Widget Test Page</h1>
        <p className="text-gray-600 mb-8">
          This page simulates your customer&apos;s website. Look at the bottom-right corner for the chat widget.
        </p>

        <div className="bg-gray-50 border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Test Scenarios</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">1.</span>
              <span>Click the blue chat bubble at the bottom-right</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">2.</span>
              <span>Say <code className="bg-gray-200 px-1 rounded">hello</code> — should get a normal AI reply</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">3.</span>
              <span>Say <code className="bg-gray-200 px-1 rounded">I want a refund</code> — should trigger human escalation (HIGH)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">4.</span>
              <span>Say <code className="bg-gray-200 px-1 rounded">there is a bug</code> — should trigger human escalation (NORMAL)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">5.</span>
              <span>Check <a href="/dashboard/conversations" className="text-blue-600 underline">Dashboard → Conversations</a> to see the chat logs</span>
            </li>
          </ul>
        </div>

        {!apiKey && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              No site found. Please <a href="/dashboard" className="underline font-medium">create a site</a> first, then come back here.
            </p>
          </div>
        )}

        {apiKey && (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm">
                Widget loaded with API key: <code className="bg-green-100 px-1 rounded">{apiKey.slice(0, 12)}...</code>
              </p>
            </div>

            <div className="bg-gray-50 border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-2">Sample Website Content</h2>
              <p className="text-gray-600 mb-4">
                Imagine this is your product page. Your customers would see the chat widget here and can ask questions about your product.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border rounded-lg p-4">
                  <div className="w-full h-24 bg-gray-200 rounded mb-3" />
                  <h3 className="font-medium">Product A</h3>
                  <p className="text-sm text-gray-500">$29/month</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <div className="w-full h-24 bg-gray-200 rounded mb-3" />
                  <h3 className="font-medium">Product B</h3>
                  <p className="text-sm text-gray-500">$49/month</p>
                </div>
              </div>
            </div>

            {!loaded && (
              <Script
                src="/widget.js"
                data-api-key={apiKey}
                strategy="afterInteractive"
                onLoad={() => setLoaded(true)}
                onError={() => {
                  // Fallback: manually create the widget element
                  const el = document.createElement("ai-chat-widget");
                  el.setAttribute("data-api-key", apiKey);
                  document.body.appendChild(el);
                  setLoaded(true);
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
