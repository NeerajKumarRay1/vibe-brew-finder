import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

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
  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by this browser';
      setError(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }

    setLoading(true);
    setError(null);

    return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      // First attempt with high accuracy
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(newLocation);
          setLoading(false);
          console.log('Location detected:', newLocation);
          resolve(newLocation);
        },
        (error) => {
          console.log('High accuracy failed, trying fallback:', error);
          
          // Fallback attempt with lower accuracy
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const newLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              setLocation(newLocation);
              setLoading(false);
              console.log('Location detected (fallback):', newLocation);
              resolve(newLocation);
            },
            (fallbackError) => {
              let errorMessage = 'Unable to detect your location';
              
              switch (fallbackError.code) {
                case fallbackError.PERMISSION_DENIED:
                  errorMessage = 'Location access denied. Please enable location permissions in your browser.';
                  break;
                case fallbackError.POSITION_UNAVAILABLE:
                  errorMessage = 'Location service unavailable. Please check your device settings.';
                  break;
                case fallbackError.TIMEOUT:
                  errorMessage = 'Location detection timed out. Please try again.';
                  break;
              }
              
              console.error('Location error:', errorMessage, fallbackError);
              setError(errorMessage);
              setLoading(false);
              reject(new Error(errorMessage));
            },
            {
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 300000, // Accept older location data
            }
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 60000,
        }
      );
    });
  }, []);

  const setManualLocation = useCallback((latitude: number, longitude: number) => {
    const newLocation = { latitude, longitude };
    setLocation(newLocation);
    setError(null);
    console.log('Manual location set:', newLocation);
  }, []);

  const startWatchingLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    if (isWatching) return;

    setIsWatching(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(newLocation);
        setError(null);
        setLoading(false);
        console.log('Location updated:', newLocation);
      },
      (error) => {
        let errorMessage = 'Failed to track your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        console.error('Location tracking error:', errorMessage, error);
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    );
  }, [isWatching]);

  const stopWatchingLocation = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsWatching(false);
      console.log('Stopped watching location');
    }
  }, []);

  useEffect(() => {
    return () => {
      stopWatchingLocation();
    };
  }, [stopWatchingLocation]);

  return {
    location,
    error,
    loading,
    isWatching,
    getCurrentLocation,
    setManualLocation,
    startWatchingLocation,
    stopWatchingLocation,
  };
}