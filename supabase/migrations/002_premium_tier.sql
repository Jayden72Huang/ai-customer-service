-- 002: Premium membership tier, SEO articles, weekly report logs

-- Add membership to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership TEXT NOT NULL DEFAULT 'free' CHECK (membership IN ('free', 'premium'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_updated_at TIMESTAMPTZ;

-- SEO articles generated from chat data
CREATE TABLE IF NOT EXISTS seo_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  topics TEXT[] DEFAULT '{}',
  word_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  generated_from JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_site ON seo_articles(site_id, created_at DESC);

-- Weekly report logs
CREATE TABLE IF NOT EXISTS weekly_report_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  report_data JSONB NOT NULL,
  qa_entries_added INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_report_site ON weekly_report_logs(site_id, created_at DESC);
