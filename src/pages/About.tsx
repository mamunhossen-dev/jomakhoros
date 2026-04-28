import { Sparkles, DollarSign, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppSetting } from '@/hooks/useAppSetting';
import { DEFAULT_ABOUT, type AboutContent } from '@/components/admin/AboutPageEditor';
import { Skeleton } from '@/components/ui/skeleton';

export default function About() {
  const { data, isLoading } = useAppSetting<AboutContent>('about_page', DEFAULT_ABOUT);
  const content: AboutContent = {
    ...DEFAULT_ABOUT,
    ...(data ?? {}),
    features: data?.features ?? DEFAULT_ABOUT.features,
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8 sm:p-12 mb-8">
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            About
          </div>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
              <DollarSign className="h-7 w-7 text-primary-foreground" />
            </div>
            {isLoading ? (
              <Skeleton className="h-10 w-64" />
            ) : (
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                {content.title}
              </h1>
            )}
          </div>
          {!isLoading && content.subtitle && (
            <p className="mt-3 text-base sm:text-lg text-muted-foreground">{content.subtitle}</p>
          )}
        </div>
      </div>

      {/* Intro */}
      <article className="rounded-2xl border bg-card p-6 sm:p-10 shadow-sm">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : (
          <div className="prose prose-base dark:prose-invert max-w-none text-foreground/90 prose-headings:font-display prose-a:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.intro_md}</ReactMarkdown>
          </div>
        )}

        {/* Features */}
        {content.features.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
              {content.features_heading}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {content.features.map((f, i) => (
                <div
                  key={i}
                  className="rounded-xl border bg-background p-4 transition hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{f.title}</p>
                      {f.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
