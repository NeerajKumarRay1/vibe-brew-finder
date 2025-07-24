import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MoodFilter } from "./MoodFilter";
import { BudgetFilter } from "./BudgetFilter";
import { Search, MapPin, Filter, X } from "lucide-react";

interface SearchFiltersProps {
  onFiltersChange: (filters: any) => void;
}

export function SearchFilters({ onFiltersChange }: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleMoodToggle = (mood: string) => {
    const updatedMoods = selectedMoods.includes(mood)
      ? selectedMoods.filter(m => m !== mood)
      : [...selectedMoods, mood];
    setSelectedMoods(updatedMoods);
    onFiltersChange({ moods: updatedMoods, budget: selectedBudget, query: searchQuery, location });
  };

  const handleBudgetChange = (budget: string) => {
    setSelectedBudget(budget);
    onFiltersChange({ moods: selectedMoods, budget, query: searchQuery, location });
  };

  const handleSearch = () => {
    onFiltersChange({ moods: selectedMoods, budget: selectedBudget, query: searchQuery, location });
  };

  const clearFilters = () => {
    setSelectedMoods([]);
    setSelectedBudget("");
    setSearchQuery("");
    setLocation("");
    onFiltersChange({ moods: [], budget: "", query: "", location: "" });
  };

  const activeFiltersCount = selectedMoods.length + (selectedBudget ? 1 : 0);

  return (
    <Card className="bg-gradient-card border-border shadow-soft">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-coffee-bean">
          <span className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Find Your Perfect Cafe
          </span>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-coffee-bean"
            >
              <X className="w-4 h-4 mr-1" />
              Clear ({activeFiltersCount})
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search and Location */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search cafes, neighborhoods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border focus:border-golden-hour"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Location (auto-detected)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 bg-background border-border focus:border-golden-hour"
            />
          </div>
        </div>

        {/* Mood Filters */}
        <MoodFilter selectedMoods={selectedMoods} onMoodToggle={handleMoodToggle} />

        {/* Budget Filter */}
        <BudgetFilter selectedBudget={selectedBudget} onBudgetChange={handleBudgetChange} />

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-coffee-bean hover:text-golden-hour"
          >
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </Button>
          
          <Button 
            onClick={handleSearch}
            className="bg-coffee-bean text-cream hover:bg-espresso-dark shadow-warm"
          >
            Search Cafes
          </Button>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvanced && (
          <Card className="bg-latte-light border-border">
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  "WiFi Speed: Fast",
                  "Power Outlets",
                  "Quiet Environment",
                  "Pet Friendly",
                  "Outdoor Seating",
                  "Parking Available"
                ].map((filter) => (
                  <Badge
                    key={filter}
                    variant="outline"
                    className="cursor-pointer hover:bg-golden-hour hover:text-coffee-bean transition-colors p-2 text-center"
                  >
                    {filter}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}