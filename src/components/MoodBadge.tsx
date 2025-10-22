import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Heart, BookOpen } from 'lucide-react';

interface MoodBadgeProps {
  mood: string;
  size?: 'default' | 'sm' | 'lg';
}

export function MoodBadge({ mood, size = 'default' }: MoodBadgeProps) {
  const moodConfig = {
    calm: { icon: Sparkles, label: 'Calm', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    lively: { icon: Zap, label: 'Lively', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    romantic: { icon: Heart, label: 'Romantic', className: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' },
    studyFriendly: { icon: BookOpen, label: 'Study-Friendly', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  };

  const config = moodConfig[mood as keyof typeof moodConfig] || moodConfig.calm;
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} gap-1`} variant="secondary">
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
      {config.label}
    </Badge>
  );
}