import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBrand } from '@/hooks/useBrand';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const brand = useBrand();

  useEffect(() => {
    // Supabase auto-handles the recovery token via the URL hash and creates a session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'পাসওয়ার্ড খুব ছোট', description: 'কমপক্ষে ৬ অক্ষর প্রয়োজন', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'পাসওয়ার্ড মিলছে না', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: 'রিসেট ব্যর্থ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'পাসওয়ার্ড পরিবর্তন সফল', description: 'এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।' });
      await supabase.auth.signOut();
      navigate('/login');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <DollarSign className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold">{brand.name}</span>
        </div>

        <div>
          <h1 className="font-display text-2xl font-bold">নতুন পাসওয়ার্ড সেট করুন</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {ready ? 'একটি শক্তিশালী পাসওয়ার্ড লিখুন।' : 'লিংক যাচাই করা হচ্ছে...'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">নতুন পাসওয়ার্ড</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={!ready}
            />
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">🔒 টিপস</p>
            <p>কমপক্ষে ৬ অক্ষর। সম্পূর্ণ ইউনিক রাখুন। <code className="font-mono">Password@123</code> বা <code className="font-mono">Admin@2024</code> এর মতো জনপ্রিয় পাসওয়ার্ড ব্যবহার করবেন না — সিস্টেম এগুলো রিজেক্ট করবে।</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">পাসওয়ার্ড নিশ্চিত করুন</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              disabled={!ready}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !ready}>
            {loading ? 'সংরক্ষণ হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}
          </Button>
        </form>
      </div>
    </div>
  );
}
