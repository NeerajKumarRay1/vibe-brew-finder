import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SearchFilters } from "@/components/SearchFilters";
import { CafeCard } from "@/components/CafeCard";
import { useAuth } from "@/hooks/useAuth";
import { Coffee, MapPin, Star, Users, ArrowRight, Sparkles, User, LogOut } from "lucide-react";
import heroImage from "@/assets/hero-cafe.jpg";
import cafe1 from "@/assets/cafe-1.jpg";
import cafe2 from "@/assets/cafe-2.jpg";
import cafe3 from "@/assets/cafe-3.jpg";

const mockCafes = [
  {
    id: "1",
    name: "Artisan Coffee Co.",
    image: cafe1,
    rating: 4.8,
    reviewCount: 342,
    distance: "0.3 miles",
    address: "123 Coffee Street, Downtown",
    priceRange: "$$",
    isOpen: true,
    openUntil: "9:00 PM",
    wifiSpeed: "Fast",
    atmosphere: ["Cozy", "Work-friendly"],
    specialties: ["Specialty Roast", "Fresh Pastries"],
    crowdLevel: "Medium" as const,
  },
  {
    id: "2", 
    name: "The Reading Nook",
    image: cafe2,
    rating: 4.6,
    reviewCount: 198,
    distance: "0.5 miles",
    address: "456 Book Avenue, Arts District",
    priceRange: "$",
    isOpen: true,
    openUntil: "8:00 PM",
    wifiSpeed: "Moderate",
    atmosphere: ["Quiet", "Bookstore"],
    specialties: ["Local Roaster", "Book Browse"],
    crowdLevel: "Low" as const,
  },
  {
    id: "3",
    name: "Modern Grind",
    image: cafe3,
    rating: 4.7,
    reviewCount: 287,
    distance: "0.8 miles", 
    address: "789 Tech Plaza, Innovation Hub",
    priceRange: "$$$",
    isOpen: false,
    openUntil: "Closed",
    wifiSpeed: "Ultra Fast",
    atmosphere: ["Modern", "Minimalist"],
    specialties: ["Cold Brew", "Vegan Options"],
    crowdLevel: "High" as const,
  },
];

const Index = () => {
  const [filters, setFilters] = useState<any>({});
  const [filteredCafes, setFilteredCafes] = useState(mockCafes);
  const { user, signOut } = useAuth();

  useEffect(() => {
    // Simple filtering logic for demo
    let filtered = mockCafes;
    
    if (filters.moods?.length > 0) {
      filtered = filtered.filter(cafe => 
        filters.moods.some((mood: string) => {
          switch (mood) {
            case "focus": return cafe.atmosphere.includes("Quiet") || cafe.atmosphere.includes("Work-friendly");
            case "social": return cafe.crowdLevel === "Medium" || cafe.crowdLevel === "High";
            case "romantic": return cafe.atmosphere.includes("Cozy");
            case "business": return cafe.atmosphere.includes("Modern") || cafe.wifiSpeed === "Ultra Fast";
            case "chill": return cafe.atmosphere.includes("Cozy");
            case "creative": return cafe.atmosphere.includes("Bookstore") || cafe.atmosphere.includes("Arts");
            default: return true;
          }
        })
      );
    }

    if (filters.budget) {
      filtered = filtered.filter(cafe => {
        switch (filters.budget) {
          case "low": return cafe.priceRange === "$";
          case "medium": return cafe.priceRange === "$$";
          case "high": return cafe.priceRange === "$$$";
          case "premium": return cafe.priceRange === "$$$$";
          default: return true;
        }
      });
    }

    setFilteredCafes(filtered);
  }, [filters]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-cream">
            CAFE ANALYZER
          </Link>
          
          <div className="flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-cream hover:bg-white/10">
                    <User className="w-4 h-4 mr-2" />
                    {user.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="outline" className="border-cream text-cream hover:bg-cream hover:text-coffee-bean">
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
              className="bg-golden-hour text-coffee-bean hover:bg-cream text-lg px-8 py-6 shadow-warm hover:scale-105 transition-all duration-300"
            >
              <MapPin className="w-5 h-5 mr-2" />
              Find Cafes Near Me
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-cream text-cream hover:bg-cream hover:text-coffee-bean text-lg px-8 py-6 backdrop-blur-sm bg-white/10"
            >
              Learn More
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
      <section className="py-16 px-6 bg-latte-light">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-coffee-bean mb-4">
              Discover Your Ideal Cafe
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Use our intelligent filters to find cafes that perfectly match your current needs and preferences.
            </p>
          </div>

          <SearchFilters onFiltersChange={setFilters} />
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-coffee-bean mb-2">
                {filteredCafes.length} Cafes Found
              </h3>
              <p className="text-muted-foreground">
                Sorted by relevance and distance
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge className="bg-cream text-coffee-bean">
                <Star className="w-3 h-3 mr-1" />
                Top Rated
              </Badge>
              <Badge className="bg-golden-hour text-coffee-bean">
                <Users className="w-3 h-3 mr-1" />
                Popular Now
              </Badge>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCafes.map((cafe) => (
              <CafeCard key={cafe.id} cafe={cafe} />
            ))}
          </div>

          {filteredCafes.length === 0 && (
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
                  Location Intelligence
                </h4>
                <p className="text-muted-foreground">
                  Real-time data on crowd levels, WiFi speed, and amenities to help you choose wisely.
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