-- Create menu items table
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cafe_id UUID NOT NULL REFERENCES public.cafes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(8,2) NOT NULL,
  category TEXT NOT NULL, -- 'Coffee', 'Food', 'Pastries', 'Beverages', 'Desserts'
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing menu items
CREATE POLICY "Anyone can view menu items" 
ON public.menu_items 
FOR SELECT 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update cafes with real cafe images from Unsplash
UPDATE public.cafes 
SET image_url = CASE 
  WHEN name = 'Artisan Coffee House' THEN 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop'
  WHEN name = 'Urban Grind' THEN 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop'
  WHEN name = 'Peaceful Beans' THEN 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
  WHEN name = 'Tech Hub Cafe' THEN 'https://images.unsplash.com/photo-1559496417-e7f25cb247cd?w=800&h=600&fit=crop'
  WHEN name = 'Vintage Roasters' THEN 'https://images.unsplash.com/photo-1512568400610-62da28bc8a13?w=800&h=600&fit=crop'
  WHEN name = 'Ocean View Coffee' THEN 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&h=600&fit=crop'
  ELSE image_url
END;

-- Insert sample menu items for each cafe
INSERT INTO public.menu_items (cafe_id, name, description, price, category, image_url) 
SELECT 
  c.id,
  menu.name,
  menu.description,
  menu.price,
  menu.category,
  menu.image_url
FROM public.cafes c
CROSS JOIN (
  VALUES 
    ('Espresso', 'Rich and bold shot of premium coffee', 3.50, 'Coffee', 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&h=300&fit=crop'),
    ('Cappuccino', 'Perfect balance of espresso, steamed milk, and foam', 4.25, 'Coffee', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop'),
    ('Latte', 'Smooth espresso with steamed milk and light foam', 4.75, 'Coffee', 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&h=300&fit=crop'),
    ('Americano', 'Espresso with hot water for a clean, strong taste', 3.75, 'Coffee', 'https://images.unsplash.com/photo-1514432324540-3593c1ba1c80?w=400&h=300&fit=crop'),
    ('Cold Brew', 'Smooth, refreshing cold-steeped coffee', 4.00, 'Coffee', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop'),
    ('Croissant', 'Buttery, flaky French pastry', 3.25, 'Pastries', 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=400&h=300&fit=crop'),
    ('Avocado Toast', 'Fresh avocado on artisan bread with seasonings', 8.50, 'Food', 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop'),
    ('Blueberry Muffin', 'Fresh baked muffin loaded with blueberries', 3.75, 'Pastries', 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&h=300&fit=crop'),
    ('Green Tea', 'Premium loose leaf green tea', 3.00, 'Beverages', 'https://images.unsplash.com/photo-1556881286-fc50572a5513?w=400&h=300&fit=crop'),
    ('Chocolate Cake', 'Rich chocolate cake with ganache', 5.50, 'Desserts', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop')
) AS menu(name, description, price, category, image_url);