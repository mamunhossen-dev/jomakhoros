import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useCategories } from '@/hooks/useTransactions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryFormDialog } from '@/components/categories/CategoryFormDialog';
import { useDeleteCategory } from '@/hooks/useCategories';
import { User, Tag, LayoutDashboard, Camera, Plus, Pencil, Trash2, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: categories, isLoading: catsLoading } = useCategories();
  const deleteCategory = useDeleteCategory();
  const qc = useQueryClient();

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [catFormOpen, setCatFormOpen] = useState(false);
  const [editCat, setEditCat] = useState<{ id: string; name: string; type: 'income' | 'expense' } | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setPhone(profile.phone || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  // Redirect if onboarding already completed
  useEffect(() => {
    if (profile && profile.onboarding_completed) {
      navigate('/', { replace: true });
    }
  }, [profile, navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { toast.error('ছবি আপলোড ব্যর্থ'); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    setAvatarUrl(urlData.publicUrl);
    setUploading(false);
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) { toast.error('নাম দিন'); return; }
    if (!phone.trim()) { toast.error('ফোন নম্বর দিন'); return; }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      display_name: displayName.trim(),
      phone: phone.trim(),
      avatar_url: avatarUrl || null,
    }).eq('user_id', user!.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ['profile'] });
    toast.success('প্রোফাইল সংরক্ষিত!');
    setStep(2);
  };

  const handleFinishOnboarding = async () => {
    if (!categories?.length) { toast.error('কমপক্ষে একটি ক্যাটাগরি থাকতে হবে'); return; }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ onboarding_completed: true }).eq('user_id', user!.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ['profile'] });
    toast.success('অনবোর্ডিং সম্পন্ন!');
    navigate('/');
  };

  const incomeCategories = categories?.filter(c => c.type === 'income') || [];
  const expenseCategories = categories?.filter(c => c.type === 'expense') || [];

  const steps = [
    { num: 1, label: 'প্রোফাইল', icon: User },
    { num: 2, label: 'ক্যাটাগরি', icon: Tag },
    { num: 3, label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
  ];

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card/50 px-4 py-4">
        <div className="mx-auto max-w-lg">
          <h1 className="font-display text-lg font-bold text-center">JomaKhoros সেটআপ</h1>
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  step >= s.num
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step > s.num ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-px w-6 ${step > s.num ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={(step / 3) * 100} className="mt-3 h-1.5" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center p-4 pt-6">
        <div className="w-full max-w-lg">

          {/* Step 1: Profile */}
          {step === 1 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="font-display text-xl">প্রোফাইল তথ্য</CardTitle>
                <p className="text-sm text-muted-foreground">আপনার নাম, ফোন ও ছবি দিন</p>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="text-xl">{displayName?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
                      <Camera className="h-3.5 w-3.5" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                    </label>
                  </div>
                  {uploading && <p className="text-xs text-muted-foreground">আপলোড হচ্ছে...</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">পূর্ণ নাম *</Label>
                  <Input id="name" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="আপনার নাম" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">ফোন নম্বর *</Label>
                  <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01XXXXXXXXX" />
                </div>

                <Button className="w-full" onClick={handleSaveProfile} disabled={saving || !displayName.trim() || !phone.trim()}>
                  {saving ? 'সংরক্ষণ হচ্ছে...' : 'পরবর্তী ধাপ'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Categories */}
          {step === 2 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-display text-xl">ক্যাটাগরি সেটআপ</CardTitle>
                    <p className="text-sm text-muted-foreground">আপনার আয় ও ব্যয়ের ক্যাটাগরি ঠিক করুন</p>
                  </div>
                  <Button size="sm" onClick={() => { setEditCat(null); setCatFormOpen(true); }}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> যোগ করুন
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {catsLoading ? (
                  <p className="text-center py-6 text-muted-foreground text-sm">লোড হচ্ছে...</p>
                ) : (
                  <Tabs defaultValue="expense">
                    <TabsList className="w-full mb-3">
                      <TabsTrigger value="expense" className="flex-1">ব্যয় ({expenseCategories.length})</TabsTrigger>
                      <TabsTrigger value="income" className="flex-1">আয় ({incomeCategories.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="expense">
                      <CategoryList cats={expenseCategories} type="expense" onEdit={(c) => { setEditCat(c); setCatFormOpen(true); }} onDelete={(id) => deleteCategory.mutate(id)} />
                    </TabsContent>
                    <TabsContent value="income">
                      <CategoryList cats={incomeCategories} type="income" onEdit={(c) => { setEditCat(c); setCatFormOpen(true); }} onDelete={(id) => deleteCategory.mutate(id)} />
                    </TabsContent>
                  </Tabs>
                )}

                <Button className="w-full mt-4" onClick={handleFinishOnboarding} disabled={saving || !categories?.length}>
                  {saving ? 'সম্পন্ন হচ্ছে...' : 'সম্পন্ন করুন ও ড্যাশবোর্ডে যান'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CategoryFormDialog open={catFormOpen} onOpenChange={setCatFormOpen} editCategory={editCat} />
    </div>
  );
}

function CategoryList({ cats, type, onEdit, onDelete }: {
  cats: { id: string; name: string; type: string }[];
  type: 'income' | 'expense';
  onEdit: (c: { id: string; name: string; type: 'income' | 'expense' }) => void;
  onDelete: (id: string) => void;
}) {
  if (!cats.length) return <p className="text-center py-4 text-sm text-muted-foreground">কোনো ক্যাটাগরি নেই</p>;
  return (
    <div className="space-y-1.5 max-h-60 overflow-y-auto">
      {cats.map(c => (
        <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${type === 'income' ? 'bg-success' : 'bg-destructive'}`} />
            <span className="text-sm">{c.name}</span>
          </div>
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit({ id: c.id, name: c.name, type: type })}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(c.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
