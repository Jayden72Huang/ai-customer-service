import Link from "next/link";
import { MessageSquare, Zap, Brain, Shield, Code, Mail } from "lucide-react";

const features = [
  {
    icon: Code,
    title: "One-Line Integration",
    desc: "Add a single <script> tag to your website. AI customer service is live in minutes.",
  },
  {
    icon: MessageSquare,
    title: "Smart Conversations",
    desc: "AI understands context, classifies questions, and responds naturally in any language.",
  },
  {
    icon: Brain,
    title: "Self-Learning",
    desc: "Gets smarter over time. Reviews logs, suggests new knowledge entries for your approval.",
  },
  {
    icon: Shield,
    title: "Human Escalation",
    desc: "Automatically detects when human help is needed and notifies your team via email.",
  },
  {
    icon: Zap,
    title: "Multi-Model Support",
    desc: "Choose between DeepSeek (cost-effective) or Claude (premium quality) per site.",
  },
  {
    icon: Mail,
    title: "Full Dashboard",
    desc: "Manage conversations, knowledge base, and monitor AI performance in one place.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa]">
      {/* Nav */}
      <nav className="border-b border-[#27272a] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold">AI Customer Service</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-[#a1a1aa] hover:text-[#fafafa] transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-[#2563eb] text-white rounded-lg text-sm font-medium hover:bg-[#2563eb]/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2563eb]/10 border border-[#2563eb]/20 rounded-full text-xs text-[#2563eb] mb-6">
            <Zap className="w-3 h-3" />
            10-minute setup, zero maintenance
          </div>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            AI Customer Service
            <br />
            <span className="text-[#2563eb]">That Gets Smarter</span>
          </h2>
          <p className="text-lg text-[#a1a1aa] mb-8 max-w-xl mx-auto">
            One line of code gives your website an intelligent support agent.
            It learns from every conversation, escalates when needed, and improves on its own.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-6 py-3 bg-[#2563eb] text-white rounded-lg font-medium hover:bg-[#2563eb]/90 transition-colors"
            >
              Start Free
            </Link>
            <Link
              href="#features"
              className="px-6 py-3 bg-[#27272a] text-[#fafafa] rounded-lg font-medium hover:bg-[#3f3f46] transition-colors"
            >
              See Features
            </Link>
          </div>

          {/* Code Preview */}
          <div className="mt-12 bg-[#18181b] border border-[#27272a] rounded-xl p-6 text-left max-w-lg mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
              <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
              <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
              <span className="text-xs text-[#52525b] ml-2">index.html</span>
            </div>
            <pre className="text-sm font-mono">
              <code>
                <span className="text-[#a1a1aa]">{'<!-- Add AI customer service -->'}</span>
                {'\n'}
                <span className="text-[#2563eb]">{'<script'}</span>
                {'\n  '}
                <span className="text-[#22c55e]">src</span>
                <span className="text-[#a1a1aa]">=</span>
                <span className="text-[#f59e0b]">{`"https://your-domain/widget.js"`}</span>
                {'\n  '}
                <span className="text-[#22c55e]">data-api-key</span>
                <span className="text-[#a1a1aa]">=</span>
                <span className="text-[#f59e0b]">{`"your-api-key"`}</span>
                {'\n'}
                <span className="text-[#2563eb]">{'></script>'}</span>
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 border-t border-[#27272a]">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-12">
            Everything you need for AI-powered support
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-[#18181b] border border-[#27272a] rounded-xl p-6 hover:border-[#2563eb]/30 transition-colors"
              >
                <f.icon className="w-8 h-8 text-[#2563eb] mb-4" />
                <h4 className="font-semibold mb-2">{f.title}</h4>
                <p className="text-sm text-[#a1a1aa] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-[#27272a]">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to upgrade your support?</h3>
          <p className="text-[#a1a1aa] mb-8">
            Set up in 10 minutes. No credit card required.
          </p>
          <Link
            href="/register"
            className="inline-flex px-8 py-3 bg-[#2563eb] text-white rounded-lg font-medium hover:bg-[#2563eb]/90 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#27272a] py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-[#52525b]">
          <span>AI Customer Service</span>
          <span>Built with Next.js + Supabase</span>
        </div>
      </footer>
    </div>
  );
}
