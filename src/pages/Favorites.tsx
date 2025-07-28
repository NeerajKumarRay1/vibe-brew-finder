import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CafeCard } from '@/components/CafeCard';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Cafe = Database['public']['Tables']['cafes']['Row'];

export default function Favorites() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const [favoriteCafes, setFavoriteCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchFavoriteCafes();
  }, [user, favorites]);

  const fetchFavoriteCafes = async () => {
    if (!favorites.length) {
      setFavoriteCafes([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cafes')
        .select('*')
        .in('id', favorites);

      if (error) throw error;
      setFavoriteCafes(data || []);
    } catch (error) {
      console.error('Error fetching favorite cafes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-page">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')} 
              className="text-coffee-bean hover:text-golden-hour"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Search
            </Button>
            <div className="flex items-center gap-2 text-coffee-bean">
              <Heart className="w-5 h-5 fill-current text-red-500" />
              <span className="font-semibold">My Favorites</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-coffee-bean mb-4">Your Favorite Cafes</h1>
          <p className="text-xl text-muted-foreground">
            {loading ? "Loading your favorites..." : `${favoriteCafes.length} favorite cafes`}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-coffee-bean">Loading your favorite cafes...</div>
          </div>
        ) : favoriteCafes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteCafes.map((cafe) => (
              <CafeCard key={cafe.id} cafe={cafe} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-latte-light rounded-full flex items-center justify-center">
              <Coffee className="w-8 h-8 text-coffee-bean" />
            </div>
            <h2 className="text-xl font-semibold text-coffee-bean mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-6">
              Start exploring cafes and save your favorites by clicking the heart icon
            </p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-coffee-bean text-cream hover:bg-espresso-dark"
            >
              Discover Cafes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}