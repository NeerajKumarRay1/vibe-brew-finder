import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

type Favorite = Database['public']['Tables']['user_favorites']['Row'];

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_favorites')
        .select('cafe_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavorites(data?.map(f => f.cafe_id) || []);
    } catch (err) {
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (cafeId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save favorites",
        variant: "destructive",
      });
      return;
    }

    try {
      const isFavorited = favorites.includes(cafeId);
      
      if (isFavorited) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('cafe_id', cafeId);

        if (error) throw error;
        setFavorites(prev => prev.filter(id => id !== cafeId));
        toast({
          title: "Removed from favorites",
          description: "Cafe removed from your favorites",
        });
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            cafe_id: cafeId,
          });

        if (error) throw error;
        setFavorites(prev => [...prev, cafeId]);
        toast({
          title: "Added to favorites",
          description: "Cafe saved to your favorites",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update favorites',
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [user]);

  return { favorites, loading, toggleFavorite, isFavorited: (cafeId: string) => favorites.includes(cafeId) };
}