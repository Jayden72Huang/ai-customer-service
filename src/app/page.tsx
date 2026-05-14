"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Zap, Brain, Shield, Code, Mail, ArrowRight, Globe } from "lucide-react";
import GradientText from "@/components/GradientText";
import BorderGlow from "@/components/BorderGlow";
import type { Locale } from "@/lib/i18n";
import { translations, getStoredLocale, setStoredLocale } from "@/lib/i18n";

function createT(locale: Locale) {
  return (key: string) => translations[locale]?.[key] || translations.en[key] || key;
}

/* ───────── Page ───────── */
export default function HomePage() {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(getStoredLocale());
  }, []);

  function toggleLocale() {
    const next = locale === "en" ? "zh" : "en";
    setLocaleState(next);
    setStoredLocale(next);
  }

  const t = createT(locale);

  const tagRow1 = [t("tag.smart_reply"), t("tag.auto_learn"), t("tag.escalation"), t("tag.multi_lang"), t("tag.context"), t("tag.analytics"), t("tag.knowledge_base"), t("tag.webhooks")];
  const tagRow2 = [t("tag.email_alert"), t("tag.chat_widget"), t("tag.custom_theme"), t("tag.csv_import"), "DeepSeek", "Claude", t("tag.insights"), t("tag.api")];

  const features = [
    { span: "lg:col-span-2", title: t("feat.smart"), desc: t("feat.smart_desc"), preview: "tags" },
    { title: t("feat.visual"), desc: t("feat.visual_desc"), preview: "icons" },
    { title: t("feat.organized"), desc: t("feat.organized_desc"), preview: "grid-icons" },
    { title: t("feat.models"), desc: t("feat.models_desc"), preview: "bars" },
    { title: t("feat.ai_ready"), desc: t("feat.ai_ready_desc"), preview: "terminal" },
    { title: t("feat.growing"), desc: t("feat.growing_desc"), preview: "chart" },
  ] as { span?: string; title: string; desc: string; preview: string }[];

  const steps = [
    { step: "01", title: t("step.1_title"), desc: t("step.1_desc"), icon: Code, code: '<script src="widget.js" />' },
    { step: "02", title: t("step.2_title"), desc: t("step.2_desc"), icon: Brain, code: locale === "zh" ? "上传文档 → AI 提取 → 完成" : "upload docs → AI extracts → done" },
    { step: "03", title: t("step.3_title"), desc: t("step.3_desc"), icon: MessageSquare, code: locale === "zh" ? "访客提问 → AI 回答 → 7×24" : "visitor asks → AI answers → 24/7" },
    { step: "04", title: t("step.4_title"), desc: t("step.4_desc"), icon: Zap, code: locale === "zh" ? "学习 → 进化 → 升级 → 循环" : "learn → evolve → escalate → repeat" },
  ];

  const testimonialRow1 = locale === "zh" ? [
    { name: "@alexchen", text: "10 分钟就设置好了 AI 客服。响应时间从几小时降到了几秒。" },
    { name: "@sarahdev", text: "自学习功能太牛了。每周都在变聪明，我们什么都不用做。" },
    { name: "@mikeops", text: "今年集成的最好的客服工具。API 干净，后台好用，就是管用。" },
    { name: "@jennaui", text: "终于有一个能完美匹配我们暗色主题的客服插件。自定义太赞了。" },
    { name: "@davidpm", text: "用这一个工具替代了三个。知识库 + AI + 人工升级全在一处。" },
    { name: "@tomcto", text: "多模型支持是杀手级功能。简单问题用 DeepSeek，复杂的用 Claude。" },
  ] : [
    { name: "@alexchen", text: "Set up AI customer service in 10 minutes. Our response time dropped from hours to seconds." },
    { name: "@sarahdev", text: "The self-learning feature is incredible. It gets smarter every week without us doing anything." },
    { name: "@mikeops", text: "Best support tool we've integrated this year. Clean API, great dashboard, just works." },
    { name: "@jennaui", text: "Finally a support widget that matches our dark theme perfectly. Love the customization." },
    { name: "@davidpm", text: "We replaced three tools with this. Knowledge base + AI + escalation in one place." },
    { name: "@tomcto", text: "The multi-model support is a game changer. We use DeepSeek for simple queries and Claude for complex ones." },
  ];

  const testimonialRow2 = locale === "zh" ? [
    { name: "@linaeng", text: "刚发现的 —— 一个简洁、极简、对开发者超友好的 AI 客服平台。上手容易。" },
    { name: "@marcusai", text: "人工升级功能完美运行。AI 处理不了的时候团队立刻收到通知。" },
    { name: "@priya_dev", text: "我做过最简单的客服集成。一行脚本就上线了。" },
    { name: "@jamesml", text: "发现了 AI Service，真的 wow。知识库进化功能太强了。" },
    { name: "@emmaweb", text: "对话洞察分析让我印象深刻。需要 AI 客服的一定要试试。" },
    { name: "@carlos_dx", text: "我们的客户以为他们在和真人对话。AI 质量是下一个级别的。" },
    { name: "@natalie_r", text: "CSV 导入帮我们省了几个小时。几分钟就迁移了整个 FAQ。" },
    { name: "@kevinstack", text: "这正在成为今年最好的 AI 客服工具。认真的。" },
  ] : [
    { name: "@linaeng", text: "Just discovered this — a sleek, minimal, and super dev-friendly AI support platform. Easy to use." },
    { name: "@marcusai", text: "Human escalation works flawlessly. Our team gets notified instantly when AI can't handle something." },
    { name: "@priya_dev", text: "Literally the easiest support integration I've ever done. One script tag and it's live." },
    { name: "@jamesml", text: "Got to know AI Service and it's just wow. The knowledge base evolution feature is incredible." },
    { name: "@emmaweb", text: "Really impressed with the conversation insights. Check it out if you need AI-powered support." },
    { name: "@carlos_dx", text: "Our customers think they're talking to a real person. The AI quality is next level." },
    { name: "@natalie_r", text: "The CSV import saved us hours. Migrated our entire FAQ in minutes." },
    { name: "@kevinstack", text: "This is emerging as the best AI support tool this year. Seriously." },
  ];

  const brands = [
    "Vercel", "Stripe", "Shopify", "HubSpot", "Notion",
    "Linear", "Supabase", "Railway", "Planetscale", "Resend",
    "Clerk", "Neon",
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <span className="font-bold text-lg tracking-tight">AI Service</span>
            </Link>
            <span className="text-white/20 font-light">/</span>
            <div className="hidden md:flex items-center gap-5">
              <Link href="#features" className="text-sm font-mono text-white/60 hover:text-white transition-colors uppercase tracking-wider">
                {t("landing.features")}
              </Link>
              <Link href="#testimonials" className="text-sm font-mono text-white/60 hover:text-white transition-colors uppercase tracking-wider">
                {t("landing.testimonials")}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLocale}
              className="flex items-center gap-1.5 px-3 py-2 text-white/50 hover:text-white transition-colors text-sm"
              title={locale === "en" ? "切换到中文" : "Switch to English"}
            >
              <Globe className="w-3.5 h-3.5" />
              {t("lang.switch")}
            </button>
            <Link
              href="/register"
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-full text-sm font-medium hover:from-purple-500 hover:to-purple-400 transition-all shadow-lg shadow-purple-500/25"
            >
              {t("landing.get_started")}
            </Link>
            <Link
              href="/login"
              className="px-5 py-2 border border-white/10 text-white/70 rounded-full text-sm font-medium hover:bg-white/5 hover:text-white transition-all"
            >
              {t("landing.login")}
            </Link>
          </div>
        </div>
      </nav>

      {/* ───────── Hero ───────── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-purple-600/15 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-purple-800/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-8">
                <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs font-mono text-green-400 uppercase tracking-wider">
                  {t("landing.new")}
                </span>
                <span className="text-sm text-white/50 font-mono flex items-center gap-1">
                  {t("landing.multi_model")} <ArrowRight className="w-3 h-3" />
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] tracking-tight mb-6">
                <GradientText
                  colors={["#c084fc", "#f0abfc", "#818cf8", "#c084fc"]}
                  animationSpeed={6}
                  className="inline"
                >
                  {t("landing.hero_line1")}
                </GradientText>
                <br />
                {t("landing.hero_line2")}
                <br />
                {t("landing.hero_line3_pre")}{" "}
                <GradientText
                  colors={["#c084fc", "#f0abfc", "#818cf8", "#c084fc"]}
                  animationSpeed={6}
                  className="inline"
                >
                  {t("landing.hero_line3")}
                </GradientText>
              </h1>

              <p className="text-lg text-white/40 leading-relaxed mb-10 max-w-md">
                {t("landing.hero_desc")}
              </p>

              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-full font-medium text-base hover:from-purple-500 hover:to-purple-400 transition-all shadow-xl shadow-purple-500/25"
              >
                {t("landing.start_building")}
              </Link>
            </div>

            {/* Code Preview with BorderGlow */}
            <BorderGlow
              className="max-w-md"
              backgroundColor="#12121a"
              borderRadius={16}
              glowColor="270 70 65"
              colors={["#c084fc", "#f0abfc", "#818cf8"]}
              glowIntensity={0.8}
              animated
            >
              <div id="code">
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-white/10" />
                    <div className="w-3 h-3 rounded-full bg-white/10" />
                    <div className="w-3 h-3 rounded-full bg-white/10" />
                  </div>
                  <span className="text-xs font-mono text-white/30">index.html</span>
                </div>
                <div className="p-6 font-mono text-sm leading-7">
                  <div className="text-white/30">{t("landing.code_comment")}</div>
                  <div>
                    <span className="text-purple-400">{'<'}</span>
                    <span className="text-purple-300">script</span>
                  </div>
                  <div className="pl-6">
                    <span className="text-green-400">src</span>
                    <span className="text-white/40">=</span>
                    <span className="text-amber-300">{'"https://your-app.com/widget.js"'}</span>
                  </div>
                  <div className="pl-6">
                    <span className="text-green-400">data-site-id</span>
                    <span className="text-white/40">=</span>
                    <span className="text-amber-300">{'"your-site-id"'}</span>
                  </div>
                  <div className="pl-6">
                    <span className="text-green-400">data-position</span>
                    <span className="text-white/40">=</span>
                    <span className="text-amber-300">{'"bottom-right"'}</span>
                  </div>
                  <div className="pl-6">
                    <span className="text-green-400">data-theme</span>
                    <span className="text-white/40">=</span>
                    <span className="text-amber-300">{'"dark"'}</span>
                  </div>
                  <div>
                    <span className="text-purple-400">{'>'}</span>
                    <span className="text-purple-400">{'</'}</span>
                    <span className="text-purple-300">script</span>
                    <span className="text-purple-400">{'>'}</span>
                  </div>
                  <div className="mt-4 text-white/30">{t("landing.code_done")}</div>
                </div>
                <div className="px-5 py-3 border-t border-white/[0.06] text-right">
                  <span className="text-xs font-mono text-white/20">{t("landing.code_copy")}</span>
                </div>
              </div>
            </BorderGlow>
          </div>
        </div>
      </section>

      {/* ───────── Brand Marquee ───────── */}
      <section className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 mb-6">
          <p className="text-xs font-mono text-white/20 uppercase tracking-widest">{t("landing.trusted_by")}</p>
        </div>
        <div className="relative mask-fade-x overflow-hidden">
          <div className="flex animate-marquee w-max">
            {[...brands, ...brands].map((brand, i) => (
              <div key={i} className="flex items-center justify-center px-10 shrink-0">
                <span className="text-lg font-semibold text-white/15 whitespace-nowrap tracking-wide">
                  {brand}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── What's Inside ───────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-16">
            {t("landing.whats_inside")}
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className={`group bg-[#12121a] border border-white/[0.06] rounded-2xl p-6 hover:border-purple-500/20 transition-all duration-300 flex flex-col ${f.span || ""}`}
              >
                <div className="h-36 flex flex-col justify-end mb-6 overflow-hidden rounded-xl">
                  <FeaturePreview type={f.preview} tagRow1={tagRow1} tagRow2={tagRow2} activeUsers={t("chart.active_users")} />
                </div>

                <h3 className="font-semibold text-white text-base mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── How It Works ───────── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            {t("landing.how_it_works")}
          </h2>
          <p className="text-lg text-white/40 mb-16 max-w-lg">
            {t("landing.how_desc")}
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <div key={s.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 -right-2 z-10 text-white/10">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
                <BorderGlow
                  backgroundColor="#12121a"
                  borderRadius={16}
                  glowColor="270 70 65"
                  colors={["#c084fc", "#f0abfc", "#818cf8"]}
                  glowIntensity={0.6}
                  className="h-full"
                >
                  <div className="p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <s.icon className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="text-2xl font-bold text-white/[0.06] font-mono">{s.step}</span>
                    </div>
                    <h3 className="font-semibold text-white text-base mb-2">{s.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed mb-4 flex-1">{s.desc}</p>
                    <div className="px-3 py-2 bg-[#0a0a0f] border border-white/[0.06] rounded-lg">
                      <span className="text-xs font-mono text-purple-400/60">{s.code}</span>
                    </div>
                  </div>
                </BorderGlow>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Testimonials (horizontal scroll) ───────── */}
      <section id="testimonials" className="py-24">
        <div className="max-w-7xl mx-auto px-6 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            {t("landing.loved_by")}
          </h2>
        </div>

        <div className="space-y-4 mask-fade-x">
          <div className="overflow-hidden">
            <div className="flex gap-4 animate-scroll-left w-max">
              {[...testimonialRow1, ...testimonialRow1].map((item, i) => (
                <TestimonialCard key={i} name={item.name} text={item.text} />
              ))}
            </div>
          </div>
          <div className="overflow-hidden">
            <div className="flex gap-4 animate-scroll-right w-max">
              {[...testimonialRow2, ...testimonialRow2].map((item, i) => (
                <TestimonialCard key={i} name={item.name} text={item.text} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-[#12121a] border border-white/[0.06] rounded-3xl p-12 md:p-20 overflow-hidden text-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-purple-600/10 rounded-full blur-[80px]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                {t("landing.ready_title")}
                <br />
                {t("landing.ready_title2")}
              </h2>
              <p className="text-white/40 text-lg mb-10 max-w-md mx-auto">
                {t("landing.ready_desc")}
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-full font-medium hover:from-purple-500 hover:to-purple-400 transition-all shadow-xl shadow-purple-500/25"
              >
                {t("landing.get_started_free")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-white/20 font-mono">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" />
            <span>{t("landing.footer_name")}</span>
          </div>
          <span>{t("landing.footer_built")}</span>
        </div>
      </footer>
    </div>
  );
}

/* ───────── Sub-components ───────── */

function FeaturePreview({ type, tagRow1, tagRow2, activeUsers }: { type: string; tagRow1: string[]; tagRow2: string[]; activeUsers: string }) {
  if (type === "tags") {
    return (
      <div className="space-y-3 mask-fade-x">
        <div className="flex animate-scroll-left w-max">
          {[...tagRow1, ...tagRow1].map((t, i) => (
            <span key={i} className="px-3 py-1.5 border border-white/10 rounded-full text-xs font-mono text-white/50 mr-2 shrink-0 whitespace-nowrap">
              {t}
            </span>
          ))}
        </div>
        <div className="flex animate-scroll-right w-max">
          {[...tagRow2, ...tagRow2].map((t, i) => (
            <span key={i} className="px-3 py-1.5 border border-white/10 rounded-full text-xs font-mono text-white/50 mr-2 shrink-0 whitespace-nowrap">
              {t}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (type === "icons") {
    return (
      <div className="flex items-center gap-4">
        {[MessageSquare, Brain, Shield].map((Icon, i) => (
          <div
            key={i}
            className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center animate-float"
            style={{ animationDelay: `${i * 0.4}s` }}
          >
            <Icon className="w-5 h-5 text-purple-400/60" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "grid-icons") {
    const icons = [Zap, Shield, Code, Brain, MessageSquare, Mail, ArrowRight, Zap, Code];
    return (
      <div className="grid grid-cols-3 gap-3">
        {icons.map((Icon, i) => (
          <div
            key={i}
            className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center animate-float"
            style={{ animationDelay: `${i * 0.2}s` }}
          >
            <Icon className="w-4 h-4 text-white/20" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "bars") {
    const models = [
      { name: "DeepSeek", color: "bg-purple-500/40", track: "bg-purple-500/10" },
      { name: "Claude", color: "bg-green-500/40", track: "bg-green-500/10" },
      { name: "GPT-4o", color: "bg-amber-500/40", track: "bg-amber-500/10" },
    ];
    return (
      <div className="space-y-3 w-full">
        {models.map((m, i) => (
          <div key={m.name} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${i === 0 ? "bg-white/[0.03] border border-white/[0.06]" : ""}`}>
            <div className={`w-2 h-2 rounded-full ${m.color}`} />
            <span className="text-xs font-mono text-white/40 w-16 shrink-0">{m.name}</span>
            <div className={`flex-1 h-1 rounded-full ${m.track} overflow-hidden`}>
              <div className={`h-full rounded-full ${m.color} animate-pulse-width`} style={{ animationDelay: `${i * 0.5}s` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "terminal") {
    return (
      <div className="bg-[#0a0a0f] border border-white/[0.06] rounded-lg p-4 w-full">
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <span className="text-[10px] font-mono text-white/20 ml-2">Editor</span>
        </div>
        <div className="font-mono text-xs text-white/40">
          <span className="text-purple-400">$</span> add a knowledge base
        </div>
        <div className="flex gap-1 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-float" style={{ animationDelay: "0s" }} />
          <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-float" style={{ animationDelay: "0.2s" }} />
          <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-float" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    );
  }

  if (type === "chart") {
    return (
      <div className="w-full">
        <p className="text-xs font-mono text-white/20 mb-2">{activeUsers}</p>
        <p className="text-4xl font-bold text-white/10 mb-4">2.4K</p>
        <div className="flex items-end gap-1 h-12">
          {[3, 4, 3, 5, 6, 5, 7, 8, 7, 9, 8, 10, 9, 11, 12].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-purple-500/20 rounded-sm animate-grow-bar"
              style={{ height: `${h * 4}px`, animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function TestimonialCard({ name, text }: { name: string; text: string }) {
  return (
    <div className="bg-[#12121a] border border-white/[0.06] rounded-xl p-5 shrink-0 w-[340px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-violet-500/20 flex items-center justify-center text-xs font-mono text-purple-300">
            {name.charAt(1).toUpperCase()}
          </div>
          <span className="text-sm font-mono text-white/50">{name}</span>
        </div>
        <span className="text-white/15 text-sm font-bold">𝕏</span>
      </div>
      <p className="text-sm text-white/40 leading-relaxed">{text}</p>
    </div>
  );
}
