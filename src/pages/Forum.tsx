import { useState } from 'react';
import { CreatePostBox } from '@/components/forum/CreatePostBox';
import { PostCard } from '@/components/forum/PostCard';
import { FORUM_CATEGORIES } from '@/lib/forumUtils';
import { useForumPosts } from '@/hooks/useForum';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, Clock } from 'lucide-react';

export default function Forum() {
  const [category, setCategory] = useState<string>('all');
  const [sort, setSort] = useState<'latest' | 'popular'>('latest');
  const { data: posts = [], isLoading } = useForumPosts(category, sort);

  return (
    <div className="container max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold">জমাখরচ কমিউনিটি</h1>
            <p className="text-xs text-muted-foreground">আর্থিক টিপস, প্রশ্ন ও অভিজ্ঞতা শেয়ার করুন</p>
          </div>
        </div>
      </Card>

      <CreatePostBox />

      <div className="space-y-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          <button
            onClick={() => setCategory('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              category === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70'
            }`}
          >
            সব
          </button>
          {FORUM_CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                category === c.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70'
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        <Tabs value={sort} onValueChange={(v) => setSort(v as 'latest' | 'popular')}>
          <TabsList className="w-full">
            <TabsTrigger value="latest" className="flex-1"><Clock className="h-3.5 w-3.5 mr-1.5" />সর্বশেষ</TabsTrigger>
            <TabsTrigger value="popular" className="flex-1"><TrendingUp className="h-3.5 w-3.5 mr-1.5" />জনপ্রিয়</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 animate-pulse h-40 bg-muted/40" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p className="text-3xl mb-2">💭</p>
          <p>এখনো কোনো পোস্ট নেই। প্রথম পোস্টটি আপনিই করুন!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      )}
    </div>
  );
}
