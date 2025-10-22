import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type AnalyticsEvent = 'cafe_view' | 'cafe_search' | 'filter_applied' | 'favorite_added' | 'favorite_removed' | 'review_submitted';

interface AnalyticsEventData {
  cafeId?: string;
  cafeName?: string;
  searchQuery?: string;
  filters?: any;
  [key: string]: any;
}

export function useAnalytics() {
  const { user } = useAuth();

  const trackEvent = useCallback(async (
    eventType: AnalyticsEvent,
    eventData: AnalyticsEventData = {}
  ) => {
    try {
      await supabase.from('user_analytics').insert({
        user_id: user?.id || null,
        event_type: eventType,
        event_data: eventData,
        cafe_id: eventData.cafeId || null,
      });
    } catch (error) {
      console.error('Failed to track analytics:', error);
    }
  }, [user?.id]);

  const trackCafeView = useCallback((cafeId: string, cafeName: string) => {
    trackEvent('cafe_view', { cafeId, cafeName });
  }, [trackEvent]);

  const trackSearch = useCallback((searchQuery: string) => {
    trackEvent('cafe_search', { searchQuery });
  }, [trackEvent]);

  const trackFilterApplied = useCallback((filters: any) => {
    trackEvent('filter_applied', { filters });
  }, [trackEvent]);

  return {
    trackEvent,
    trackCafeView,
    trackSearch,
    trackFilterApplied,
  };
}