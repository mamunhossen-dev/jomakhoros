-- Add priority and assignment to support threads
ALTER TABLE public.support_threads
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS assigned_to uuid;

-- Support reply templates
CREATE TABLE IF NOT EXISTS public.support_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/mods view templates"
ON public.support_templates FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Admins insert templates"
ON public.support_templates FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update templates"
ON public.support_templates FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete templates"
ON public.support_templates FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_support_templates_updated_at
BEFORE UPDATE ON public.support_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed a few useful Bengali templates
INSERT INTO public.support_templates (name, content, category) VALUES
  ('স্বাগতম', 'আপনার বার্তার জন্য ধন্যবাদ। আমরা শীঘ্রই আপনার সমস্যা সমাধান করব।', 'greeting'),
  ('পেমেন্ট যাচাই হচ্ছে', 'আপনার পেমেন্ট রিকোয়েস্ট যাচাই করা হচ্ছে। ২৪ ঘণ্টার মধ্যে অনুমোদন হয়ে যাবে ইনশাআল্লাহ।', 'payment'),
  ('TxID প্রয়োজন', 'অনুগ্রহ করে আপনার পেমেন্টের সঠিক TxID/ট্রানজেকশন নম্বরটি পাঠান যাতে আমরা যাচাই করতে পারি।', 'payment'),
  ('সমস্যা সমাধান হয়েছে', 'আপনার সমস্যাটি সমাধান করা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন। ধন্যবাদ!', 'closing'),
  ('ধন্যবাদ', 'JomaKhoros ব্যবহারের জন্য আপনাকে ধন্যবাদ! আরও কোনো সমস্যা হলে জানাবেন।', 'closing')
ON CONFLICT DO NOTHING;