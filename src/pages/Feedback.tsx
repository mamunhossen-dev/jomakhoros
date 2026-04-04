import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Feedback() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('feedback').insert({
      user_id: user?.id,
      name: name.trim() || null,
      email: email.trim() || null,
      message: message.trim(),
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('আপনার মতামত সফলভাবে পাঠানো হয়েছে!');
      setName('');
      setMessage('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">মতামত / ফিডব্যাক</h1>
        <p className="text-muted-foreground">আপনার মতামত আমাদের জানান।</p>
      </div>

      <Card className="border-0 shadow-sm max-w-lg">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> ফিডব্যাক ফর্ম
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>নাম (ঐচ্ছিক)</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="আপনার নাম" />
            </div>
            <div className="space-y-2">
              <Label>ইমেইল (ঐচ্ছিক)</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label>মতামত <span className="text-destructive">*</span></Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="আপনার মতামত এখানে লিখুন..." required />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !message.trim()}>
              <Send className="mr-1 h-4 w-4" /> {loading ? 'পাঠানো হচ্ছে...' : 'পাঠান'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
