import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LocationSelectorProps {
  onLocationSelected: (latitude: number, longitude: number, address?: string) => void;
  onLocationError: (error: string) => void;
  currentLocation?: { latitude: number; longitude: number } | null;
  loading?: boolean;
}

export function LocationSelector({ 
  onLocationSelected, 
  onLocationError, 
  currentLocation,
  loading = false 
}: LocationSelectorProps) {
  const [manualLocation, setManualLocation] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);

  const detectCurrentLocation = async () => {
    if (!navigator.geolocation) {
      onLocationError('Geolocation is not supported by this browser');
      return;
    }

    setIsDetecting(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetecting(false);
        onLocationSelected(
          position.coords.latitude, 
          position.coords.longitude,
          'Current Location'
        );
      },
      (error) => {
        setIsDetecting(false);
        let errorMessage = 'Failed to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        onLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const searchManualLocation = async () => {
    if (!manualLocation.trim()) return;

    setManualLoading(true);
    
    try {
      // Use a simple geocoding approach via nominatim (free service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualLocation)}&format=json&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search location');
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const location = data[0];
        onLocationSelected(
          parseFloat(location.lat), 
          parseFloat(location.lon),
          location.display_name
        );
      } else {
        onLocationError('Location not found. Please try a different search term.');
      }
    } catch (error) {
      onLocationError('Failed to search for location. Please try again.');
    } finally {
      setManualLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchManualLocation();
    }
  };

  return (
    <Card className="bg-gradient-card border-border">
      <CardHeader>
        <CardTitle className="text-coffee-bean flex items-center gap-2">
          <MapPin className="w-5 h-5 text-golden-hour" />
          Find Nearby Cafes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Location Detection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-coffee-bean">Use Current Location</h4>
            {currentLocation && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Navigation className="w-3 h-3 mr-1" />
                Located
              </Badge>
            )}
          </div>
          
          <Button 
            onClick={detectCurrentLocation}
            disabled={isDetecting || loading}
            className="w-full bg-golden-hour text-coffee-bean hover:bg-cream"
          >
            {isDetecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Detecting Location...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2" />
                Use My Location
              </>
            )}
          </Button>
        </div>

        <div className="text-center text-muted-foreground">
          <span>or</span>
        </div>

        {/* Manual Location Input */}
        <div className="space-y-3">
          <h4 className="font-medium text-coffee-bean">Enter Location Manually</h4>
          <div className="flex gap-2">
            <Input
              placeholder="Enter city, address, or landmark..."
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={searchManualLocation}
              disabled={!manualLocation.trim() || manualLoading || loading}
              variant="outline"
              className="border-golden-hour text-coffee-bean hover:bg-golden-hour"
            >
              {manualLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Try: "San Francisco", "New York", "Times Square", or any address
          </div>
        </div>

        {/* Quick Location Suggestions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-coffee-bean">Quick Locations</h4>
          <div className="flex flex-wrap gap-2">
            {[
              { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
              { name: 'New York', lat: 40.7128, lng: -74.0060 },
              { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
              { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
            ].map((city) => (
              <Button
                key={city.name}
                variant="outline"
                size="sm"
                onClick={() => onLocationSelected(city.lat, city.lng, city.name)}
                disabled={loading}
                className="text-xs border-border hover:bg-muted"
              >
                {city.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Status Information */}
        {currentLocation && (
          <Alert className="bg-green-50 border-green-200">
            <Navigation className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Location detected! Searching for nearby cafes...
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}