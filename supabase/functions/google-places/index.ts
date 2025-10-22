import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { latitude, longitude, radius = 5000 } = await req.json()

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the Google Places API key from Supabase secrets
    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
    
    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Places API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Make request to Google Places API
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
      `location=${latitude},${longitude}&` +
      `radius=${radius}&` +
      `type=cafe&` +
      `key=${googleApiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`)
    }

    // Transform Google Places data to match our cafe interface
    const transformedResults = data.results?.map((place: any) => ({
      id: place.place_id,
      name: place.name,
      description: `${place.types?.join(', ')} in ${place.vicinity}`,
      address: place.vicinity,
      latitude: place.geometry?.location?.lat,
      longitude: place.geometry?.location?.lng,
      rating: place.rating || 0,
      review_count: place.user_ratings_total || 0,
      price_range: place.price_level ? '$'.repeat(place.price_level) : '$$',
      is_open: place.opening_hours?.open_now ?? true,
      image_url: place.photos?.[0]?.photo_reference 
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${googleApiKey}`
        : '/api/placeholder/400/300',
      atmosphere: ['Google Places'],
      amenities: ['WiFi'],
      specialties: ['Coffee'],
      wifi_speed: 'Good WiFi',
      crowd_level: 'Medium',
      phone: '',
      website: '',
      opening_hours: {},
      best_visit_times: { morning: 0, afternoon: 0, evening: 0, night: 0 },
      email: '',
      facebook: '',
      instagram: '',
      twitter: '',
      menu_url: '',
      mood_classification: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })) || []

    return new Response(
      JSON.stringify({
        results: transformedResults,
        status: data.status
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in google-places function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})