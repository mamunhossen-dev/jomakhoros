import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      toast({ title: 'ত্রুটি', description: 'শর্তাবলীতে সম্মত হতে হবে।', variant: 'destructive' });
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
      toast({ title: 'রেজিস্ট্রেশন ব্যর্থ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'ইমেইল চেক করুন', description: 'আমরা আপনাকে একটি নিশ্চিতকরণ লিংক পাঠিয়েছি। লিংকে ক্লিক করলে স্বয়ংক্রিয়ভাবে লগইন হবে।' });
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-sidebar p-10">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <DollarSign className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-sidebar-foreground">JomaKhoros</span>
        </div>
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight text-sidebar-foreground">
            আপনার আর্থিক<br />যাত্রা শুরু করুন
          </h1>
          <p className="mt-4 text-lg text-sidebar-foreground/60">
            হাজারো মানুষ ইতোমধ্যে JomaKhoros দিয়ে স্মার্টভাবে অর্থ পরিচালনা করছে।
          </p>
        </div>
        <p className="text-sm text-sidebar-foreground/40">© 2026 JomaKhoros</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <DollarSign className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">JomaKhoros</span>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold">অ্যাকাউন্ট তৈরি করুন</h2>
            <p className="mt-1 text-muted-foreground">বিনামূল্যে শুরু করুন — হিসাব রাখুন নিশ্চিন্তে!</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ইমেইল</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">পাসওয়ার্ড নিশ্চিত করুন</Label>
              <Input id="confirm-password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                আমি <Link to="/terms" className="text-primary hover:underline font-medium" target="_blank">শর্তাবলী</Link> পড়েছি এবং সম্মত আছি
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !agreedToTerms}>
              {loading ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'রেজিস্টার করুন'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            ইতোমধ্যে অ্যাকাউন্ট আছে?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">সাইন ইন করুন</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
