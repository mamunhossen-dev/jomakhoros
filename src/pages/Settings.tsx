import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Shield, Calendar, Phone, MapPin, Upload, Crown, Trash2, AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { DataExportCard } from '@/components/DataExportCard';
import { useFeatureFlag } from '@/hooks/useFeatureFlags';
import { PageMeta } from '@/components/PageMeta';

export default function Settings() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { accountType, isAdmin, isModerator } = useSubscription();
  const updateMutation = useUpdateProfile();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('পাসওয়ার্ড মিলছে না');
      return;
    }
    setChangingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPwd(false);
    if (error) {
      toast.error(error.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ');
      return;
    }
    toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('নিশ্চিত করতে DELETE লিখুন');
      return;
    }
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      toast.success('আপনার অ্যাকাউন্ট মুছে ফেলা হয়েছে');
      await supabase.auth.signOut();
      navigate('/login', { replace: true });
    } catch (e) {
      toast.error((e as Error).message || 'অ্যাকাউন্ট মুছতে ব্যর্থ');
      setDeleting(false);
    }
  };

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
      <PageMeta title="সেটিংস | JomaKhoros" description="অ্যাকাউন্ট সেটিংস, প্রোফাইল ও ডেটা পরিচালনা।" canonicalPath="/settings" />
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

      {/* Password Change */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Lock className="h-4 w-4" /> পাসওয়ার্ড পরিবর্তন
          </CardTitle>
          <CardDescription>
            নিরাপত্তার জন্য একটি শক্তিশালী পাসওয়ার্ড ব্যবহার করুন (কমপক্ষে ৬ অক্ষর)।
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">নতুন পাসওয়ার্ড</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPwd ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="নতুন পাসওয়ার্ড লিখুন"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPwd ? 'লুকান' : 'দেখান'}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">পাসওয়ার্ড নিশ্চিত করুন</Label>
              <Input
                id="confirmPassword"
                type={showPwd ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="আবার লিখুন"
                autoComplete="new-password"
              />
            </div>
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={changingPwd || !newPassword || !confirmPassword}
            className="w-full md:w-auto"
          >
            {changingPwd ? 'পরিবর্তন হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}
          </Button>
        </CardContent>
      </Card>

      {/* Data Export */}
      <DataExportGate />

      {/* Danger Zone — Account Deletion */}
      <Card className="border-destructive/30 shadow-sm">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" /> বিপজ্জনক জোন
          </CardTitle>
          <CardDescription>
            অ্যাকাউন্ট ডিলিট করলে আপনার সকল ডেটা (লেনদেন, ওয়ালেট, ক্যাটেগরি, বাজেট, ঋণ, সাপোর্ট মেসেজ ইত্যাদি) স্থায়ীভাবে মুছে যাবে। এই কাজ পূর্বাবস্থায় ফেরানো সম্ভব নয়।
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" /> অ্যাকাউন্ট ডিলিট করুন
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" /> আপনি কি নিশ্চিত?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <span className="block">এই অ্যাকশনটি পূর্বাবস্থায় ফেরানো যাবে না। আপনার অ্যাকাউন্ট ও সকল সংশ্লিষ্ট ডেটা আমাদের সার্ভার থেকে স্থায়ীভাবে মুছে ফেলা হবে।</span>
                  <span className="block font-medium">নিশ্চিত করতে নিচের ঘরে <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">DELETE</code> লিখুন।</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirm('')}>বাতিল</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'DELETE' || deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, ডিলিট করুন'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
