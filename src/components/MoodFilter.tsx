import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coffee, Users, Heart, Briefcase, BookOpen, Music } from "lucide-react";

interface MoodFilterProps {
  selectedMoods: string[];
  onMoodToggle: (mood: string) => void;
}

const moods = [
  { id: "focus", label: "Need to Focus", icon: BookOpen, color: "bg-coffee-bean text-cream" },
  { id: "social", label: "Social Meetup", icon: Users, color: "bg-golden-hour text-coffee-bean" },
  { id: "romantic", label: "Romantic Date", icon: Heart, color: "bg-cream text-coffee-bean" },
  { id: "business", label: "Business Meeting", icon: Briefcase, color: "bg-espresso-dark text-cream" },
  { id: "chill", label: "Just Chill", icon: Coffee, color: "bg-latte-light text-coffee-bean" },
  { id: "creative", label: "Creative Work", icon: Music, color: "bg-gradient-warm text-coffee-bean" },
];

export function MoodFilter({ selectedMoods, onMoodToggle }: MoodFilterProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-coffee-bean">What's your mood?</h3>
      <div className="flex flex-wrap gap-3">
        {moods.map((mood) => (
          <Button
            key={mood.id}
            variant={selectedMoods.includes(mood.id) ? "default" : "outline"}
            size="sm"
            onClick={() => onMoodToggle(mood.id)}
            className={`
              flex items-center gap-2 transition-all duration-300 hover:scale-105
              ${selectedMoods.includes(mood.id) 
                ? mood.color + " shadow-warm border-2 border-golden-hour" 
                : "bg-card border-border hover:bg-cream hover:border-golden-hour"
              }
            `}
          >
            <mood.icon className="w-4 h-4" />
            {mood.label}
          </Button>
        ))}
      </div>
    </div>
  );
}