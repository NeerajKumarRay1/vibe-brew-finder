import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, MapPin, Search, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AnalyticsData {
  totalViews: number;
  totalSearches: number;
  popularCafes: Array<{ cafe_name: string; view_count: number }>;
  popularSearches: Array<{ search_query: string; search_count: number }>;
  recentActivity: Array<{ event_type: string; count: number }>;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    loadAnalytics();
  }, [user, navigate]);

  const loadAnalytics = async () => {
    try {
      // Get total views
      const { count: viewCount } = await supabase
        .from('user_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'cafe_view');

      // Get total searches
      const { count: searchCount } = await supabase
        .from('user_analytics')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'cafe_search');

      // Get popular cafes
      const { data: cafeViews } = await supabase
        .from('user_analytics')
        .select('event_data')
        .eq('event_type', 'cafe_view')
        .order('created_at', { ascending: false })
        .limit(1000);

      const cafeViewMap = new Map<string, number>();
      cafeViews?.forEach((view) => {
        const eventData = view.event_data as any;
        const cafeName = eventData?.cafeName;
        if (cafeName) {
          cafeViewMap.set(cafeName, (cafeViewMap.get(cafeName) || 0) + 1);
        }
      });

      const popularCafes = Array.from(cafeViewMap.entries())
        .map(([cafe_name, view_count]) => ({ cafe_name, view_count }))
        .sort((a, b) => b.view_count - a.view_count)
        .slice(0, 10);

      // Get popular searches
      const { data: searches } = await supabase
        .from('user_analytics')
        .select('event_data')
        .eq('event_type', 'cafe_search')
        .order('created_at', { ascending: false })
        .limit(1000);

      const searchMap = new Map<string, number>();
      searches?.forEach((search) => {
        const eventData = search.event_data as any;
        const query = eventData?.searchQuery;
        if (query && query.trim()) {
          searchMap.set(query, (searchMap.get(query) || 0) + 1);
        }
      });

      const popularSearches = Array.from(searchMap.entries())
        .map(([search_query, search_count]) => ({ search_query, search_count }))
        .sort((a, b) => b.search_count - a.search_count)
        .slice(0, 10);

      // Get recent activity by type
      const { data: activity } = await supabase
        .from('user_analytics')
        .select('event_type')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const activityMap = new Map<string, number>();
      activity?.forEach((item) => {
        activityMap.set(item.event_type, (activityMap.get(item.event_type) || 0) + 1);
      });

      const recentActivity = Array.from(activityMap.entries())
        .map(([event_type, count]) => ({ event_type, count }))
        .sort((a, b) => b.count - a.count);

      setAnalytics({
        totalViews: viewCount || 0,
        totalSearches: searchCount || 0,
        popularCafes,
        popularSearches,
        recentActivity
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Coffee className="h-12 w-12 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalViews || 0}</div>
              <p className="text-xs text-muted-foreground">Cafe page views</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalSearches || 0}</div>
              <p className="text-xs text-muted-foreground">Search queries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Popular Cafes</CardTitle>
              <Coffee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.popularCafes.length || 0}</div>
              <p className="text-xs text-muted-foreground">Cafes tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Popular Cafes</CardTitle>
              <CardDescription>Most viewed cafes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.popularCafes.map((cafe, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{cafe.cafe_name}</span>
                    <span className="text-sm text-muted-foreground">{cafe.view_count} views</span>
                  </div>
                ))}
                {(!analytics?.popularCafes || analytics.popularCafes.length === 0) && (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Popular Searches</CardTitle>
              <CardDescription>Most searched terms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.popularSearches.map((search, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{search.search_query}</span>
                    <span className="text-sm text-muted-foreground">{search.search_count} searches</span>
                  </div>
                ))}
                {(!analytics?.popularSearches || analytics.popularSearches.length === 0) && (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity (Last 7 Days)</CardTitle>
            <CardDescription>User engagement breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">{activity.event_type.replace('_', ' ')}</span>
                  <span className="text-sm text-muted-foreground">{activity.count} events</span>
                </div>
              ))}
              {(!analytics?.recentActivity || analytics.recentActivity.length === 0) && (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}