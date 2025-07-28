import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Star, MapPin, Clock, Wifi, Phone, Globe, Heart, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { useReviews, useCreateReview } from '@/hooks/useReviews';
import { useFavorites } from '@/hooks/useFavorites';

type Cafe = Database['public']['Tables']['cafes']['Row'];

export default function CafeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [rating, setRating] = useState(5);
  
  const { reviews, refetch: refetchReviews } = useReviews(id || '');
  const { createReview, loading: reviewLoading } = useCreateReview();
  const { toggleFavorite, isFavorited } = useFavorites();

  useEffect(() => {
    if (id) {
      fetchCafe();
    }
  }, [id]);

  const fetchCafe = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('cafes')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setCafe(data);
    } catch (error) {
      console.error('Error fetching cafe:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!id) return;
    
    const { error } = await createReview(id, rating, reviewTitle, reviewContent);
    if (!error) {
      setReviewTitle('');
      setReviewContent('');
      setRating(5);
      refetchReviews();
    }
  };

  const getDirections = () => {
    if (cafe) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(cafe.address)}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-page flex items-center justify-center">
        <div className="text-coffee-bean">Loading cafe details...</div>
      </div>
    );
  }

  if (!cafe) {
    return (
      <div className="min-h-screen bg-gradient-page flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-coffee-bean mb-4">Cafe not found</h2>
          <Button onClick={() => navigate('/')}>Go back home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-page">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/')} className="text-coffee-bean hover:text-golden-hour">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Search
            </Button>
            <Button
              variant="ghost"
              onClick={() => toggleFavorite(cafe.id)}
              className={`${isFavorited(cafe.id) ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'}`}
            >
              <Heart className={`w-5 h-5 ${isFavorited(cafe.id) ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Section */}
            <Card className="overflow-hidden bg-gradient-card border-border">
              <div className="relative h-64 md:h-80">
                <img 
                  src={cafe.image_url || "/api/placeholder/800/400"} 
                  alt={cafe.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h1 className="text-3xl font-bold mb-2">{cafe.name}</h1>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-golden-hour text-golden-hour" />
                      <span className="font-medium">{cafe.rating}</span>
                      <span className="text-sm opacity-90">({cafe.review_count} reviews)</span>
                    </div>
                    <Badge className={`${cafe.is_open ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                      {cafe.is_open ? 'Open' : 'Closed'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* Description */}
            {cafe.description && (
              <Card className="bg-gradient-card border-border">
                <CardContent className="p-6">
                  <p className="text-muted-foreground">{cafe.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="text-coffee-bean">Features & Atmosphere</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-coffee-bean mb-2">Atmosphere</h4>
                  <div className="flex flex-wrap gap-2">
                    {cafe.atmosphere?.map((mood, index) => (
                      <Badge key={index} variant="secondary" className="bg-cream text-coffee-bean">
                        {mood}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-coffee-bean mb-2">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {cafe.specialties?.map((specialty, index) => (
                      <Badge key={index} className="bg-golden-hour text-coffee-bean">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-coffee-bean mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {cafe.amenities?.map((amenity, index) => (
                      <Badge key={index} variant="outline" className="border-golden-hour text-coffee-bean">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="text-coffee-bean flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Reviews ({reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Write Review */}
                {user && (
                  <div className="border-b border-border pb-6">
                    <h4 className="font-medium text-coffee-bean mb-4">Write a Review</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-coffee-bean">Rating</label>
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-6 h-6 cursor-pointer ${
                                star <= rating ? 'fill-golden-hour text-golden-hour' : 'text-muted-foreground'
                              }`}
                              onClick={() => setRating(star)}
                            />
                          ))}
                        </div>
                      </div>
                      <Input
                        placeholder="Review title (optional)"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                      />
                      <Textarea
                        placeholder="Share your experience..."
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        rows={3}
                      />
                      <Button 
                        onClick={handleSubmitReview} 
                        disabled={reviewLoading}
                        className="bg-coffee-bean text-cream hover:bg-espresso-dark"
                      >
                        {reviewLoading ? 'Posting...' : 'Post Review'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-border rounded-lg p-4 bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                        <span className="font-medium text-coffee-bean">
                          Anonymous User
                        </span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-golden-hour text-golden-hour" />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.title && (
                        <h5 className="font-medium text-coffee-bean mb-1">{review.title}</h5>
                      )}
                      {review.content && (
                        <p className="text-muted-foreground">{review.content}</p>
                      )}
                    </div>
                  ))}
                  {reviews.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No reviews yet. Be the first to review this cafe!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact & Info */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="text-coffee-bean">Contact & Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-golden-hour mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{cafe.address}</p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-coffee-bean hover:text-golden-hour"
                      onClick={getDirections}
                    >
                      Get Directions
                    </Button>
                  </div>
                </div>

                {cafe.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-golden-hour" />
                    <a href={`tel:${cafe.phone}`} className="text-sm text-coffee-bean hover:text-golden-hour">
                      {cafe.phone}
                    </a>
                  </div>
                )}

                {cafe.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-golden-hour" />
                    <a 
                      href={cafe.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-coffee-bean hover:text-golden-hour"
                    >
                      Visit Website
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Wifi className="w-5 h-5 text-golden-hour" />
                  <span className="text-sm text-muted-foreground">{cafe.wifi_speed}</span>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Price Range</span>
                    <Badge className="bg-coffee-bean text-cream">{cafe.price_range}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Crowd Level</span>
                    <Badge className={`${
                      cafe.crowd_level === 'Low' ? 'bg-latte-light text-coffee-bean' :
                      cafe.crowd_level === 'Medium' ? 'bg-golden-hour text-coffee-bean' :
                      'bg-coffee-bean text-cream'
                    }`}>
                      {cafe.crowd_level}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hours */}
            {cafe.opening_hours && (
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle className="text-coffee-bean flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(cafe.opening_hours as Record<string, string>).map(([day, hours]) => (
                      <div key={day} className="flex justify-between text-sm">
                        <span className="capitalize text-muted-foreground">{day}</span>
                        <span className="text-coffee-bean">{hours}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}