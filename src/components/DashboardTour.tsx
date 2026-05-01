import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Sparkles, ArrowUpDown, Repeat, Wallet, BarChart3, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
    body: 'বাঁ পাশের সাইডবার থেকে "লেনদেন" সিলেক্ট করে নতুন আয় বা ব্যয় যোগ করতে পারবেন।',
  },
  {
    icon: Wallet,
    title: 'ওয়ালেট ও ক্যাটাগরি',
    body: 'নিজের ব্যাংক, মোবাইল ব্যাংকিং বা নগদ অ্যাকাউন্ট "ওয়ালেট" হিসেবে যোগ করুন। প্রতিটি লেনদেনকে ক্যাটাগরিতে ভাগ করুন।',
  },
  {
    icon: Repeat,
    title: 'পুনরাবৃত্তি লেনদেন (নতুন!)',
    body: 'মাসিক ভাড়া, সাপ্তাহিক বাজার বা বার্ষিক বিল — একবার সেট করুন, সিস্টেম স্বয়ংক্রিয়ভাবে যোগ করবে।',
  },
  {
    icon: BarChart3,
    title: 'বিশ্লেষণ ও রিপোর্ট',
    body: '"বিশ্লেষণ" পেজে আপনার আয়-ব্যয়ের চার্ট ও PDF রিপোর্ট ডাউনলোড করতে পারবেন।',
  },
  {
    icon: CheckCircle2,
    title: 'প্রস্তুত!',
    body: 'যেকোনো সময় হেল্প/গাইড পেজ থেকে আরো জানতে পারবেন। শুরু করুন!',
  },
];

export function DashboardTour() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') return;
    } catch {
      return;
    }
    // Show after a brief delay so dashboard renders first
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [user]);

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setOpen(false);
  };

  const cur = STEPS[step];
  const Icon = cur.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) finish(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-center font-display text-xl mt-3">{cur.title}</DialogTitle>
          <DialogDescription className="text-center text-sm leading-relaxed">
            {cur.body}
          </DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 my-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted'}`}
            />
          ))}
        </div>

        <div className="flex justify-between gap-2 mt-2">
          <Button variant="ghost" size="sm" onClick={finish}>
            এড়িয়ে যান
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="mr-1 h-4 w-4" /> পেছনে
              </Button>
            )}
            {!isLast ? (
              <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                পরবর্তী <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={finish}>
                শুরু করুন
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
