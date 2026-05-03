-- Phase 1: Monetization + beta infrastructure
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_message_count integer NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS message_count_reset_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS beta_tester boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subscription jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS beta_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  feedback_type text NOT NULL DEFAULT 'BUG',
  description text NOT NULL,
  app_version text DEFAULT '1.0',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beta_feedback_created ON beta_feedback(created_at DESC);
