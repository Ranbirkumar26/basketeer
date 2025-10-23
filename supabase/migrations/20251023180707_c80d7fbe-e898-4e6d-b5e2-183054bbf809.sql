-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  hostel TEXT,
  room TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create baskets table
CREATE TABLE public.baskets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  threshold_amount DECIMAL(10, 2) NOT NULL,
  current_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create basket_items table
CREATE TABLE public.basket_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  basket_id UUID NOT NULL REFERENCES public.baskets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_url TEXT,
  product_image TEXT,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baskets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.basket_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Baskets policies
CREATE POLICY "Anyone can view active baskets"
  ON public.baskets FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create baskets"
  ON public.baskets FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their baskets"
  ON public.baskets FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their baskets"
  ON public.baskets FOR DELETE
  USING (auth.uid() = creator_id);

-- Basket items policies
CREATE POLICY "Anyone can view basket items"
  ON public.basket_items FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add items"
  ON public.basket_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
  ON public.basket_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
  ON public.basket_items FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update basket total
CREATE OR REPLACE FUNCTION public.update_basket_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.baskets
  SET current_total = (
    SELECT COALESCE(SUM(price * quantity), 0)
    FROM public.basket_items
    WHERE basket_id = COALESCE(NEW.basket_id, OLD.basket_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.basket_id, OLD.basket_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to update basket total when items change
CREATE TRIGGER on_basket_item_change
  AFTER INSERT OR UPDATE OR DELETE ON public.basket_items
  FOR EACH ROW EXECUTE FUNCTION public.update_basket_total();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_baskets_updated_at
  BEFORE UPDATE ON public.baskets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for baskets and items
ALTER PUBLICATION supabase_realtime ADD TABLE public.baskets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.basket_items;