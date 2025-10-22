-- Add social media and contact fields to cafes table
ALTER TABLE public.cafes 
ADD COLUMN IF NOT EXISTS instagram text,
ADD COLUMN IF NOT EXISTS facebook text,
ADD COLUMN IF NOT EXISTS twitter text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS menu_url text,
ADD COLUMN IF NOT EXISTS best_visit_times jsonb DEFAULT '{"morning": 0, "afternoon": 0, "evening": 0, "night": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS mood_classification text;

-- Create user preferences table for personalized recommendations
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  preferred_atmosphere text[] DEFAULT '{}',
  preferred_price_range text[] DEFAULT '{}',
  preferred_specialties text[] DEFAULT '{}',
  preferred_amenities text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create user analytics table
CREATE TABLE IF NOT EXISTS public.user_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  cafe_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own analytics"
  ON public.user_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all analytics"
  ON public.user_analytics FOR SELECT
  USING (true);

-- Create cafe mood analysis cache table
CREATE TABLE IF NOT EXISTS public.cafe_mood_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cafe_id uuid NOT NULL UNIQUE,
  mood_score jsonb DEFAULT '{"calm": 0, "lively": 0, "romantic": 0, "studyFriendly": 0}'::jsonb,
  dominant_mood text,
  analyzed_at timestamp with time zone NOT NULL DEFAULT now(),
  review_count integer DEFAULT 0
);

ALTER TABLE public.cafe_mood_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mood analysis"
  ON public.cafe_mood_analysis FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON public.user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON public.user_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_user_analytics_cafe_id ON public.user_analytics(cafe_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_created_at ON public.user_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cafe_mood_cafe_id ON public.cafe_mood_analysis(cafe_id);

-- Add trigger for user_preferences updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();