import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SearchFilters } from "@/components/SearchFilters";
import { CafeCard } from "@/components/CafeCard";
import { EnhancedCafeCard } from "@/components/EnhancedCafeCard";
import { LocationPermission } from "@/components/LocationPermission";
import { LocationSelector } from "@/components/LocationSelector";
import { useAuth } from "@/hooks/useAuth";
import { useCafes, useUserLocation } from "@/hooks/useCafes";
import { useGooglePlaces } from "@/hooks/useGooglePlaces";
import { toast } from "@/hooks/use-toast";
import { Coffee, MapPin, Star, Users, ArrowRight, Sparkles, User, LogOut, Heart, Navigation, AlertCircle } from "lucide-react";
import heroImage from "@/assets/hero-cafe.jpg";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { location, setManualLocation, startWatchingLocation, stopWatchingLocation, isWatching, error: locationError } = useUserLocation();
  const { places: googlePlaces, searchNearbyCafes, loading: googleLoading, error: googleError } = useGooglePlaces();
  const [filters, setFilters] = useState<any>({});
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [useRealtimePlaces, setUseRealtimePlaces] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState<string>('');
  
  // Use real cafe data from database
  const { cafes: dbCafes, loading, error } = useCafes({
    ...filters,
    userLatitude: location?.latitude,
    userLongitude: location?.longitude,
  });

  // Combine database cafes with Google Places results
  const cafes = useRealtimePlaces ? googlePlaces : dbCafes;

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out successfully",
      description: "Come back soon!",
    });
  };

  const handleFindNearMe = () => {
    setShowLocationSelector(true);
  };

  const handleLocationSelected = async (latitude: number, longitude: number, address?: string) => {
    console.log('Location selected:', { latitude, longitude, address });
    setShowLocationSelector(false);
    setUseRealtimePlaces(true);
    setSelectedLocationName(address || 'Selected Location');
    
    // Set the location manually
    setManualLocation(latitude, longitude);
    
    // Start real-time location tracking if it's current location
    if (address === 'Current Location') {
      startWatchingLocation();
    }
    
    // Search for nearby cafes using Google Places
    await searchNearbyCafes(latitude, longitude, 50000);
    
    toast({
      title: "Location set successfully",
      description: `Now showing cafes near ${address || 'your selected location'}`,
    });
  };

  const handleLocationError = (error: string) => {
    console.error('Location error:', error);
    toast({
      title: "Location Error",
      description: error,
      variant: "destructive",
    });
  };

  const handleLocationDenied = () => {
    setShowLocationSelector(false);
    toast({
      title: "Location access denied",
      description: "You can still search for cafes by entering a location manually",
      variant: "destructive",
    });
  };

  // Update Google Places search when location changes - use 50km radius as requested
  useEffect(() => {
    if (location && useRealtimePlaces) {
      searchNearbyCafes(location.latitude, location.longitude, 50000);
    }
  }, [location, useRealtimePlaces, searchNearbyCafes]);

  // Start watching location for authenticated users when they use real-time places (only once)
  useEffect(() => {
    if (user && useRealtimePlaces && location && !isWatching) {
      startWatchingLocation();
    }
    return () => {
      if (isWatching) {
        stopWatchingLocation();
      }
    };
  }, [user, useRealtimePlaces, location]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-20 p-6 bg-gradient-to-r from-coffee-bean/80 via-coffee-bean/60 to-transparent backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-golden-hour drop-shadow-lg">
            CAFE ANALYZER
          </Link>
          
          <div className="flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-cream hover:bg-white/20 drop-shadow-md backdrop-blur-sm">
                    <User className="w-4 h-4 mr-2" />
                    {user.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-sm">
                  <DropdownMenuItem onClick={() => navigate('/favorites')}>
                    <Heart className="w-4 h-4 mr-2" />
                    Favorites
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button 
                  variant="outline" 
                  className="border-2 border-golden-hour text-golden-hour hover:bg-golden-hour hover:text-coffee-bean drop-shadow-md backdrop-blur-sm bg-white/10 font-semibold"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-coffee-bean/80 via-coffee-bean/60 to-transparent" />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          <Badge className="mb-6 bg-golden-hour text-coffee-bean text-sm font-medium px-4 py-2 animate-pulse-soft">
            <Sparkles className="w-4 h-4 mr-2" />
            Intelligent Cafe Discovery
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-golden-hour to-cream bg-clip-text text-transparent mb-6 animate-slide-up">
            CAFE ANALYZER
          </h1>
          
          <p className="text-xl md:text-2xl text-cream/90 mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            Discover cafes that match your mood, budget, and atmosphere preferences. 
            From quiet work spots to vibrant social hubs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <Button 
              size="lg" 
              onClick={handleFindNearMe}
              className="bg-golden-hour text-coffee-bean hover:bg-cream text-lg px-8 py-6 shadow-warm hover:scale-105 transition-all duration-300"
            >
              <MapPin className="w-5 h-5 mr-2" />
              Find Cafes Near Me
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-2 border-cream text-cream hover:bg-cream hover:text-coffee-bean text-lg px-8 py-6 backdrop-blur-sm bg-white/10"
            >
              Explore All Cafes
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Floating Stats */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-8 text-cream">
          <div className="text-center">
            <div className="text-2xl font-bold">1,200+</div>
            <div className="text-sm opacity-80">Verified Cafes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">4.8★</div>
            <div className="text-sm opacity-80">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">50K+</div>
            <div className="text-sm opacity-80">Happy Users</div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section id="search-section" className="py-16 px-6 bg-latte-light">
        {/* Location and Search Section */}
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Location Selector */}
          {!location && (
            <LocationSelector
              onLocationSelected={handleLocationSelected}
              onLocationError={handleLocationError}
              currentLocation={location}
              loading={googleLoading}
            />
          )}

          {/* Current Location Status */}
          {location && (
            <div className="bg-gradient-card rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-coffee-bean">
                      {selectedLocationName || 'Location Set'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {useRealtimePlaces ? `Found ${cafes.length} nearby cafes` : 'Showing database cafes'}
                      {isWatching && ' • Live tracking active'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowLocationSelector(true);
                    }}
                    className="border-golden-hour text-coffee-bean hover:bg-golden-hour"
                  >
                    Change Location
                  </Button>
                  {isWatching && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopWatchingLocation}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      Stop Tracking
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Search Filters */}
          <SearchFilters onFiltersChange={setFilters} />
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-coffee-bean">
                {useRealtimePlaces ? 'Nearby Cafes' : 'Featured Cafes'}
              </h3>
              <p className="text-muted-foreground">
                 {loading || googleLoading ? 'Searching...' : 
                 useRealtimePlaces ? `Found ${cafes.length} cafes within 50km` : 
                 `Showing ${cafes.length} curated cafes`}
              </p>
            </div>
            
            {!location && (
              <Button 
                onClick={handleFindNearMe}
                className="bg-golden-hour text-coffee-bean hover:bg-cream"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Find Near Me
              </Button>
            )}
          </div>

          {/* Error Messages */}
          {(error || googleError || locationError) && (
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">
                    {error || googleError || locationError}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!loading && !error && cafes.map((cafe) => (
              <EnhancedCafeCard 
                key={cafe.id} 
                cafe={cafe} 
                userLocation={location} 
                showDistance={!!location}
              />
            ))}
          </div>

          {!loading && !error && cafes.length === 0 && (
            <Card className="p-8 text-center bg-gradient-card">
              <CardContent className="pt-6">
                <Coffee className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h4 className="text-xl font-semibold text-coffee-bean mb-2">
                  No cafes found
                </h4>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search in a different area
                </p>
                <Button 
                  onClick={() => setFilters({})}
                  variant="outline"
                  className="border-golden-hour text-coffee-bean hover:bg-golden-hour"
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Location Selector Modal */}
      {showLocationSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full">
            <div className="relative">
              <button
                onClick={() => setShowLocationSelector(false)}
                className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
              <LocationSelector
                onLocationSelected={handleLocationSelected}
                onLocationError={handleLocationError}
                currentLocation={location}
                loading={googleLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Real-time Location Status */}
      {isWatching && (
        <div className="fixed bottom-4 right-4 z-40">
          <Card className="bg-green-50 border-green-200 shadow-lg">
            <CardContent className="p-3 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-green-600 animate-pulse" />
              <span className="text-sm text-green-800 font-medium">
                Real-time location active
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  stopWatchingLocation();
                  setUseRealtimePlaces(false);
                  toast({
                    title: "Real-time location disabled",
                    description: "Switched back to database cafes",
                  });
                }}
                className="text-green-600 hover:text-green-800 ml-2"
              >
                Disable
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Features Section */}
      <section className="py-16 px-6 bg-gradient-warm">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-coffee-bean mb-12">
            Why Cafe Analyser?
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 bg-card border-border shadow-soft hover:shadow-warm transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-coffee-bean rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-golden-hour" />
                </div>
                <h4 className="text-xl font-semibold text-coffee-bean mb-2">
                  Smart Matching
                </h4>
                <p className="text-muted-foreground">
                  Our AI understands your mood and preferences to suggest the perfect cafe atmosphere.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 bg-card border-border shadow-soft hover:shadow-warm transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-golden-hour rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-coffee-bean" />
                </div>
                <h4 className="text-xl font-semibold text-coffee-bean mb-2">
                  Real-time Location
                </h4>
                <p className="text-muted-foreground">
                  Live tracking with Google Places API to find actual nearby cafes in real-time.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 bg-card border-border shadow-soft hover:shadow-warm transition-all duration-300">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-cream rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-coffee-bean" />
                </div>
                <h4 className="text-xl font-semibold text-coffee-bean mb-2">
                  Community Insights
                </h4>
                <p className="text-muted-foreground">
                  Verified reviews from coffee lovers, remote workers, and local experts.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;