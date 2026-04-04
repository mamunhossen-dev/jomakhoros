import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast({ title: 'লগইন ব্যর্থ', description: error.message, variant: 'destructive' });
    } else {
      navigate('/');
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
            আপনার আর্থিক<br />নিয়ন্ত্রণ নিন
          </h1>
          <p className="mt-4 text-lg text-sidebar-foreground/60">
            আয়-ব্যয় ট্র্যাক করুন, বাজেট সেট করুন, সঞ্চয় বাড়ান — সব এক জায়গায়।
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
            <h2 className="font-display text-2xl font-bold">স্বাগতম</h2>
            <p className="mt-1 text-muted-foreground">আপনার অ্যাকাউন্টে সাইন ইন করুন</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ইমেইল</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'সাইন ইন হচ্ছে...' : 'সাইন ইন'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            অ্যাকাউন্ট নেই?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">রেজিস্টার করুন</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
