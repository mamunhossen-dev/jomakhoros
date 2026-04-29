import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, EyeOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { timeAgoBn } from '@/lib/forumUtils';

interface ForumReport {
  id: string;
  reporter_id: string;
  post_id: string | null;
  comment_id: string | null;
  reason: string;
  status: string;
  created_at: string;
}

export function ForumReportsManager() {
  const qc = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['forum-reports'],
    queryFn: async () => {
      const { data, error } = await supabase.from('forum_reports').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as ForumReport[];
    },
  });

  const postIds = [...new Set(reports.filter(r => r.post_id).map(r => r.post_id!))];
  const commentIds = [...new Set(reports.filter(r => r.comment_id).map(r => r.comment_id!))];

  const { data: posts = [] } = useQuery({
    queryKey: ['reported-posts', postIds],
    queryFn: async () => {
      if (!postIds.length) return [];
      const { data } = await supabase.from('forum_posts').select('id, content, user_id').in('id', postIds);
      return data ?? [];
    },
    enabled: postIds.length > 0,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['reported-comments', commentIds],
    queryFn: async () => {
      if (!commentIds.length) return [];
      const { data } = await supabase.from('forum_comments').select('id, content, user_id, post_id').in('id', commentIds);
      return data ?? [];
    },
    enabled: commentIds.length > 0,
  });

  const postMap = new Map(posts.map(p => [p.id, p]));
  const commentMap = new Map(comments.map(c => [c.id, c]));

  const dismissReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('forum_reports').update({ status: 'dismissed' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['forum-reports'] }); toast.success('বাতিল করা হয়েছে'); },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('forum_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['forum-reports'] }); toast.success('পোস্ট মুছে ফেলা হয়েছে'); },
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('forum_comments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['forum-reports'] }); toast.success('কমেন্ট মুছে ফেলা হয়েছে'); },
  });

  const hidePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('forum_posts').update({ is_hidden: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['forum-reports'] }); toast.success('পোস্ট লুকানো হয়েছে'); },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>;
  if (!reports.length) return (
    <Card className="p-8 text-center text-muted-foreground">
      <p className="text-3xl mb-2">✅</p>
      <p>কোনো রিপোর্ট নেই</p>
    </Card>
  );

  return (
    <div className="space-y-3">
      {reports.map(r => {
        const post = r.post_id ? postMap.get(r.post_id) : null;
        const comment = r.comment_id ? commentMap.get(r.comment_id) : null;
        const target = post || comment;
        return (
          <Card key={r.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Badge variant={r.status === 'pending' ? 'default' : 'secondary'}>
                {r.status === 'pending' ? 'অপেক্ষমাণ' : 'নিষ্পত্তি'}
              </Badge>
              <span className="text-xs text-muted-foreground">{timeAgoBn(r.created_at)}</span>
            </div>
            <p className="text-sm"><strong>কারণ:</strong> {r.reason}</p>
            <p className="text-xs text-muted-foreground">
              {post ? '📝 পোস্ট রিপোর্ট' : '💬 কমেন্ট রিপোর্ট'}
            </p>
            {target ? (
              <div className="bg-muted/40 rounded p-2 text-sm whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                {target.content}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">কন্টেন্ট ইতিমধ্যে মুছে ফেলা হয়েছে</p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {r.status === 'pending' && (
                <Button size="sm" variant="ghost" onClick={() => dismissReport.mutate(r.id)}>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> বাতিল
                </Button>
              )}
              {post && (
                <>
                  <Button size="sm" variant="outline" onClick={() => hidePost.mutate(post.id)}>
                    <EyeOff className="h-3.5 w-3.5 mr-1.5" /> লুকান
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deletePost.mutate(post.id)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> পোস্ট ডিলিট
                  </Button>
                </>
              )}
              {comment && (
                <Button size="sm" variant="destructive" onClick={() => deleteComment.mutate(comment.id)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> কমেন্ট ডিলিট
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
