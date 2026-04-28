import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSetting } from '@/hooks/useAppSetting';
import { useBrand } from '@/hooks/useBrand';
import { DEFAULT_GUIDE, type UserGuideContent } from '@/components/admin/UserGuideEditor';
import {
  BookOpen, Sparkles, PieChart, ShieldCheck,
  Tag, Wallet, Share2, FileImage, FileText, Lightbulb, CheckCircle2, ArrowRight,
  UserPlus, Banknote, BarChart3, LogIn,
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Icon assignment per section key (fallback: BookOpen)
const SECTION_ICONS: Record<string, any> = {
  getting_started: BookOpen,
  wallet: Wallet,
  category: Tag,
  transactions: Banknote,
  analytics: BarChart3,
  features: Sparkles,
  tips: Lightbulb,
  benefits: CheckCircle2,
};

const SECTION_COLORS: Record<string, string> = {
  getting_started: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  wallet: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  category: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  transactions: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  analytics: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  features: 'bg-primary/10 text-primary',
  tips: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  benefits: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="font-display text-xl font-bold">{title}</h2>
    </div>
  );
}

function InfoCard({ icon: Icon, title, desc, color }: { icon: any; title: string; desc: string; color?: string }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex gap-3 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color ?? 'bg-primary/10 text-primary'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UserGuide() {
  const { user } = useAuth();
  const { name: brandName } = useBrand();
  const { data: guideData } = useAppSetting<UserGuideContent>('user_guide_content', DEFAULT_GUIDE);
  const g: UserGuideContent = {
    ...DEFAULT_GUIDE,
    ...(guideData ?? {}),
    sections: guideData?.sections?.length ? guideData.sections : DEFAULT_GUIDE.sections,
    notice_points: guideData?.notice_points ?? DEFAULT_GUIDE.notice_points,
  };

  const guideRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (type: 'pdf' | 'image') => {
    if (!guideRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(guideRef.current, {
        scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false,
      });
      const fname = g.pdf_filename || 'User-Guide';
      if (type === 'image') {
        const link = document.createElement('a');
        link.download = `${fname}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast.success('ইমেজ ডাউনলোড হয়েছে');
      } else {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
        pdf.save(`${fname}.pdf`);
        toast.success('PDF ডাউনলোড হয়েছে');
      }
    } catch (e) {
      toast.error('এক্সপোর্ট ব্যর্থ হয়েছে');
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: `${brandName} - ${g.page_title}`,
      text: `${brandName} দিয়ে সহজেই আপনার আয়-ব্যয় ট্র্যাক করুন!`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('লিংক কপি হয়েছে');
      }
    } catch {
      // user cancelled
    }
  };

  // Find specific sections for special rendering
  const walletSection = g.sections.find(s => s.key === 'wallet');
  const benefitsSection = g.sections.find(s => s.key === 'benefits');
  const otherSections = g.sections.filter(s => s.key !== 'wallet' && s.key !== 'benefits');

  const content = (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{g.page_title}</h1>
          <p className="text-sm text-muted-foreground">{g.page_subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleExport('pdf')} disabled={exporting} size="sm">
            <FileText className="h-4 w-4" /> PDF
          </Button>
          <Button onClick={() => handleExport('image')} disabled={exporting} size="sm" variant="secondary">
            <FileImage className="h-4 w-4" /> Image
          </Button>
          <Button onClick={handleShare} size="sm" variant="outline">
            <Share2 className="h-4 w-4" /> শেয়ার
          </Button>
        </div>
      </div>

      <div ref={guideRef} className="space-y-6 bg-background p-2">
        {/* Hero */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary via-primary to-emerald-600 text-primary-foreground shadow-lg">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{g.hero_eyebrow}</p>
                <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{g.hero_title}</h2>
                <p className="mt-3 text-sm opacity-95 sm:text-base">{g.hero_desc}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Render sections in order, with wallet getting the special notice */}
        {g.sections.map((section) => {
          if (section.key === 'benefits') {
            // Special render at the bottom area
            return null;
          }
          const Icon = SECTION_ICONS[section.key] ?? BookOpen;
          const color = SECTION_COLORS[section.key];
          return (
            <section key={section.key}>
              <SectionHeader icon={Icon} title={section.heading} />
              <div className="grid gap-3 sm:grid-cols-2">
                {section.items.map((item, i) => (
                  <InfoCard key={i} icon={Icon} title={item.title} desc={item.desc} color={color} />
                ))}
              </div>

              {/* Inject security notice after wallet section */}
              {section.key === 'wallet' && (
                <Card className="mt-3 border-l-4 border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/30">
                  <CardContent className="flex gap-3 p-4">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
                    <div className="space-y-1">
                      <p className="font-semibold text-emerald-900 dark:text-emerald-200">{g.notice_title}</p>
                      <p className="text-sm text-emerald-800 dark:text-emerald-300">{g.notice_intro}</p>
                      <ul className="ml-4 list-disc space-y-1 text-sm text-emerald-800 dark:text-emerald-300">
                        {g.notice_points.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Inject tip box after analytics */}
              {section.key === 'analytics' && (
                <Card className="mt-3 border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/30">
                  <CardContent className="flex gap-3 p-4">
                    <Lightbulb className="h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-200">{g.tip_title}</p>
                      <p className="text-sm text-amber-800 dark:text-amber-300">{g.tip_desc}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>
          );
        })}

        {/* Benefits section (special layout) */}
        {benefitsSection && (
          <section>
            <SectionHeader icon={CheckCircle2} title={benefitsSection.heading} />
            <div className="grid gap-3">
              {benefitsSection.items.map((b, i) => (
                <Card key={i}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{b.title}</h3>
                      <p className="text-sm text-muted-foreground">{b.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        {!user && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-emerald-500/5">
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-xl font-bold sm:text-2xl">{g.cta_title}</h3>
                <p className="mx-auto max-w-md text-sm text-muted-foreground">{g.cta_desc}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button asChild size="lg">
                  <Link to="/register">
                    <UserPlus className="h-4 w-4" /> {g.cta_register_label}
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/login">
                    <LogIn className="h-4 w-4" /> {g.cta_login_label}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer brand */}
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <p className="font-display text-lg font-bold">{g.footer_brand_name || brandName}</p>
            <p className="text-xs text-muted-foreground">{g.footer_tagline}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (user) return content;

  // Public layout
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold">{brandName}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link to="/login">লগইন</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">রেজিস্ট্রেশন</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{content}</main>
    </div>
  );
}
