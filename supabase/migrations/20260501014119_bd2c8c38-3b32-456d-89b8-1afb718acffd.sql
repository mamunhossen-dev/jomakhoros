CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  label text NOT NULL,
  description text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_flags_public_read" ON public.feature_flags FOR SELECT USING (true);
CREATE POLICY "feature_flags_admin_insert" ON public.feature_flags FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "feature_flags_admin_update" ON public.feature_flags FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "feature_flags_admin_delete" ON public.feature_flags FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.feature_flags (feature_key, enabled, label, description) VALUES
  ('dashboard_tour', true, 'ড্যাশবোর্ড টুর', 'নতুন ইউজারদের জন্য প্রথম লগইনে গাইডেড টুর'),
  ('recurring_transactions', true, 'পুনরাবৃত্তি লেনদেন', 'মাসিক/সাপ্তাহিক/বার্ষিক স্বয়ংক্রিয় লেনদেন'),
  ('data_export', true, 'ডেটা এক্সপোর্ট', 'সেটিংস পেজে CSV/JSON এক্সপোর্ট কার্ড'),
  ('forgot_password', true, 'পাসওয়ার্ড রিসেট', 'লগইন পেজে পাসওয়ার্ড ভুলে গেছেন লিংক'),
  ('pwa_install', true, 'PWA ইন্সটল', 'মোবাইলে অ্যাপ হিসেবে ইন্সটল'),
  ('onboarding_flow', true, 'অনবোর্ডিং ফ্লো', 'নতুন রেজিস্ট্রেশনের পর অনবোর্ডিং পেজ')
ON CONFLICT (feature_key) DO NOTHING;