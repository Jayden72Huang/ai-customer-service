"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, AlertCircle, Globe } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { translations, getStoredLocale, setStoredLocale } from "@/lib/i18n";

function createT(locale: Locale) {
  return (key: string) => translations[locale]?.[key] || translations.en[key] || key;
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locale, setLocaleState] = useState<Locale>("en");
  const router = useRouter();

  useEffect(() => {
    setLocaleState(getStoredLocale());
  }, []);

  const t = createT(locale);

  function toggleLocale() {
    const next = locale === "en" ? "zh" : "en";
    setLocaleState(next);
    setStoredLocale(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 6) {
      setError(t("register.password_error"));
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(t("register.sign_in_failed"));
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[#a1a1aa] hover:text-[#fafafa] transition-colors text-xs rounded-lg hover:bg-[#27272a]"
          >
            <Globe className="w-3.5 h-3.5" />
            {t("lang.switch")}
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#fafafa]">{t("register.title")}</h1>
          <p className="text-sm text-[#a1a1aa] mt-2">
            {t("register.subtitle")}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#18181b] border border-[#27272a] rounded-2xl p-8"
        >
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg text-sm text-[#ef4444]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#a1a1aa] mb-1">{t("register.name")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                placeholder={t("register.name_placeholder")}
                className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-2.5 text-sm text-[#fafafa] placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#a1a1aa] mb-1">{t("register.email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-2.5 text-sm text-[#fafafa] placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#a1a1aa] mb-1">{t("register.password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder={t("register.password_placeholder")}
                className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-4 py-2.5 text-sm text-[#fafafa] placeholder:text-[#52525b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2563eb] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb]/90 transition-colors disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? t("register.loading") : t("register.submit")}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#27272a]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#18181b] px-2 text-[#52525b]">{t("register.or")}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#27272a] text-[#fafafa] rounded-lg text-sm font-medium hover:bg-[#3f3f46] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            {t("register.github")}
          </button>

          <p className="text-center text-sm text-[#a1a1aa] mt-4">
            {t("register.has_account")}{" "}
            <Link
              href="/login"
              className="text-[#2563eb] hover:underline"
            >
              {t("register.sign_in")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
