import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { User, Mail, Shield, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function Settings() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile]);

  const handleSave = () => {
    if (profile) {
      updateMutation.mutate({ id: profile.id, display_name: displayName.trim() });
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
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : (
              <>
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
              <User className="h-4 w-4" /> প্রোফাইল
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="displayName">প্রদর্শন নাম</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="আপনার নাম লিখুন"
                  />
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
