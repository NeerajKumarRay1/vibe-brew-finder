import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';

interface LocationPermissionProps {
  onLocationGranted: (latitude: number, longitude: number) => void;
  onLocationDenied: () => void;
}

export function LocationPermission({ onLocationGranted, onLocationDenied }: LocationPermissionProps) {
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'loading'>('prompt');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setPermissionState('denied');
      return;
    }

    // Check current permission state
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          setPermissionState('granted');
          getCurrentLocation();
        } else if (result.state === 'denied') {
          setPermissionState('denied');
        }
      });
    }
  }, []);

  const getCurrentLocation = () => {
    setPermissionState('loading');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPermissionState('granted');
        onLocationGranted(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setPermissionState('denied');
        setError(error.message);
        onLocationDenied();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const requestLocation = () => {
    getCurrentLocation();
  };

  if (permissionState === 'granted') {
    return (
      <Alert className="bg-green-50 border-green-200">
        <Navigation className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Location access granted. Searching for nearby cafes...
        </AlertDescription>
      </Alert>
    );
  }

  if (permissionState === 'loading') {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <Navigation className="h-4 w-4 text-blue-600 animate-pulse" />
        <AlertDescription className="text-blue-800">
          Getting your location...
        </AlertDescription>
      </Alert>
    );
  }

  if (permissionState === 'denied') {
    return (
      <Card className="bg-gradient-card border-border">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-coffee-bean">Location Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Location access is required to find nearby cafes. Please enable location permissions and try again.
          </p>
          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
          <Button 
            onClick={requestLocation} 
            className="w-full bg-golden-hour text-coffee-bean hover:bg-cream"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Default state is 'prompt'
  return (
    <Card className="bg-gradient-card border-border">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-golden-hour rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-coffee-bean" />
        </div>
        <CardTitle className="text-coffee-bean">Enable Location Access</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-muted-foreground">
          Allow location access to find the best cafes near you in real-time using Google Places.
        </p>
        
        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Button 
            onClick={requestLocation} 
            className="w-full bg-golden-hour text-coffee-bean hover:bg-cream"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Enable Location Access
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onLocationDenied}
            className="w-full border-border text-muted-foreground hover:bg-muted"
          >
            Skip for Now
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          We use your location only to find nearby cafes. Your privacy is important to us.
        </p>
      </CardContent>
    </Card>
  );
}