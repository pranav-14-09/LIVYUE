-- ==============================================================================
-- LIVYUE — Multi-User Database Schema & PostgreSQL Row Level Security (RLS)
-- ==============================================================================
-- Run this SQL in your Supabase SQL Editor to initialize all tables, indexes, 
-- triggers, and Row Level Security policies.
-- ==============================================================================

-- 1. PROFILES (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. USER SETTINGS
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  morning_prompt_text TEXT DEFAULT 'What is one thing that would make today feel well-lived?',
  evening_prompt_text TEXT DEFAULT 'What was most meaningful or challenging about today?',
  morning_check_in_time TEXT DEFAULT '08:00',
  evening_check_in_time TEXT DEFAULT '21:00',
  start_page TEXT DEFAULT 'today',
  show_completed BOOLEAN DEFAULT true,
  confirm_before_delete BOOLEAN DEFAULT true,
  enable_daily_insights BOOLEAN DEFAULT true,
  theme_mode TEXT DEFAULT 'light',
  last_active_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. DAY ENTRIES (Keyed by User ID and YYYY-MM-DD Date)
CREATE TABLE IF NOT EXISTS public.day_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date TEXT NOT NULL, -- YYYY-MM-DD local format
  day_message TEXT DEFAULT '',
  morning_intention TEXT DEFAULT '',
  evening_reflection TEXT DEFAULT '',
  takeaways TEXT DEFAULT '',
  energy_level TEXT, -- 'calm', 'clear', 'tired', 'heavy', 'scattered'
  completed_evening BOOLEAN NOT NULL DEFAULT false,
  daily_score INTEGER NOT NULL DEFAULT 0,
  daily_insight JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_entry_date UNIQUE (user_id, entry_date)
);

-- 4. DAILY INTENTIONS (Child records of day_entries)
CREATE TABLE IF NOT EXISTS public.daily_intentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_entry_id UUID NOT NULL REFERENCES public.day_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'personal',
  status TEXT NOT NULL DEFAULT 'missed', -- 'done', 'partial', 'missed'
  note TEXT DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_day_entries_user_date ON public.day_entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_intentions_entry ON public.daily_intentions(day_entry_id);
CREATE INDEX IF NOT EXISTS idx_daily_intentions_user ON public.daily_intentions(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Every table has RLS enabled with strict checks enforcing auth.uid() = user_id.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_intentions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- User Settings Policies
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
CREATE POLICY "Users can view own settings" 
  ON public.user_settings FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings" 
  ON public.user_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings" 
  ON public.user_settings FOR UPDATE 
  USING (auth.uid() = user_id);

-- Day Entries Policies
DROP POLICY IF EXISTS "Users can view own day entries" ON public.day_entries;
CREATE POLICY "Users can view own day entries" 
  ON public.day_entries FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own day entries" ON public.day_entries;
CREATE POLICY "Users can insert own day entries" 
  ON public.day_entries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own day entries" ON public.day_entries;
CREATE POLICY "Users can update own day entries" 
  ON public.day_entries FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own day entries" ON public.day_entries;
CREATE POLICY "Users can delete own day entries" 
  ON public.day_entries FOR DELETE 
  USING (auth.uid() = user_id);

-- Daily Intentions Policies
DROP POLICY IF EXISTS "Users can view own daily intentions" ON public.daily_intentions;
CREATE POLICY "Users can view own daily intentions" 
  ON public.daily_intentions FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily intentions" ON public.daily_intentions;
CREATE POLICY "Users can insert own daily intentions" 
  ON public.daily_intentions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily intentions" ON public.daily_intentions;
CREATE POLICY "Users can update own daily intentions" 
  ON public.daily_intentions FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own daily intentions" ON public.daily_intentions;
CREATE POLICY "Users can delete own daily intentions" 
  ON public.daily_intentions FOR DELETE 
  USING (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE & SETTINGS CREATION TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert default user settings
  INSERT INTO public.user_settings (user_id, user_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run whenever a new user signs up in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
