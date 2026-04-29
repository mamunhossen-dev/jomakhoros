import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageCircle, Share2, MoreHorizontal, Pin, Trash2, Flag } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ForumPost, useTogglePostLike, useDeletePost, useReportContent, useTogglePinPost } from '@/hooks/useForum';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getCategoryMeta, timeAgoBn } from '@/lib/forumUtils';
import { CommentSection } from './CommentSection';
import { toast } from 'sonner';

export function PostCard({ post }: { post: ForumPost }) {
  const { user } = useAuth();
  const { isAdmin, isModerator } = useSubscription();
  const cat = getCategoryMeta(post.category);
  const toggleLike = useTogglePostLike();
  const delPost = useDeletePost();
  const report = useReportContent();
  const togglePin = useTogglePinPost();
  const [showComments, setShowComments] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const isOwner = post.user_id === user?.id;
  const canDelete = isOwner || isAdmin || isModerator;
  const canPin = isAdmin || isModerator;
  const name = post.author?.display_name || 'User';
  const initials = name.slice(0, 2).toUpperCase();

  const share = async () => {
    const url = `${window.location.origin}/forum?post=${post.id}`;
    try {
      if (navigator.share) await navigator.share({ url, text: post.content.slice(0, 100) });
      else { await navigator.clipboard.writeText(url); toast.success('লিংক কপি হয়েছে'); }
    } catch { /* ignore */ }
  };

  const onReport = () => {
    const reason = window.prompt('রিপোর্টের কারণ লিখুন:');
    if (reason) report.mutate({ post_id: post.id, reason });
  };

  return (
    <Card className="overflow-hidden">
      {post.is_pinned && (
        <div className="bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary flex items-center gap-1.5">
          <Pin className="h-3 w-3" /> পিনড পোস্ট
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            {post.author?.avatar_url && <AvatarImage src={post.author.avatar_url} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{name}</p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cat.color}`}>
                {cat.emoji} {cat.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{timeAgoBn(post.created_at)}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canPin && (
                <DropdownMenuItem onClick={() => togglePin.mutate({ postId: post.id, pinned: post.is_pinned })}>
                  <Pin className="h-4 w-4 mr-2" />{post.is_pinned ? 'আনপিন' : 'পিন'}
                </DropdownMenuItem>
              )}
              {!isOwner && (
                <DropdownMenuItem onClick={onReport}><Flag className="h-4 w-4 mr-2" />রিপোর্ট</DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem onClick={() => setConfirmDel(true)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />ডিলিট
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="mt-3 text-[15px] whitespace-pre-wrap break-words leading-relaxed">{post.content}</p>

        {post.image_url && (
          <div className="mt-3 -mx-4">
            <img src={post.image_url} alt="" className="w-full max-h-[500px] object-cover" />
          </div>
        )}

        {(post.like_count > 0 || post.comment_count > 0) && (
          <div className="flex items-center justify-between mt-3 pt-2 text-xs text-muted-foreground">
            <span>{post.like_count > 0 && `👍 ${post.like_count}`}</span>
            <button onClick={() => setShowComments((s) => !s)} className="hover:underline">
              {post.comment_count > 0 && `${post.comment_count} কমেন্ট`}
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t">
          <Button
            variant="ghost" size="sm"
            onClick={() => toggleLike.mutate({ postId: post.id, liked: !!post.user_has_liked })}
            className={post.user_has_liked ? 'text-primary' : ''}
          >
            <ThumbsUp className={`h-4 w-4 mr-1.5 ${post.user_has_liked ? 'fill-current' : ''}`} />
            লাইক
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowComments((s) => !s)}>
            <MessageCircle className="h-4 w-4 mr-1.5" /> কমেন্ট
          </Button>
          <Button variant="ghost" size="sm" onClick={share}>
            <Share2 className="h-4 w-4 mr-1.5" /> শেয়ার
          </Button>
        </div>
      </div>

      {showComments && <CommentSection postId={post.id} />}

      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>পোস্ট ডিলিট করবেন?</AlertDialogTitle>
            <AlertDialogDescription>এটি স্থায়ীভাবে মুছে যাবে এবং সব কমেন্ট হারিয়ে যাবে।</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={() => delPost.mutate(post.id)}>ডিলিট</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
