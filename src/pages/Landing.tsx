import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Wallet, Tag, ShieldCheck, Smartphone, Sparkles, BarChart3, PiggyBank, Zap,
  CheckCircle2, BookOpen, LogIn, UserPlus, Star, Bell, Globe, Clock,
  FileText, Target, HeartHandshake, UserPlus2, Banknote, LineChart, Quote,
} from 'lucide-react';
import { useAppSetting } from '@/hooks/useAppSetting';
import { DEFAULT_LANDING, type LandingContent } from '@/components/admin/LandingPageEditor';
import { DEFAULT_SITE, type SiteSettings } from '@/components/admin/SiteSettingsEditor';
import { useBrand } from '@/hooks/useBrand';
import { PageMeta } from '@/components/PageMeta';

const featureIcons = [Wallet, Tag, BarChart3, PiggyBank, Bell, Smartphone, FileText, Target, Globe];
const featureColors = [
  'from-teal-500 to-emerald-600', 'from-violet-500 to-purple-600', 'from-indigo-500 to-blue-600',
  'from-pink-500 to-rose-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600',
  'from-sky-500 to-blue-600', 'from-fuchsia-500 to-pink-600', 'from-lime-500 to-green-600',
];
const stepIcons = [UserPlus2, Banknote, LineChart];

