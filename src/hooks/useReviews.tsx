import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

type Review = Database['public']['Tables']['reviews']['Row'];

export function useReviews(cafeId: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('reviews')
        .select('*')
        .eq('cafe_id', cafeId)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      setReviews(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [cafeId]);

  return { reviews, loading, error, refetch: fetchReviews };
}

export function useCreateReview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const createReview = async (cafeId: string, rating: number, title?: string, content?: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to write a review",
        variant: "destructive",
      });
      return { error: "User not authenticated" };
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          cafe_id: cafeId,
          rating,
          title,
          content,
        });

      if (error) throw error;

      toast({
        title: "Review posted!",
        description: "Thank you for your feedback",
      });

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create review';
      toast({
        title: "Error posting review",
        description: errorMessage,
        variant: "destructive",
      });
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return { createReview, loading };
}