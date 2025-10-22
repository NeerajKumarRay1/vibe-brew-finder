import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get user's favorite cafes
    const { data: favorites } = await supabase
      .from('user_favorites')
      .select('cafe_id, cafes(*)')
      .eq('user_id', user.id)
      .limit(10);

    // Get user's recent analytics (viewed cafes)
    const { data: analytics } = await supabase
      .from('user_analytics')
      .select('event_data')
      .eq('user_id', user.id)
      .eq('event_type', 'cafe_view')
      .order('created_at', { ascending: false })
      .limit(20);

    // Get user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Prepare data for AI
    const favoriteCafesData = favorites?.map(f => ({
      name: f.cafes.name,
      atmosphere: f.cafes.atmosphere,
      specialties: f.cafes.specialties,
      price_range: f.cafes.price_range,
      mood: f.cafes.mood_classification
    })) || [];

    const analyticsData = analytics?.map(a => a.event_data) || [];

    // Call AI for personalized recommendations
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a personalized cafe recommendation system. Based on user preferences, favorites, and browsing history, provide intelligent cafe recommendations. Return ONLY a JSON object with recommended_filters array containing suggested atmosphere, price_range, and mood preferences.'
          },
          {
            role: 'user',
            content: `User data:
Favorite cafes: ${JSON.stringify(favoriteCafesData)}
Preferences: ${JSON.stringify(preferences)}
Recent views: ${JSON.stringify(analyticsData)}

Recommend what types of cafes this user would enjoy.`
          }
        ],
        temperature: 0.5,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error('AI rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to continue.');
      }
      throw new Error('AI recommendation failed');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;

    // Parse recommendations
    let recommendations;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        recommendations = { recommended_filters: [] };
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      recommendations = { recommended_filters: [] };
    }

    // Fetch actual cafes matching recommendations
    let query = supabase
      .from('cafes')
      .select('*')
      .order('rating', { ascending: false })
      .limit(10);

    // Apply recommended filters if available
    if (recommendations.recommended_filters && recommendations.recommended_filters.length > 0) {
      const filters = recommendations.recommended_filters[0];
      if (filters.atmosphere) {
        query = query.contains('atmosphere', [filters.atmosphere]);
      }
      if (filters.mood) {
        query = query.eq('mood_classification', filters.mood);
      }
    }

    const { data: recommendedCafes, error: cafesError } = await query;

    if (cafesError) throw cafesError;

    return new Response(
      JSON.stringify({
        recommendations: recommendations.recommended_filters,
        cafes: recommendedCafes || []
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error getting recommendations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});