export default function Landing() {
  const { data } = useAppSetting<LandingContent>('landing_page', DEFAULT_LANDING);
  const { data: siteData } = useAppSetting<SiteSettings>('site_settings', DEFAULT_SITE);
  const site = { ...DEFAULT_SITE, ...(siteData ?? {}), footer_links: siteData?.footer_links ?? DEFAULT_SITE.footer_links };
  const brand = useBrand();

  // Deep merge with defaults
  const c: LandingContent = {
    ...DEFAULT_LANDING,
    ...(data ?? {}),
    hero: { ...DEFAULT_LANDING.hero, ...(data?.hero ?? {}) },
    stats: data?.stats ?? DEFAULT_LANDING.stats,
    how: { ...DEFAULT_LANDING.how, ...(data?.how ?? {}), steps: data?.how?.steps ?? DEFAULT_LANDING.how.steps },
    features: { ...DEFAULT_LANDING.features, ...(data?.features ?? {}), items: data?.features?.items ?? DEFAULT_LANDING.features.items },
    why: { ...DEFAULT_LANDING.why, ...(data?.why ?? {}), bullets: data?.why?.bullets ?? DEFAULT_LANDING.why.bullets },
    testimonials: { ...DEFAULT_LANDING.testimonials, ...(data?.testimonials ?? {}), items: data?.testimonials?.items ?? DEFAULT_LANDING.testimonials.items },
    faq: { ...DEFAULT_LANDING.faq, ...(data?.faq ?? {}), items: data?.faq?.items ?? DEFAULT_LANDING.faq.items },
    final_cta: { ...DEFAULT_LANDING.final_cta, ...(data?.final_cta ?? {}) },
    footer: { ...DEFAULT_LANDING.footer, ...(data?.footer ?? {}) },
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={site.site_title}
        description={site.meta_description}
        canonicalPath="/"
      />
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground shadow-md">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold">{brand.name}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Button asChild variant="ghost" size="sm"><a href="#features">ফিচার</a></Button>
            <Button asChild variant="ghost" size="sm"><a href="#how">কীভাবে কাজ করে</a></Button>
            <Button asChild variant="ghost" size="sm"><a href="#faq">FAQ</a></Button>
            <Button asChild variant="ghost" size="sm"><Link to="/user-guide">গাইড</Link></Button>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/login">লগইন</Link></Button>
            <Button asChild size="sm" className="bg-gradient-to-r from-primary to-emerald-600 shadow-md hover:opacity-90">
              <Link to="/register">শুরু করুন</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -right-20 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {c.hero.badge}
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {c.hero.title_part1}{' '}
              <span className="bg-gradient-to-r from-primary via-emerald-500 to-teal-600 bg-clip-text text-transparent">
                {c.hero.title_highlight}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
              {c.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-emerald-600 text-base shadow-lg hover:opacity-90">
                <Link to="/register">
                  <UserPlus className="h-5 w-5" /> {c.hero.cta_primary}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base">
                <a href="#features">
                  <Sparkles className="h-5 w-5" /> {c.hero.cta_secondary}
                </a>
              </Button>
            </div>
            <div className="mt-6 flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="ml-2">{c.hero.rating_text}</span>
            </div>

            {/* Stats */}
            {c.stats.length > 0 && (
              <div className="mt-12 grid grid-cols-3 gap-4 border-t border-border/50 pt-8">
                {c.stats.map((s) => (
                  <div key={s.label}>
                    <div className="font-display text-2xl font-bold text-primary sm:text-3xl">{s.value}</div>
                    <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Clock className="h-3.5 w-3.5" /> {c.how.badge}
            </div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">{c.how.title}</h2>
            <p className="mt-4 text-muted-foreground">{c.how.subtitle}</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {c.how.steps.map((s, i) => {
              const Icon = stepIcons[i] ?? stepIcons[0];
              return (
                <div key={i} className="relative">
                  <Card className="h-full border-border/50 transition-all hover:-translate-y-1 hover:shadow-xl">
                    <CardContent className="p-6 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground shadow-lg">
                        <Icon className="h-7 w-7" />
                      </div>
                      <div className="mb-2 text-xs font-semibold text-primary">ধাপ {['১', '২', '৩', '৪', '৫'][i] ?? i + 1}</div>
                      <h3 className="font-display text-lg font-bold">{s.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Zap className="h-3.5 w-3.5" /> {c.features.badge}
            </div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">{c.features.title}</h2>
            <p className="mt-4 text-muted-foreground">{c.features.subtitle}</p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.features.items.map((f, i) => {
              const Icon = featureIcons[i % featureIcons.length];
              const color = featureColors[i % featureColors.length];
              return (
                <Card key={i} className="group relative overflow-hidden border-border/50 transition-all hover:-translate-y-1 hover:shadow-xl">
                  <CardContent className="p-6">
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-lg font-bold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why us strip */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-primary via-emerald-600 to-teal-700 p-8 text-primary-foreground shadow-2xl sm:p-12">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">{c.why.title}</h2>
              <p className="mt-4 opacity-90">{c.why.subtitle}</p>
            </div>
            <ul className="space-y-3">
              {c.why.bullets.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {c.testimonials.items.length > 0 && (
        <section className="px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <HeartHandshake className="h-3.5 w-3.5" /> {c.testimonials.badge}
              </div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">{c.testimonials.title}</h2>
              <p className="mt-4 text-muted-foreground">{c.testimonials.subtitle}</p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {c.testimonials.items.map((t, i) => (
                <Card key={i} className="border-border/50 transition-all hover:shadow-xl">
                  <CardContent className="p-6">
                    <Quote className="h-7 w-7 text-primary/40" />
                    <p className="mt-3 text-sm leading-relaxed text-foreground/90">"{t.text}"</p>
                    <div className="mt-5 flex items-center gap-3 border-t border-border/50 pt-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 font-display text-sm font-bold text-primary-foreground">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {c.faq.items.length > 0 && (
        <section id="faq" className="px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Bell className="h-3.5 w-3.5" /> {c.faq.badge}
              </div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">{c.faq.title}</h2>
              <p className="mt-4 text-muted-foreground">{c.faq.subtitle}</p>
            </div>

            <Accordion type="single" collapsible className="mt-10 w-full">
              {c.faq.items.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-border/50">
                  <AccordionTrigger className="text-left text-base font-semibold">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground shadow-lg">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">{c.final_cta.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{c.final_cta.subtitle}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-emerald-600 text-base shadow-lg hover:opacity-90">
              <Link to="/register">
                <UserPlus className="h-5 w-5" /> {c.final_cta.cta_primary}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <Link to="/login">
                <LogIn className="h-5 w-5" /> {c.final_cta.cta_secondary}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Wallet className="h-4 w-4" />
              </div>
              <span className="font-display font-bold">{brand.name}</span>
              <span className="text-xs text-muted-foreground">• {c.footer.tagline}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {site.footer_links.map((l, i) => (
                l.url.startsWith('http') ? (
                  <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">{l.label}</a>
                ) : (
                  <Link key={i} to={l.url} className="hover:text-foreground">{l.label}</Link>
                )
              ))}
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">{c.footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
}
