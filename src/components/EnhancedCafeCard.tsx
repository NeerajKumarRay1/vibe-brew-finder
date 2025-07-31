import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Heart, ExternalLink, Clock, Users, Wifi, DollarSign } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import type { Database } from '@/integrations/supabase/types';

type Cafe = Database['public']['Tables']['cafes']['Row'] & { distance?: number };

interface EnhancedCafeCardProps {
  cafe: Cafe;
  userLocation?: { latitude: number; longitude: number };
  showDistance?: boolean;
}

export function EnhancedCafeCard({ cafe, userLocation, showDistance = true }: EnhancedCafeCardProps) {
  const [showingDistance, setShowingDistance] = useState(false);
  const { toggleFavorite, isFavorited } = useFavorites();
  const isCurrentlyFavorited = isFavorited(cafe.id);

  const handleFavoriteToggle = async () => {
    await toggleFavorite(cafe.id);
  };

  const handleInterested = () => {
    setShowingDistance(true);
  };

  const handleOpenInMaps = () => {
    if (userLocation) {
      // Create Google Maps URL with directions
      const directionsUrl = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${cafe.latitude},${cafe.longitude}`;
      window.open(directionsUrl, '_blank');
    } else {
      // Just show the location
      const locationUrl = `https://www.google.com/maps/search/?api=1&query=${cafe.latitude},${cafe.longitude}`;
      window.open(locationUrl, '_blank');
    }
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const getCrowdColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriceColor = (price: string) => {
    switch (price) {
      case '$': return 'text-green-600';
      case '$$': return 'text-yellow-600';
      case '$$$': return 'text-orange-600';
      case '$$$$': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 bg-gradient-card border-border">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg text-coffee-bean">{cafe.name}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <MapPin className="w-3 h-3 mr-1" />
              <span className="truncate">{cafe.address}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFavoriteToggle}
            className="shrink-0 ml-2"
          >
            <Heart className={`w-4 h-4 ${isCurrentlyFavorited ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Cafe Image */}
        {cafe.image_url && (
          <div className="aspect-video rounded-lg overflow-hidden">
            <img 
              src={cafe.image_url} 
              alt={cafe.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Distance Display */}
        {showDistance && cafe.distance !== undefined && (
          <div className="flex items-center justify-between p-3 bg-gradient-subtle rounded-lg">
            <div className="flex items-center">
              <Navigation className="w-4 h-4 mr-2 text-primary" />
              <span className="font-medium">{formatDistance(cafe.distance)} away</span>
            </div>
            {showingDistance && (
              <Badge variant="secondary" className="bg-golden-hour text-coffee-bean">
                Distance shown
              </Badge>
            )}
          </div>
        )}

        {/* Cafe Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className={cafe.is_open ? 'text-green-600' : 'text-red-600'}>
              {cafe.is_open ? 'Open' : 'Closed'}
            </span>
          </div>
          
          <div className="flex items-center">
            <DollarSign className={`w-4 h-4 mr-1 ${getPriceColor(cafe.price_range)}`} />
            <span className={`font-medium ${getPriceColor(cafe.price_range)}`}>
              {cafe.price_range}
            </span>
          </div>

          {cafe.crowd_level && (
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-muted-foreground" />
              <Badge className={getCrowdColor(cafe.crowd_level)} variant="secondary">
                {cafe.crowd_level}
              </Badge>
            </div>
          )}

          {cafe.wifi_speed && (
            <div className="flex items-center">
              <Wifi className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">{cafe.wifi_speed}</span>
            </div>
          )}
        </div>

        {/* Atmosphere Tags */}
        {cafe.atmosphere && cafe.atmosphere.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {cafe.atmosphere.slice(0, 3).map((mood, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {mood}
              </Badge>
            ))}
            {cafe.atmosphere.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{cafe.atmosphere.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleInterested}
            className="flex-1 bg-golden-hour text-coffee-bean hover:bg-cream"
            disabled={showingDistance}
          >
            {showingDistance ? 'Interested ✓' : 'Interested'}
          </Button>
          
          <Button 
            onClick={handleOpenInMaps}
            variant="outline"
            className="flex-1 border-border hover:bg-muted"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            See on Map
          </Button>
        </div>

        {/* Description */}
        {cafe.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {cafe.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}