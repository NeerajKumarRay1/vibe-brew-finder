import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Cafe = Database['public']['Tables']['cafes']['Row'];

interface RecommendationFilters {
  atmosphere?: string;
  price_range?: string;
  mood?: string;
}

interface RecommendationResult {
  recommendations: RecommendationFilters[];
  cafes: Cafe[];
}

export function useRecommendations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);

  const getRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('get-recommendations', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (funcError) throw funcError;

      setRecommendations(data as RecommendationResult);
      return data as RecommendationResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get recommendations';
      setError(errorMessage);
      console.error('Recommendations error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getRecommendations,
    recommendations,
    loading,
    error
  };
}