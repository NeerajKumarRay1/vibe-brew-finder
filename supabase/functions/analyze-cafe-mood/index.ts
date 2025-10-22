import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { cafeId } = await req.json();
    console.log('Analyzing mood for cafe:', cafeId);

    if (!cafeId) {
      return new Response(
        JSON.stringify({ error: 'Cafe ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch reviews for the cafe
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('content, rating')
      .eq('cafe_id', cafeId);

    if (reviewsError) throw reviewsError;

    if (!reviews || reviews.length === 0) {
      return new Response(
        JSON.stringify({ 
          mood_score: { calm: 25, lively: 25, romantic: 25, studyFriendly: 25 },
          dominant_mood: 'neutral',
          message: 'No reviews available for analysis'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare review text for AI analysis
    const reviewTexts = reviews.map(r => r.content).filter(Boolean).join('\n');

    // Call Lovable AI for sentiment analysis
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
            content: 'You are a sentiment analyzer for cafe reviews. Analyze the mood and atmosphere described in reviews and classify them into 4 categories: Calm (peaceful, quiet, relaxed), Lively (energetic, social, bustling), Romantic (intimate, cozy, date-worthy), and Study-Friendly (quiet, wifi, productive). Return ONLY a JSON object with scores for each mood (0-100) and the dominant mood.'
          },
          {
            role: 'user',
            content: `Analyze these cafe reviews and return mood scores as JSON: ${reviewTexts}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error('AI rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add credits to continue.');
      }
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // Parse the AI response
    let moodAnalysis;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        moodAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if no JSON found
        moodAnalysis = {
          calm: 25,
          lively: 25,
          romantic: 25,
          studyFriendly: 25
        };
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      moodAnalysis = {
        calm: 25,
        lively: 25,
        romantic: 25,
        studyFriendly: 25
      };
    }

    // Determine dominant mood
    const moods = Object.entries(moodAnalysis);
    const dominantMood = moods.reduce((a, b) => (a[1] > b[1] ? a : b))[0];

    // Store the analysis result
    const { error: upsertError } = await supabase
      .from('cafe_mood_analysis')
      .upsert({
        cafe_id: cafeId,
        mood_score: moodAnalysis,
        dominant_mood: dominantMood,
        analyzed_at: new Date().toISOString(),
        review_count: reviews.length
      }, { onConflict: 'cafe_id' });

    if (upsertError) throw upsertError;

    // Update cafe with mood classification
    await supabase
      .from('cafes')
      .update({ mood_classification: dominantMood })
      .eq('id', cafeId);

    return new Response(
      JSON.stringify({
        mood_score: moodAnalysis,
        dominant_mood: dominantMood,
        review_count: reviews.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing mood:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});