import { DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppSetting } from '@/hooks/useAppSetting';
import { DEFAULT_TERMS, type TermsContent } from '@/components/admin/TermsEditor';
import { Skeleton } from '@/components/ui/skeleton';

export default function Terms() {
  const { data, isLoading } = useAppSetting<TermsContent>('terms_page', DEFAULT_TERMS);
  const content: TermsContent = {
    ...DEFAULT_TERMS,
    ...(data ?? {}),
    sections: data?.sections ?? DEFAULT_TERMS.sections,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <DollarSign className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold">JomaKhoros</span>
        </Link>

        <h1 className="font-display text-3xl font-bold mb-6">{content.page_title}</h1>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : (
          <div className="space-y-6 text-foreground/80">
            {content.sections.map((s, i) => (
              <section key={i}>
                <h2 className="font-display text-xl font-semibold text-foreground mb-2">{s.heading}</h2>
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-a:text-primary prose-table:border prose-th:border prose-td:border prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{s.body_md}</ReactMarkdown>
                </div>
              </section>
            ))}
            {content.footer_note && (
              <p className="text-sm text-muted-foreground italic mt-6">{content.footer_note}</p>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/register" className="text-primary hover:underline font-medium">← রেজিস্ট্রেশনে ফিরে যান</Link>
        </div>
      </div>
    </div>
  );
}
