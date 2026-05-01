import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBrand } from '@/hooks/useBrand';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const brand = useBrand();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'অনুরোধ ব্যর্থ', description: error.message, variant: 'destructive' });
    } else {
      setSent(true);
      toast({ title: 'ইমেইল পাঠানো হয়েছে', description: 'আপনার ইনবক্স/স্প্যাম ফোল্ডার দেখুন।' });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <DollarSign className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold">{brand.name}</span>
        </Link>

        <div>
          <h1 className="font-display text-2xl font-bold">পাসওয়ার্ড ভুলে গেছেন?</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            আপনার ইমেইল লিখুন। আমরা পাসওয়ার্ড রিসেট লিংক পাঠাব।
          </p>
        </div>

        {sent ? (
          <div className="rounded-lg border bg-card p-4 text-sm">
            <p className="font-medium">✓ লিংক পাঠানো হয়েছে</p>
            <p className="mt-1 text-muted-foreground">
              <strong>{email}</strong> এ একটি রিসেট লিংক পাঠানো হয়েছে। ইমেইল না পেলে স্প্যাম ফোল্ডার দেখুন।
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ইমেইল</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'পাঠানো হচ্ছে...' : 'রিসেট লিংক পাঠান'}
            </Button>
          </form>
        )}

        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> লগইনে ফিরে যান
        </Link>
      </div>
    </div>
  );
}
