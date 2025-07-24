import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";

interface BudgetFilterProps {
  selectedBudget: string;
  onBudgetChange: (budget: string) => void;
}

const budgetOptions = [
  { id: "low", label: "$", description: "Under $10", color: "bg-latte-light text-coffee-bean" },
  { id: "medium", label: "$$", description: "$10-20", color: "bg-cream text-coffee-bean" },
  { id: "high", label: "$$$", description: "$20-35", color: "bg-golden-hour text-coffee-bean" },
  { id: "premium", label: "$$$$", description: "Premium", color: "bg-coffee-bean text-cream" },
];

export function BudgetFilter({ selectedBudget, onBudgetChange }: BudgetFilterProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-coffee-bean">Budget Range</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {budgetOptions.map((budget) => (
          <Button
            key={budget.id}
            variant={selectedBudget === budget.id ? "default" : "outline"}
            onClick={() => onBudgetChange(budget.id)}
            className={`
              flex flex-col items-center gap-1 h-16 transition-all duration-300 hover:scale-105
              ${selectedBudget === budget.id 
                ? budget.color + " shadow-warm border-2 border-golden-hour" 
                : "bg-card border-border hover:bg-cream hover:border-golden-hour"
              }
            `}
          >
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span className="font-bold">{budget.label}</span>
            </div>
            <span className="text-xs opacity-80">{budget.description}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}