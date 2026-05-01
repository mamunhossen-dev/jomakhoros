import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { lovable } from '@/integrations/lovable';
import { useAppSetting } from '@/hooks/useAppSetting';
import { useBrand } from '@/hooks/useBrand';
import { DEFAULT_AUTH, type AuthPagesContent } from '@/components/admin/AuthPagesEditor';

const fmt = (s: string, brand: string) => s.replace(/\{brand\}/g, brand);

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: termsEnabled = true } = useAppSetting<boolean>('terms_checkbox_enabled', true);
  const { data: authData } = useAppSetting<AuthPagesContent>('auth_pages_content', DEFAULT_AUTH);
  const a: AuthPagesContent = { ...DEFAULT_AUTH, ...(authData ?? {}) };
  const brand = useBrand();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (termsEnabled && !agreedToTerms) {
      toast({ title: 'ত্রুটি', description: 'শর্তাবলীতে সম্মত হতে হবে।', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'পাসওয়ার্ড খুব ছোট', description: 'কমপক্ষে ৬ অক্ষর দিন।', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'ত্রুটি', description: 'পাসওয়ার্ড মেলেনি', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);

    if (error) {
      const msg = error.message?.toLowerCase() ?? '';
      const isLeaked =
        msg.includes('pwned') ||
        msg.includes('compromised') ||
        msg.includes('leaked') ||
        msg.includes('breach') ||
        msg.includes('weak');
      toast({
        title: 'রেজিস্ট্রেশন ব্যর্থ',
        description: isLeaked
          ? 'এই পাসওয়ার্ডটি আগে অনলাইন ডেটা লিকে ফাঁস হয়েছে। অনুগ্রহ করে সম্পূর্ণ ইউনিক একটি পাসওয়ার্ড দিন — যেমন ৪টি random শব্দ একসাথে (উদাহরণ: নীল-হাতি-৪২-চাঁদ)।'
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'ইমেইল চেক করুন', description: 'আমরা আপনাকে একটি নিশ্চিতকরণ লিংক পাঠিয়েছি। লিংকে ক্লিক করলে স্বয়ংক্রিয়ভাবে লগইন হবে।' });
    }
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({ title: 'Google সাইন-আপ ব্যর্থ', description: result.error.message, variant: 'destructive' });
      return;
    }
    if (result.redirected) return;
    navigate('/');
  };

  // Render terms text with {link} placeholder
  const renderTerms = () => {
    const parts = a.register_terms_text.split('{link}');
    const link = (
      <Link to="/terms" className="text-primary hover:underline font-medium" target="_blank">
        {a.register_terms_link_label}
      </Link>
    );
    return (
      <>
        {parts[0]}
        {link}
        {parts[1] ?? ''}
      </>
    );
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-2/5 xl:w-1/3 flex-col justify-between bg-sidebar p-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <DollarSign className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-sidebar-foreground">{brand.name}</span>
        </Link>
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight text-sidebar-foreground whitespace-pre-line">
            {fmt(a.register_side_title, brand.name)}
          </h1>
          <p className="mt-4 text-lg text-sidebar-foreground/60">
            {fmt(a.register_side_subtitle, brand.name)}
          </p>
        </div>
        <p className="text-sm text-sidebar-foreground/40">{fmt(a.copyright_text, brand.name)}</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 relative">
        <Link to="/" className="absolute top-4 right-4 text-sm text-muted-foreground hover:text-primary font-medium">
          {a.home_back_label}
        </Link>
        <div className="w-full max-w-sm space-y-6">
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <DollarSign className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">{brand.name}</span>
          </Link>

          <div>
            <h2 className="font-display text-2xl font-bold">{a.register_heading}</h2>
            <p className="mt-1 text-muted-foreground">{a.register_subheading}</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{a.register_email_label}</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{a.register_password_label}</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{a.register_confirm_label}</Label>
              <Input id="confirm-password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>

            {termsEnabled && (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                  {renderTerms()}
                </label>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading || (termsEnabled && !agreedToTerms)}>
              {loading ? a.register_submit_loading : a.register_submit_label}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{a.divider_text}</span>
            </div>
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={termsEnabled && !agreedToTerms}>
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {a.register_google_label}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {a.register_have_account}{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">{a.register_login_link}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
