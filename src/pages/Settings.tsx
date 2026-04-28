import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Shield, Calendar, Phone, MapPin, Upload, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { accountType, isAdmin, isModerator } = useSubscription();
  const updateMutation = useUpdateProfile();
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setPhone((profile as any).phone || '');
      setAddress((profile as any).address || '');
    }
  }, [profile]);

  const handleSave = () => {
    if (profile) {
      updateMutation.mutate({
        id: profile.id,
        display_name: displayName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
      } as any);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error('আপলোড ব্যর্থ: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

    const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile!.id);
    setUploading(false);

    if (updateError) {
      toast.error(updateError.message);
    } else {
      toast.success('প্রোফাইল ছবি আপডেট হয়েছে');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">সেটিংস</h1>
        <p className="text-muted-foreground">আপনার অ্যাকাউন্ট সেটিংস পরিচালনা করুন।</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Account Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Shield className="h-4 w-4" /> অ্যাকাউন্ট তথ্য
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {displayName?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                      <Upload className="h-3 w-3" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                    </label>
                  </div>
                  <div>
                    <p className="font-medium">{displayName || 'নাম নেই'}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      <Badge variant="outline" className={accountType === 'pro' ? 'text-success border-success/30' : accountType === 'trial' ? 'text-primary border-primary/30' : 'text-muted-foreground'}>
                        <Crown className="mr-1 h-3 w-3" />
                        {accountType === 'pro' ? 'প্রো' : accountType === 'trial' ? 'ট্রায়াল' : 'ফ্রি'}
                      </Badge>
                      {isAdmin && <Badge variant="outline" className="text-destructive border-destructive/30">অ্যাডমিন</Badge>}
                      {isModerator && <Badge variant="outline" className="text-yellow-600 border-yellow-600/30">মডারেটর</Badge>}
                    </div>
                    {accountType === 'pro' && profile?.subscription_end && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(profile.subscription_end).getFullYear() >= 2099 
                          ? 'লাইফটাইম ♾' 
                          : `প্রো মেয়াদ: ${format(new Date(profile.subscription_end), 'dd MMM, yyyy')}`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> ইমেইল</Label>
                  <p className="text-sm font-medium">{user?.email}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> যোগদানের তারিখ</Label>
                  <p className="text-sm font-medium">{user?.created_at ? format(new Date(user.created_at), 'dd MMM, yyyy') : '—'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">ইউজার আইডি</Label>
                  <p className="text-xs font-mono text-muted-foreground break-all">{user?.id}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Profile Edit */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <User className="h-4 w-4" /> প্রোফাইল সম্পাদনা
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="displayName">প্রদর্শন নাম</Label>
                  <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="আপনার নাম লিখুন" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1"><Phone className="h-3 w-3" /> ফোন নম্বর</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-1"><MapPin className="h-3 w-3" /> ঠিকানা</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="আপনার ঠিকানা" />
                </div>
                <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
                  {updateMutation.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
