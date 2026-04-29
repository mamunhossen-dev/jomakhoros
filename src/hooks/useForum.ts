import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ForumPost {
  id: string;
  user_id: string;
  category: string;
  content: string;
  image_url: string | null;
  is_pinned: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  author?: { display_name: string | null; avatar_url: string | null };
  user_has_liked?: boolean;
}

export interface ForumComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  like_count: number;
  created_at: string;
  author?: { display_name: string | null; avatar_url: string | null };
}

export function useForumPosts(category?: string, sort: 'latest' | 'popular' = 'latest') {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['forum-posts', category, sort, user?.id],
    queryFn: async (): Promise<ForumPost[]> => {
      let q = supabase.from('forum_posts').select('*').eq('is_hidden', false);
      if (category && category !== 'all') q = q.eq('category', category);
      q = sort === 'popular'
        ? q.order('is_pinned', { ascending: false }).order('like_count', { ascending: false }).order('created_at', { ascending: false })
        : q.order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
      const { data: posts, error } = await q.limit(100);
      if (error) throw error;
      if (!posts?.length) return [];

      const userIds = [...new Set(posts.map((p) => p.user_id))];
      const postIds = posts.map((p) => p.id);

      const [{ data: profs }, { data: likes }] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', userIds),
        user
          ? supabase.from('forum_likes').select('post_id').eq('user_id', user.id).in('post_id', postIds)
          : Promise.resolve({ data: [] as { post_id: string | null }[] }),
      ]);

      const profMap = new Map((profs ?? []).map((p) => [p.user_id, p]));
      const likedSet = new Set((likes ?? []).map((l) => l.post_id));

      return posts.map((p) => ({
        ...p,
        author: profMap.get(p.user_id) ?? { display_name: null, avatar_url: null },
        user_has_liked: likedSet.has(p.id),
      }));
    },
  });
}

export function useForumComments(postId: string) {
  return useQuery({
    queryKey: ['forum-comments', postId],
    queryFn: async (): Promise<ForumComment[]> => {
      const { data: comments, error } = await supabase
        .from('forum_comments').select('*').eq('post_id', postId).order('created_at');
      if (error) throw error;
      if (!comments?.length) return [];
      const userIds = [...new Set(comments.map((c) => c.user_id))];
      const { data: profs } = await supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', userIds);
      const profMap = new Map((profs ?? []).map((p) => [p.user_id, p]));
      return comments.map((c) => ({ ...c, author: profMap.get(c.user_id) ?? { display_name: null, avatar_url: null } }));
    },
    enabled: !!postId,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ content, category, image }: { content: string; category: string; image?: File | null }) => {
      if (!user) throw new Error('লগইন করুন');
      let image_url: string | null = null;
      if (image) {
        const path = `${user.id}/${Date.now()}-${image.name}`;
        const { error: upErr } = await supabase.storage.from('forum-images').upload(path, image);
        if (upErr) throw upErr;
        image_url = supabase.storage.from('forum-images').getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from('forum_posts').insert({ user_id: user.id, content, category, image_url });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-posts'] });
      toast.success('পোস্ট হয়েছে!');
    },
    onError: (e: Error) => toast.error(e.message || 'পোস্ট করা যায়নি'),
  });
}

export function useTogglePostLike() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      if (!user) throw new Error('লগইন করুন');
      if (liked) {
        const { error } = await supabase.from('forum_likes').delete().eq('user_id', user.id).eq('post_id', postId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('forum_likes').insert({ user_id: user.id, post_id: postId });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forum-posts'] }),
  });
}

export function useAddComment(postId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ content, parent_id }: { content: string; parent_id?: string | null }) => {
      if (!user) throw new Error('লগইন করুন');
      const { error } = await supabase.from('forum_comments').insert({
        post_id: postId, user_id: user.id, content, parent_id: parent_id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-comments', postId] });
      qc.invalidateQueries({ queryKey: ['forum-posts'] });
    },
    onError: (e: Error) => toast.error(e.message || 'কমেন্ট পোস্ট হয়নি'),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('forum_posts').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-posts'] });
      toast.success('পোস্ট মুছে ফেলা হয়েছে');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('forum_comments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forum-comments', postId] }),
  });
}

export function useReportContent() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ post_id, comment_id, reason }: { post_id?: string; comment_id?: string; reason: string }) => {
      if (!user) throw new Error('লগইন করুন');
      const { error } = await supabase.from('forum_reports').insert({
        reporter_id: user.id, post_id: post_id ?? null, comment_id: comment_id ?? null, reason,
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success('রিপোর্ট পাঠানো হয়েছে। ধন্যবাদ!'),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useTogglePinPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, pinned }: { postId: string; pinned: boolean }) => {
      const { error } = await supabase.from('forum_posts').update({ is_pinned: !pinned }).eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forum-posts'] }),
  });
}

export function useForumNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['forum-notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_notifications').select('*').eq('user_id', user!.id)
        .order('created_at', { ascending: false }).limit(30);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}
