import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Cafe = Database['public']['Tables']['cafes']['Row'];

interface CafeFilters {
  searchQuery?: string;
  location?: string;
  selectedMoods?: string[];
  selectedBudget?: string;
  maxDistance?: number;
  userLatitude?: number;
  userLongitude?: number;
}

export function useCafes(filters: CafeFilters = {}) {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCafes = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('cafes')
        .select('*');

      // Apply search filter
      if (filters.searchQuery) {
        query = query.or(`name.ilike.%${filters.searchQuery}%, description.ilike.%${filters.searchQuery}%, address.ilike.%${filters.searchQuery}%`);
      }

      // Apply location filter
      if (filters.location) {
        query = query.ilike('address', `%${filters.location}%`);
      }

      // Apply mood/atmosphere filter
      if (filters.selectedMoods && filters.selectedMoods.length > 0) {
        query = query.overlaps('atmosphere', filters.selectedMoods);
      }

      // Apply budget filter
      if (filters.selectedBudget) {
        const budgetMap = {
          'low': '$',
          'medium': '$$',
          'high': '$$$',
          'premium': '$$$$'
        };
        query = query.eq('price_range', budgetMap[filters.selectedBudget as keyof typeof budgetMap]);
      }

      // Order by rating by default
      query = query.order('rating', { ascending: false });

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      // If user location is provided, calculate distances and sort
      if (filters.userLatitude && filters.userLongitude && data) {
        const cafesWithDistance = data.map(cafe => ({
          ...cafe,
          distance: calculateDistance(
            filters.userLatitude!,
            filters.userLongitude!,
            Number(cafe.latitude),
            Number(cafe.longitude)
          )
        })).sort((a, b) => a.distance - b.distance);

        // Filter by max distance if specified
        if (filters.maxDistance) {
          setCafes(cafesWithDistance.filter(cafe => cafe.distance <= filters.maxDistance!));
        } else {
          setCafes(cafesWithDistance);
        }
      } else {
        setCafes(data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cafes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCafes();
  }, [
    filters.searchQuery,
    filters.location,
    filters.selectedMoods?.join(','),
    filters.selectedBudget,
    filters.maxDistance,
    filters.userLatitude,
    filters.userLongitude,
  ]);

  return { cafes, loading, error, refetch: fetchCafes };
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function useUserLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // 1 minute for real-time
      }
    );
  };

  const startWatchingLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }

    setLoading(true);
    setError(null);

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // 1 minute
      }
    );

    setWatchId(id);
  };

  const stopWatchingLocation = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return { 
    location, 
    error, 
    loading, 
    getCurrentLocation, 
    startWatchingLocation, 
    stopWatchingLocation,
    isWatching: !!watchId 
  };
}