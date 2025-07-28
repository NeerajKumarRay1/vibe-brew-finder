-- Create cafes table with comprehensive data
CREATE TABLE public.cafes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone TEXT,
  website TEXT,
  image_url TEXT,
  price_range TEXT NOT NULL CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
  is_open BOOLEAN DEFAULT true,
  opening_hours JSONB,
  wifi_speed TEXT,
  atmosphere TEXT[] DEFAULT '{}',
  specialties TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  crowd_level TEXT CHECK (crowd_level IN ('Low', 'Medium', 'High')),
  rating DECIMAL(2,1) DEFAULT 0.0 CHECK (rating >= 0.0 AND rating <= 5.0),
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cafe_id UUID NOT NULL REFERENCES public.cafes(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, cafe_id)
);

-- Create user favorites table
CREATE TABLE public.user_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cafe_id UUID NOT NULL REFERENCES public.cafes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, cafe_id)
);

-- Enable Row Level Security
ALTER TABLE public.cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cafes (public read access)
CREATE POLICY "Anyone can view cafes" ON public.cafes FOR SELECT USING (true);

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create their own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_favorites
CREATE POLICY "Users can view their own favorites" ON public.user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own favorites" ON public.user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites" ON public.user_favorites FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_cafes_location ON public.cafes (latitude, longitude);
CREATE INDEX idx_cafes_rating ON public.cafes (rating DESC);
CREATE INDEX idx_reviews_cafe_id ON public.reviews (cafe_id);
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites (user_id);

-- Create function to update cafe rating when reviews change
CREATE OR REPLACE FUNCTION public.update_cafe_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.cafes 
    SET 
      rating = COALESCE((SELECT AVG(rating) FROM public.reviews WHERE cafe_id = OLD.cafe_id), 0),
      review_count = (SELECT COUNT(*) FROM public.reviews WHERE cafe_id = OLD.cafe_id)
    WHERE id = OLD.cafe_id;
    RETURN OLD;
  ELSE
    UPDATE public.cafes 
    SET 
      rating = (SELECT AVG(rating) FROM public.reviews WHERE cafe_id = NEW.cafe_id),
      review_count = (SELECT COUNT(*) FROM public.reviews WHERE cafe_id = NEW.cafe_id)
    WHERE id = NEW.cafe_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic rating updates
CREATE TRIGGER update_cafe_rating_on_insert
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_cafe_rating();

CREATE TRIGGER update_cafe_rating_on_update
  AFTER UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_cafe_rating();

CREATE TRIGGER update_cafe_rating_on_delete
  AFTER DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_cafe_rating();

-- Create trigger for updated_at columns
CREATE TRIGGER update_cafes_updated_at
  BEFORE UPDATE ON public.cafes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample cafe data
INSERT INTO public.cafes (name, description, address, latitude, longitude, phone, website, image_url, price_range, opening_hours, wifi_speed, atmosphere, specialties, amenities, crowd_level) VALUES
('Artisan Coffee House', 'A cozy neighborhood cafe with locally roasted beans and homemade pastries', '123 Main St, San Francisco, CA 94102', 37.7749, -122.4194, '(555) 123-4567', 'https://artisancoffee.com', '/api/placeholder/400/300', '$$', '{"monday": "7:00-18:00", "tuesday": "7:00-18:00", "wednesday": "7:00-18:00", "thursday": "7:00-18:00", "friday": "7:00-19:00", "saturday": "8:00-19:00", "sunday": "8:00-17:00"}', 'Fast WiFi', '{"Cozy", "Quiet", "Study-friendly"}', '{"Single Origin", "Pour Over", "Pastries"}', '{"WiFi", "Outdoor Seating", "Laptop Friendly"}', 'Medium'),

('Urban Grind', 'Modern coffee shop with industrial decor and specialty drinks', '456 Market St, San Francisco, CA 94105', 37.7849, -122.4094, '(555) 234-5678', 'https://urbangrind.com', '/api/placeholder/400/300', '$$$', '{"monday": "6:30-20:00", "tuesday": "6:30-20:00", "wednesday": "6:30-20:00", "thursday": "6:30-20:00", "friday": "6:30-21:00", "saturday": "7:00-21:00", "sunday": "7:00-19:00"}', 'Ultra Fast WiFi', '{"Modern", "Trendy", "Bustling"}', '{"Espresso", "Cold Brew", "Artisan Roasts"}', '{"WiFi", "Meeting Rooms", "Power Outlets"}', 'High'),

('Peaceful Beans', 'Zen-inspired cafe perfect for meditation and relaxation', '789 Valencia St, San Francisco, CA 94110', 37.7599, -122.4204, '(555) 345-6789', 'https://peacefulbeans.com', '/api/placeholder/400/300', '$$', '{"monday": "8:00-17:00", "tuesday": "8:00-17:00", "wednesday": "8:00-17:00", "thursday": "8:00-17:00", "friday": "8:00-18:00", "saturday": "9:00-18:00", "sunday": "9:00-16:00"}', 'Good WiFi', '{"Peaceful", "Zen", "Quiet"}', '{"Matcha", "Herbal Teas", "Light Bites"}', '{"WiFi", "Garden", "Meditation Space"}', 'Low'),

('Tech Hub Cafe', 'Silicon Valley style cafe with the latest tech and charging stations', '321 Mission St, San Francisco, CA 94103', 37.7899, -122.3974, '(555) 456-7890', 'https://techhub.com', '/api/placeholder/400/300', '$$$', '{"monday": "6:00-22:00", "tuesday": "6:00-22:00", "wednesday": "6:00-22:00", "thursday": "6:00-22:00", "friday": "6:00-23:00", "saturday": "7:00-23:00", "sunday": "7:00-21:00"}', 'Ultra Fast WiFi', '{"Tech-savvy", "Modern", "Networking"}', '{"Nitrogen Coffee", "Energy Drinks", "Protein Bars"}', '{"WiFi", "Charging Stations", "Meeting Pods"}', 'High'),

('Vintage Roasters', 'Classic coffee shop with vintage decor and traditional brewing methods', '654 Castro St, San Francisco, CA 94114', 37.7609, -122.4351, '(555) 567-8901', 'https://vintageroasters.com', '/api/placeholder/400/300', '$$', '{"monday": "7:30-16:00", "tuesday": "7:30-16:00", "wednesday": "7:30-16:00", "thursday": "7:30-16:00", "friday": "7:30-17:00", "saturday": "8:00-17:00", "sunday": "8:00-15:00"}', 'Good WiFi', '{"Vintage", "Classic", "Nostalgic"}', '{"French Press", "Traditional Espresso", "Vintage Blends"}', '{"WiFi", "Vintage Decor", "Record Player"}', 'Medium'),

('Ocean View Coffee', 'Beachside cafe with stunning ocean views and fresh sea breeze', '987 Great Highway, San Francisco, CA 94122', 37.7649, -122.5094, '(555) 678-9012', 'https://oceanviewcoffee.com', '/api/placeholder/400/300', '$$$', '{"monday": "7:00-19:00", "tuesday": "7:00-19:00", "wednesday": "7:00-19:00", "thursday": "7:00-19:00", "friday": "7:00-20:00", "saturday": "6:30-20:00", "sunday": "6:30-19:00"}', 'Fast WiFi', '{"Ocean View", "Relaxing", "Scenic"}', '{"Cold Brew", "Iced Drinks", "Smoothies"}', '{"WiFi", "Ocean View", "Outdoor Seating"}', 'Medium');