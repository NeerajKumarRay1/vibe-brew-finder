import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock, Wifi, Coffee, DollarSign, Users, Heart } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { useFavorites } from "@/hooks/useFavorites";
import { useNavigate } from "react-router-dom";

type Cafe = Database['public']['Tables']['cafes']['Row'] & {
  distance?: number;
};

interface CafeCardProps {
  cafe: Cafe;
}

export function CafeCard({ cafe }: CafeCardProps) {
  const navigate = useNavigate();
  const { toggleFavorite, isFavorited } = useFavorites();

  const getCrowdColor = (level: string) => {
    switch (level) {
      case "Low": return "bg-latte-light text-coffee-bean";
      case "Medium": return "bg-golden-hour text-coffee-bean";  
      case "High": return "bg-coffee-bean text-cream";
      default: return "bg-cream text-coffee-bean";
    }
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    return `${distance.toFixed(1)} km`;
  };

  const getDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(cafe.address)}`;
    window.open(url, '_blank');
  };

  return (
    <Card className="group hover:shadow-warm transition-all duration-300 hover:-translate-y-1 bg-gradient-card border-border">
      <CardHeader className="p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          <img 
            src={cafe.image_url || "/api/placeholder/400/300"} 
            alt={cafe.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={`${cafe.is_open ? "bg-green-500" : "bg-red-500"} text-white`}>
              {cafe.is_open ? "Open" : "Closed"}
            </Badge>
            {cafe.crowd_level && (
              <Badge className={getCrowdColor(cafe.crowd_level)}>
                <Users className="w-3 h-3 mr-1" />
                {cafe.crowd_level}
              </Badge>
            )}
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(cafe.id);
              }}
              className={`p-1 h-auto ${isFavorited(cafe.id) ? 'text-red-500 hover:text-red-600' : 'text-white hover:text-red-500'} bg-black/20 backdrop-blur-sm rounded-full`}
            >
              <Heart className={`w-4 h-4 ${isFavorited(cafe.id) ? 'fill-current' : ''}`} />
            </Button>
            <Badge className="bg-coffee-bean text-cream">
              <DollarSign className="w-3 h-3 mr-1" />
              {cafe.price_range}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg text-coffee-bean group-hover:text-golden-hour transition-colors">
            {cafe.name}
          </h3>
          <div className="flex items-center gap-1 text-golden-hour">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium">{Number(cafe.rating).toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({cafe.review_count})</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {cafe.distance && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{formatDistance(cafe.distance)}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{cafe.is_open ? "Open" : "Closed"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Wifi className="w-4 h-4" />
            <span>{cafe.wifi_speed}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{cafe.address}</p>

        <div className="flex flex-wrap gap-2">
          {cafe.atmosphere?.slice(0, 2).map((vibe, index) => (
            <Badge key={index} variant="secondary" className="text-xs bg-cream text-coffee-bean">
              {vibe}
            </Badge>
          ))}
          {cafe.specialties?.slice(0, 1).map((specialty, index) => (
            <Badge key={index} className="text-xs bg-golden-hour text-coffee-bean">
              <Coffee className="w-3 h-3 mr-1" />
              {specialty}
            </Badge>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            className="flex-1 bg-coffee-bean text-cream hover:bg-espresso-dark"
            onClick={() => navigate(`/cafe/${cafe.id}`)}
          >
            View Details
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 border-golden-hour text-coffee-bean hover:bg-golden-hour hover:text-coffee-bean"
            onClick={getDirections}
          >
            Get Directions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}