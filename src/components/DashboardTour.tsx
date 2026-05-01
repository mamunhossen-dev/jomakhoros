import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Sparkles, ArrowUpDown, Repeat, Wallet, BarChart3, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlags';

const STORAGE_KEY = 'jk_dashboard_tour_seen_v1';

const STEPS = [
  {
    icon: Sparkles,
    title: 'স্বাগতম! 🎉',
    body: 'JomaKhoros-এ আপনাকে স্বাগতম। চলুন কয়েকটি গুরুত্বপূর্ণ ফিচার দেখে নিই।',
  },
  {
    icon: ArrowUpDown,
    title: 'লেনদেন যোগ করুন',
    body: 'সাইডবার থেকে "লেনদেন" সিলেক্ট করে নতুন আয় বা ব্যয় যোগ করতে পারবেন।',
  },
  {
    icon: Wallet,
    title: 'ওয়ালেট ও ক্যাটাগরি',
    body: 'ব্যাংক, মোবাইল ব্যাংকিং বা নগদ অ্যাকাউন্টকে "ওয়ালেট" হিসেবে যোগ করুন।',
  },
  {
    icon: Repeat,
    title: 'পুনরাবৃত্তি লেনদেন',
    body: 'মাসিক ভাড়া, সাপ্তাহিক বাজার বা বার্ষিক বিল — একবার সেট করুন, সিস্টেম স্বয়ংক্রিয়ভাবে যোগ করবে।',
  },
  {
    icon: BarChart3,
    title: 'বিশ্লেষণ ও রিপোর্ট',
    body: '"বিশ্লেষণ" পেজে আয়-ব্যয়ের চার্ট ও PDF রিপোর্ট পাবেন।',
  },
  {
    icon: CheckCircle2,
    title: 'প্রস্তুত!',
    body: 'যেকোনো সময় গাইড পেজ থেকে আরো জানতে পারবেন। শুরু করুন!',
  },
];

export function DashboardTour() {
  const { user } = useAuth();
  const { enabled: tourEnabled, isLoading: flagLoading } = useFeatureFlag('dashboard_tour', true);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user || flagLoading || !tourEnabled) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') return;
    } catch {
      return;
    }
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [user, flagLoading, tourEnabled]);

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setOpen(false);
  };

  if (!tourEnabled) return null;

  const cur = STEPS[step];
  const Icon = cur.icon;
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) finish(); }}>
      <DialogContent
        className="max-w-[92vw] sm:max-w-md p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl"
        showCloseButton={false}
      >
        {/* Close button */}
        <button
          onClick={finish}
          aria-label="বন্ধ করুন"
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Gradient header */}
        <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-5 pt-7 pb-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 ring-4 ring-primary/5">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-display text-lg sm:text-xl font-semibold mt-3 text-foreground">
            {cur.title}
          </h2>
          <p className="text-[13px] sm:text-sm text-muted-foreground leading-relaxed mt-1.5 px-1">
            {cur.body}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 py-3 bg-background">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-primary' : i < step ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Footer actions — sticky on mobile */}
        <div className="flex items-center justify-between gap-2 px-4 pb-4 pt-2 bg-background">
          <Button
            variant="ghost"
            size="sm"
            onClick={finish}
            className="text-muted-foreground text-xs sm:text-sm h-9"
          >
            এড়িয়ে যান
          </Button>
          <div className="flex gap-2">
            {!isFirst && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
                className="h-9 px-3"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">পেছনে</span>
              </Button>
            )}
            {!isLast ? (
              <Button
                size="sm"
                onClick={() => setStep((s) => s + 1)}
                className="h-9 px-4 shadow-sm"
              >
                পরবর্তী <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={finish} className="h-9 px-4 shadow-sm">
                <CheckCircle2 className="mr-1 h-4 w-4" /> শুরু করুন
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
