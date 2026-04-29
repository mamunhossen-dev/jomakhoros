import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Trash2, MoreVertical, Flag } from 'lucide-react';
import { useForumComments, useAddComment, useDeleteComment, useReportContent } from '@/hooks/useForum';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { timeAgoBn } from '@/lib/forumUtils';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export function CommentSection({ postId }: { postId: string }) {
  const { user } = useAuth();
  const { isAdmin, isModerator } = useSubscription();
  const { data: comments = [], isLoading } = useForumComments(postId);
  const addComment = useAddComment(postId);
  const delComment = useDeleteComment(postId);
  const report = useReportContent();
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const submit = () => {
    if (!text.trim()) return;
    addComment.mutate({ content: text.trim(), parent_id: replyTo }, {
      onSuccess: () => { setText(''); setReplyTo(null); },
    });
  };

  const top = comments.filter((c) => !c.parent_id);
  const repliesOf = (id: string) => comments.filter((c) => c.parent_id === id);

  return (
    <div className="border-t bg-muted/30 px-4 py-3 space-y-3">
      {isLoading && <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>}
      {top.map((c) => (
        <div key={c.id} className="space-y-2">
          <CommentRow
            comment={c}
            canDelete={c.user_id === user?.id || isAdmin || isModerator}
            onDelete={() => delComment.mutate(c.id)}
            onReply={() => setReplyTo(c.id)}
            onReport={() => {
              const reason = window.prompt('রিপোর্টের কারণ লিখুন:');
              if (reason) report.mutate({ comment_id: c.id, reason });
            }}
          />
          {repliesOf(c.id).map((r) => (
            <div key={r.id} className="ml-10">
              <CommentRow
                comment={r}
                canDelete={r.user_id === user?.id || isAdmin || isModerator}
                onDelete={() => delComment.mutate(r.id)}
                onReport={() => {
                  const reason = window.prompt('রিপোর্টের কারণ লিখুন:');
                  if (reason) report.mutate({ comment_id: r.id, reason });
                }}
              />
            </div>
          ))}
        </div>
      ))}

      {replyTo && (
        <p className="text-xs text-muted-foreground ml-10">
          রিপ্লাই দিচ্ছেন... <button onClick={() => setReplyTo(null)} className="text-primary underline">বাতিল</button>
        </p>
      )}

      <div className="flex items-end gap-2 pt-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={replyTo ? 'রিপ্লাই লিখুন...' : 'কমেন্ট লিখুন...'}
          className="min-h-[40px] max-h-[120px] resize-none flex-1"
          maxLength={1000}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
          }}
        />
        <Button size="icon" disabled={!text.trim() || addComment.isPending} onClick={submit}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function CommentRow({
  comment, canDelete, onDelete, onReply, onReport,
}: {
  comment: { id: string; content: string; created_at: string; like_count: number; author?: { display_name: string | null; avatar_url: string | null } };
  canDelete: boolean;
  onDelete: () => void;
  onReply?: () => void;
  onReport: () => void;
}) {
  const name = comment.author?.display_name || 'User';
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className="flex items-start gap-2">
      <Avatar className="h-8 w-8">
        {comment.author?.avatar_url && <AvatarImage src={comment.author.avatar_url} />}
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-background rounded-2xl px-3 py-2 inline-block max-w-full">
          <p className="text-xs font-semibold">{name}</p>
          <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 ml-2 text-xs text-muted-foreground">
          <span>{timeAgoBn(comment.created_at)}</span>
          {onReply && <button onClick={onReply} className="font-medium hover:text-foreground">রিপ্লাই</button>}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onReport}><Flag className="h-3.5 w-3.5 mr-2" />রিপোর্ট</DropdownMenuItem>
          {canDelete && (
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" />ডিলিট
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
