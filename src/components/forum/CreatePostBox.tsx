import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Image as ImageIcon, X, Send } from 'lucide-react';
import { FORUM_CATEGORIES } from '@/lib/forumUtils';
import { useCreatePost } from '@/hooks/useForum';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function CreatePostBox() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const create = useCreatePost();

  const { data: profile } = useQuery({
    queryKey: ['my-profile-min', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('display_name, avatar_url').eq('user_id', user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const handleFile = (f: File | null) => {
    setImage(f);
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  };

  const submit = () => {
    if (!content.trim()) return;
    create.mutate(
      { content: content.trim(), category, image },
      {
        onSuccess: () => {
          setContent(''); setImage(null); setPreview(null); setOpen(false);
        },
      },
    );
  };

  const initials = (profile?.display_name || user?.email || 'U').slice(0, 2).toUpperCase();

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        {!open ? (
          <button
            onClick={() => setOpen(true)}
            className="flex-1 rounded-full bg-muted px-4 py-2.5 text-left text-muted-foreground hover:bg-muted/70 transition-colors"
          >
            আপনার মনের কথা লিখুন...
          </button>
        ) : (
          <div className="flex-1 space-y-3">
            <Textarea
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="কী ভাবছেন? আর্থিক টিপস, প্রশ্ন বা অভিজ্ঞতা শেয়ার করুন..."
              className="min-h-[100px] resize-none border-none focus-visible:ring-0 px-0 text-base"
              maxLength={2000}
            />
            {preview && (
              <div className="relative inline-block">
                <img src={preview} alt="" className="max-h-60 rounded-lg" />
                <button
                  onClick={() => handleFile(null)}
                  className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {FORUM_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                    category === c.value ? c.color + ' ring-2 ring-primary' : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <input
                type="file"
                accept="image/*"
                ref={fileRef}
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
                <ImageIcon className="h-4 w-4 mr-1.5" /> ছবি
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setContent(''); handleFile(null); }}>
                  বাতিল
                </Button>
                <Button size="sm" disabled={!content.trim() || create.isPending} onClick={submit}>
                  <Send className="h-4 w-4 mr-1.5" /> পোস্ট
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
