-- Forum Posts
CREATE TABLE public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL DEFAULT 'general',
  content text NOT NULL,
  image_url text,
  is_pinned boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  like_count integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view posts" ON public.forum_posts
  FOR SELECT TO authenticated USING (is_hidden = false OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role) OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can create posts" ON public.forum_posts
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id 
    AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_blocked = true)
  );

CREATE POLICY "Users update own posts; admins any" ON public.forum_posts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));

CREATE POLICY "Users delete own posts; admins any" ON public.forum_posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));

CREATE INDEX idx_forum_posts_created ON public.forum_posts(created_at DESC);
CREATE INDEX idx_forum_posts_category ON public.forum_posts(category);
CREATE INDEX idx_forum_posts_user ON public.forum_posts(user_id);

CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON public.forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Forum Comments
CREATE TABLE public.forum_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  parent_id uuid REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  like_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view comments" ON public.forum_comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can comment" ON public.forum_comments
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_blocked = true)
  );

CREATE POLICY "Users update own comments" ON public.forum_comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own; admins any" ON public.forum_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));

CREATE INDEX idx_forum_comments_post ON public.forum_comments(post_id, created_at);

CREATE TRIGGER update_forum_comments_updated_at BEFORE UPDATE ON public.forum_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Forum Likes
CREATE TABLE public.forum_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_id uuid REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((post_id IS NOT NULL)::int + (comment_id IS NOT NULL)::int = 1),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id)
);
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view likes" ON public.forum_likes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users like" ON public.forum_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unlike own" ON public.forum_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Forum Reports
CREATE TABLE public.forum_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  post_id uuid REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.forum_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can report" ON public.forum_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins view reports" ON public.forum_reports
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
CREATE POLICY "Admins update reports" ON public.forum_reports
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role));
CREATE POLICY "Admins delete reports" ON public.forum_reports
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

-- Forum Notifications
CREATE TABLE public.forum_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  type text NOT NULL,
  post_id uuid REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.forum_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.forum_notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System insert notifications" ON public.forum_notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);
CREATE POLICY "Users update own notifications" ON public.forum_notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.forum_notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_forum_notif_user ON public.forum_notifications(user_id, created_at DESC);

-- Counter trigger functions
CREATE OR REPLACE FUNCTION public.adjust_forum_post_counts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'forum_likes' AND NEW.post_id IS NOT NULL THEN
      UPDATE public.forum_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'forum_likes' AND NEW.comment_id IS NOT NULL THEN
      UPDATE public.forum_comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    ELSIF TG_TABLE_NAME = 'forum_comments' THEN
      UPDATE public.forum_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'forum_likes' AND OLD.post_id IS NOT NULL THEN
      UPDATE public.forum_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
    ELSIF TG_TABLE_NAME = 'forum_likes' AND OLD.comment_id IS NOT NULL THEN
      UPDATE public.forum_comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
    ELSIF TG_TABLE_NAME = 'forum_comments' THEN
      UPDATE public.forum_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;$$;

CREATE TRIGGER trg_forum_likes_counts AFTER INSERT OR DELETE ON public.forum_likes
  FOR EACH ROW EXECUTE FUNCTION public.adjust_forum_post_counts();
CREATE TRIGGER trg_forum_comments_counts AFTER INSERT OR DELETE ON public.forum_comments
  FOR EACH ROW EXECUTE FUNCTION public.adjust_forum_post_counts();

-- Storage bucket for forum images
INSERT INTO storage.buckets (id, name, public) VALUES ('forum-images', 'forum-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Forum images public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'forum-images');
CREATE POLICY "Users upload forum images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'forum-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own forum images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'forum-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_likes;