export type Locale = "en" | "zh";

export const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Sidebar
    "nav.overview": "Overview",
    "nav.conversations": "Conversations",
    "nav.knowledge": "Knowledge Base",
    "nav.insights": "Insights",
    "nav.seo": "SEO Articles",
    "nav.settings": "Settings",
    "nav.signout": "Sign Out",
    "nav.title": "AI Customer Service",
    "nav.subtitle": "Management Console",

    // Top bar
    "topbar.no_agent": "No AI agent configured yet",
    "topbar.agent_active": "AI agent active",
    "topbar.new_agent": "New AI Agent",
    "topbar.create_agent": "Create AI Agent",

    // Membership
    "membership.free": "Free",
    "membership.premium": "Premium",
    "membership.site_active": "Site active",
    "membership.upgrade": "Upgrade to Pro",

    // Upgrade page
    "upgrade.title": "Upgrade to Premium",
    "upgrade.subtitle": "Unlock powerful AI features to grow your business",
    "upgrade.free_plan": "Free Plan",
    "upgrade.premium_plan": "Premium Plan",
    "upgrade.current": "Current Plan",
    "upgrade.per_month": "/month",
    "upgrade.cta": "Upgrade Now",
    "upgrade.already_premium": "You're already on Premium!",
    "upgrade.back": "Back to Dashboard",

    // Free features
    "upgrade.free.f1": "AI chat with knowledge base",
    "upgrade.free.f2": "Manual Q&A entries",
    "upgrade.free.f3": "Conversation management",
    "upgrade.free.f4": "Basic analytics & reports",
    "upgrade.free.f5": "Email escalation alerts",

    // Premium features
    "upgrade.pro.f1": "Everything in Free",
    "upgrade.pro.f2": "Knowledge Evolution (AI auto-improves docs)",
    "upgrade.pro.f3": "Custom Quick Links in widget",
    "upgrade.pro.f4": "Weekly auto Q&A generation",
    "upgrade.pro.f5": "SEO article generation from chat data",
    "upgrade.pro.f6": "Priority support",

    // Settings
    "settings.title": "Settings",
    "settings.embed_code": "Embed Code",
    "settings.embed_desc": "Add this to your website to enable the AI chat widget.",
    "settings.site_config": "Site Configuration",
    "settings.site_name": "Site Name",
    "settings.domain": "Domain",
    "settings.ai_config": "AI Configuration",
    "settings.ai_provider": "AI Provider",
    "settings.chat_style": "Chat Style",
    "settings.welcome_msg": "Welcome Message",
    "settings.max_msg": "Max Messages / Hour",
    "settings.widget": "Widget Appearance",
    "settings.theme_color": "Theme Color",
    "settings.position": "Position",
    "settings.escalation": "Escalation Notifications",
    "settings.email": "Notification Email",
    "settings.email_desc": "You'll receive an email when AI escalates a conversation to human support.",
    "settings.quick_links": "Quick Links",
    "settings.quick_links_desc": "Add clickable action buttons in the chat widget. Visitors can quickly navigate to important pages.",
    "settings.add_link": "Add Quick Link",
    "settings.save": "Save Settings",
    "settings.saved": "Settings saved",
    "settings.save_failed": "Save failed, please try again",
    "settings.premium_feature": "Premium Feature",
    "settings.premium_links_desc": "Upgrade to add quick action links in your chat widget",

    // Knowledge
    "knowledge.title": "Knowledge Base",
    "knowledge.entries": "entries",
    "knowledge.teach": "Teach your AI how to answer",
    "knowledge.evolve": "Evolve Now",
    "knowledge.evolve_premium": "Premium feature — upgrade to use knowledge evolution",

    // Insights
    "insights.title": "AI Insights",
    "insights.subtitle": "Review learning suggestions, performance metrics, and AI-generated reports",
    "insights.report": "AI Analysis Report",
    "insights.report_desc": "AI analyzes customer interactions to find patterns, gaps, and improvements",
    "insights.generate": "Generate Report",
    "insights.analyzing": "Analyzing...",

    // SEO
    "seo.title": "SEO Articles",
    "seo.subtitle": "Auto-generate SEO blog articles from customer interaction data",
    "seo.generate": "Generate New Article",
    "seo.generate_desc": "AI identifies trending topics from customer conversations and writes an SEO-optimized article",
    "seo.premium_gate": "Upgrade to Premium to auto-generate SEO articles from your customer interactions.",

    // Language
    "lang.switch": "中文",
  },
  zh: {
    // Sidebar
    "nav.overview": "概览",
    "nav.conversations": "对话管理",
    "nav.knowledge": "知识库",
    "nav.insights": "智能洞察",
    "nav.seo": "SEO 文章",
    "nav.settings": "设置",
    "nav.signout": "退出登录",
    "nav.title": "AI 智能客服",
    "nav.subtitle": "管理控制台",

    // Top bar
    "topbar.no_agent": "尚未配置 AI 助手",
    "topbar.agent_active": "AI 助手运行中",
    "topbar.new_agent": "新建 AI 助手",
    "topbar.create_agent": "创建 AI 助手",

    // Membership
    "membership.free": "免费版",
    "membership.premium": "高级版",
    "membership.site_active": "站点运行中",
    "membership.upgrade": "升级到高级版",

    // Upgrade page
    "upgrade.title": "升级到高级版",
    "upgrade.subtitle": "解锁强大的 AI 功能，助力业务增长",
    "upgrade.free_plan": "免费版",
    "upgrade.premium_plan": "高级版",
    "upgrade.current": "当前方案",
    "upgrade.per_month": "/月",
    "upgrade.cta": "立即升级",
    "upgrade.already_premium": "你已经是高级会员了！",
    "upgrade.back": "返回控制台",

    // Free features
    "upgrade.free.f1": "AI 智能对话 + 知识库",
    "upgrade.free.f2": "手动添加 Q&A 条目",
    "upgrade.free.f3": "对话管理",
    "upgrade.free.f4": "基础分析和报告",
    "upgrade.free.f5": "邮件升级通知",

    // Premium features
    "upgrade.pro.f1": "包含免费版所有功能",
    "upgrade.pro.f2": "知识进化（AI 自动优化文档）",
    "upgrade.pro.f3": "自定义快捷链接（widget 内跳转）",
    "upgrade.pro.f4": "每周自动生成 Q&A",
    "upgrade.pro.f5": "基于对话数据自动生成 SEO 文章",
    "upgrade.pro.f6": "优先技术支持",

    // Settings
    "settings.title": "设置",
    "settings.embed_code": "嵌入代码",
    "settings.embed_desc": "将此代码添加到你的网站以启用 AI 客服插件。",
    "settings.site_config": "站点配置",
    "settings.site_name": "站点名称",
    "settings.domain": "域名",
    "settings.ai_config": "AI 配置",
    "settings.ai_provider": "AI 模型",
    "settings.chat_style": "对话风格",
    "settings.welcome_msg": "欢迎语",
    "settings.max_msg": "每小时最大消息数",
    "settings.widget": "插件外观",
    "settings.theme_color": "主题颜色",
    "settings.position": "位置",
    "settings.escalation": "升级通知",
    "settings.email": "通知邮箱",
    "settings.email_desc": "当 AI 将对话升级给人工客服时，你会收到邮件通知。",
    "settings.quick_links": "快捷链接",
    "settings.quick_links_desc": "在聊天插件中添加可点击的快捷按钮，访客可快速跳转到重要页面。",
    "settings.add_link": "添加快捷链接",
    "settings.save": "保存设置",
    "settings.saved": "设置已保存",
    "settings.save_failed": "保存失败，请重试",
    "settings.premium_feature": "高级版功能",
    "settings.premium_links_desc": "升级到高级版以添加自定义快捷链接",

    // Knowledge
    "knowledge.title": "知识库",
    "knowledge.entries": "条",
    "knowledge.teach": "教你的 AI 如何回答",
    "knowledge.evolve": "立即进化",
    "knowledge.evolve_premium": "高级版功能 — 升级以使用知识进化",

    // Insights
    "insights.title": "智能洞察",
    "insights.subtitle": "查看学习建议、性能指标和 AI 分析报告",
    "insights.report": "AI 分析报告",
    "insights.report_desc": "AI 分析客户交互，发现模式、缺口和改进方向",
    "insights.generate": "生成报告",
    "insights.analyzing": "分析中...",

    // SEO
    "seo.title": "SEO 文章",
    "seo.subtitle": "基于客户对话数据自动生成 SEO 博客文章",
    "seo.generate": "生成新文章",
    "seo.generate_desc": "AI 从客户对话中识别热门话题，撰写 SEO 优化文章",
    "seo.premium_gate": "升级到高级版，即可基于客户对话自动生成 SEO 文章。",

    // Language
    "lang.switch": "EN",
  },
};

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  return (localStorage.getItem("dashboard_locale") as Locale) || "en";
}

export function setStoredLocale(locale: Locale) {
  if (typeof window !== "undefined") {
    localStorage.setItem("dashboard_locale", locale);
  }
}
