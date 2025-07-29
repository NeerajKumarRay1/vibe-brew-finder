import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GooglePlaceCafe {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  review_count: number;
  price_range: string;
  is_open: boolean;
  image_url: string;
  atmosphere: string[];
  amenities: string[];
  specialties: string[];
  wifi_speed: string;
  crowd_level: string;
  phone: string;
  website: string;
  opening_hours: any;
  created_at: string;
  updated_at: string;
}

export function useGooglePlaces() {
  const [places, setPlaces] = useState<GooglePlaceCafe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchNearbyCafes = useCallback(async (latitude: number, longitude: number, radius: number = 5000) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('google-places', {
        body: { latitude, longitude, radius }
      });

      if (funcError) {
        throw new Error(funcError.message || 'Failed to search nearby cafes');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.status === 'OK') {
        setPlaces(data.results || []);
      } else {
        throw new Error(`Google Places API error: ${data.status}`);
      }
    } catch (err) {
      console.error('Google Places search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search nearby cafes');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    places,
    loading,
    error,
    searchNearbyCafes,
  };
}