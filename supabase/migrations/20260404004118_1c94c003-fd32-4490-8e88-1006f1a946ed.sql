
-- 1. User roles system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all roles
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 2. Add subscription fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '1 month'),
  ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'none';

-- 3. Feedback table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT,
  email TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can submit feedback
CREATE POLICY "Authenticated users can submit feedback" ON public.feedback
  FOR INSERT TO authenticated WITH CHECK (true);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Admins and moderators can view all feedback
CREATE POLICY "Admins can view all feedback" ON public.feedback
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Admins can delete feedback
CREATE POLICY "Admins can delete feedback" ON public.feedback
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- 4. Payment requests table
CREATE TABLE public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Users can submit payment requests
CREATE POLICY "Users can submit payment requests" ON public.payment_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can view their own payment requests
CREATE POLICY "Users can view own payments" ON public.payment_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all payment requests
CREATE POLICY "Admins can view all payments" ON public.payment_requests
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Admins can update payment requests (approve/reject)
CREATE POLICY "Admins can update payments" ON public.payment_requests
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER update_payment_requests_updated_at
  BEFORE UPDATE ON public.payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 6. Update handle_new_user to set trial + default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, account_type, trial_start_date, trial_end_date)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    'trial',
    now(),
    now() + INTERVAL '1 month'
  );

  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  -- Default categories
  INSERT INTO public.categories (user_id, name, type) VALUES
    (NEW.id, 'Salary', 'income'),
    (NEW.id, 'Freelance', 'income'),
    (NEW.id, 'Investments', 'income'),
    (NEW.id, 'Other Income', 'income'),
    (NEW.id, 'Food & Dining', 'expense'),
    (NEW.id, 'Transport', 'expense'),
    (NEW.id, 'Housing', 'expense'),
    (NEW.id, 'Utilities', 'expense'),
    (NEW.id, 'Entertainment', 'expense'),
    (NEW.id, 'Shopping', 'expense'),
    (NEW.id, 'Healthcare', 'expense'),
    (NEW.id, 'Other Expense', 'expense');

  RETURN NEW;
END;
$$;
