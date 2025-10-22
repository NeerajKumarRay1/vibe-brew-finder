import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MoodScore {
  calm: number;
  lively: number;
  romantic: number;
  studyFriendly: number;
}

interface MoodAnalysis {
  mood_score: MoodScore;
  dominant_mood: string;
  review_count: number;
}

export function useMoodAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeCafeMood = useCallback(async (cafeId: string): Promise<MoodAnalysis | null> => {
    setLoading(true);
    setError(null);

    try {
      // First, check if analysis already exists and is recent (less than 7 days old)
      const { data: existing } = await supabase
        .from('cafe_mood_analysis')
        .select('*')
        .eq('cafe_id', cafeId)
        .single();

      if (existing) {
        const analyzedAt = new Date(existing.analyzed_at);
        const now = new Date();
        const daysDiff = (now.getTime() - analyzedAt.getTime()) / (1000 * 60 * 60 * 24);

        if (daysDiff < 7) {
          // Return cached analysis
          return {
            mood_score: existing.mood_score as unknown as MoodScore,
            dominant_mood: existing.dominant_mood,
            review_count: existing.review_count
          };
        }
      }

      // Perform new analysis
      const { data, error: funcError } = await supabase.functions.invoke('analyze-cafe-mood', {
        body: { cafeId }
      });

      if (funcError) throw funcError;

      return data as MoodAnalysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze cafe mood';
      setError(errorMessage);
      console.error('Mood analysis error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCachedMoodAnalysis = useCallback(async (cafeId: string): Promise<MoodAnalysis | null> => {
    try {
      const { data } = await supabase
        .from('cafe_mood_analysis')
        .select('*')
        .eq('cafe_id', cafeId)
        .single();

      if (data) {
        return {
          mood_score: data.mood_score as unknown as MoodScore,
          dominant_mood: data.dominant_mood,
          review_count: data.review_count
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching cached mood analysis:', err);
      return null;
    }
  }, []);

  return {
    analyzeCafeMood,
    getCachedMoodAnalysis,
    loading,
    error
  };
}