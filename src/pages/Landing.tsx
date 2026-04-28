import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Wallet, TrendingUp, TrendingDown, PieChart, Tag, ShieldCheck,
  Smartphone, Sparkles, ArrowRight, BarChart3, PiggyBank, Zap,
  CheckCircle2, BookOpen, LogIn, UserPlus, Star,
} from 'lucide-react';

const features = [
  { icon: Wallet, title: 'মাল্টি-ওয়ালেট', desc: 'নগদ, ব্যাংক, বিকাশ — সব এক জায়গায়।', color: 'from-teal-500 to-emerald-600' },
  { icon: Tag, title: 'স্মার্ট ক্যাটাগরি', desc: 'আয়-ব্যয় সাজান আপনার মতো করে।', color: 'from-violet-500 to-purple-600' },
  { icon: BarChart3, title: 'লাইভ অ্যানালিটিক্স', desc: 'চার্ট ও রিপোর্টে স্পষ্ট চিত্র।', color: 'from-indigo-500 to-blue-600' },
  { icon: PiggyBank, title: 'বাজেট ও সঞ্চয়', desc: 'লক্ষ্য সেট করে সঞ্চয় বাড়ান।', color: 'from-pink-500 to-rose-600' },
  { icon: ShieldCheck, title: '১০০% নিরাপদ', desc: 'আপনার ডেটা এনক্রিপ্টেড।', color: 'from-emerald-500 to-teal-600' },
  { icon: Smartphone, title: 'মোবাইল ফ্রেন্ডলি', desc: 'যেকোনো ডিভাইসে নিখুঁত।', color: 'from-amber-500 to-orange-600' },
];

const stats = [
  { value: '১০,০০০+', label: 'সক্রিয় ব্যবহারকারী' },
  { value: '৫০ লক্ষ+', label: 'লেনদেন ট্র্যাক' },
  { value: '৪.৯★', label: 'গড় রেটিং' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground shadow-md">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold">JomaKhoros</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Button asChild variant="ghost" size="sm"><a href="#features">ফিচার</a></Button>
            <Button asChild variant="ghost" size="sm"><a href="#preview">প্রিভিউ</a></Button>
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
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -right-20 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              বাংলাদেশের #১ পার্সোনাল ফাইন্যান্স অ্যাপ
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              আপনার টাকা,{' '}
              <span className="bg-gradient-to-r from-primary via-emerald-500 to-teal-600 bg-clip-text text-transparent">
                আপনার নিয়ন্ত্রণে
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
              JomaKhoros দিয়ে দৈনন্দিন আয়-ব্যয় ট্র্যাক করুন, বাজেট তৈরি করুন এবং সহজেই সঞ্চয়ের অভ্যাস গড়ে তুলুন। সম্পূর্ণ বাংলায়, সম্পূর্ণ বিনামূল্যে শুরু।
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-emerald-600 text-base shadow-lg hover:opacity-90">
                <Link to="/register">
                  <UserPlus className="h-5 w-5" /> ফ্রি অ্যাকাউন্ট খুলুন
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base">
                <Link to="/user-guide">
                  <BookOpen className="h-5 w-5" /> কীভাবে কাজ করে
                </Link>
              </Button>
            </div>
            <div className="mt-6 flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="ml-2">৪.৯ • হাজারো ব্যবহারকারীর পছন্দ</span>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-4 border-t border-border/50 pt-8">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="font-display text-2xl font-bold text-primary sm:text-3xl">{s.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Preview / Mockup */}
      <section id="preview" className="relative px-4 pb-16 sm:pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="relative rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-emerald-500/5 p-3 shadow-2xl sm:p-6">
            {/* Mock dashboard */}
            <div className="rounded-xl border bg-card p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <div className="ml-2 text-xs text-muted-foreground">jomakhoros.app/dashboard</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-gradient-to-br from-primary/10 to-emerald-500/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">মোট ব্যালেন্স</span>
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  <div className="mt-2 font-display text-xl font-bold text-primary">৳ ৪৫,২৩০</div>
                </div>
                <div className="rounded-lg bg-success/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">আয়</span>
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>
                  <div className="mt-2 font-display text-xl font-bold text-success">৳ ৬০,০০০</div>
                </div>
                <div className="rounded-lg bg-destructive/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">ব্যয়</span>
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="mt-2 font-display text-xl font-bold text-destructive">৳ ১৪,৭৭০</div>
                </div>
              </div>
              {/* Fake bar chart */}
              <div className="mt-5 rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold">আয় বনাম ব্যয়</span>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex h-32 items-end gap-2 sm:gap-3">
                  {[
                    { i: 60, e: 35 }, { i: 75, e: 50 }, { i: 55, e: 40 },
                    { i: 90, e: 60 }, { i: 70, e: 45 }, { i: 85, e: 55 },
                  ].map((b, idx) => (
                    <div key={idx} className="flex flex-1 items-end gap-1">
                      <div className="flex-1 rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400" style={{ height: `${b.i}%` }} />
                      <div className="flex-1 rounded-t bg-gradient-to-t from-rose-600 to-rose-400" style={{ height: `${b.e}%` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Zap className="h-3.5 w-3.5" /> শক্তিশালী ফিচার
            </div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              আপনার জন্য যা যা দরকার, সব এক অ্যাপে
            </h2>
            <p className="mt-4 text-muted-foreground">
              সহজ, দ্রুত এবং কার্যকর — যাতে আপনি সময় নষ্ট না করে আর্থিক সিদ্ধান্ত নিতে পারেন।
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="group relative overflow-hidden border-border/50 transition-all hover:-translate-y-1 hover:shadow-xl">
                <CardContent className="p-6">
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-md`}>
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why us strip */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-primary via-emerald-600 to-teal-700 p-8 text-primary-foreground shadow-2xl sm:p-12">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                কেন JomaKhoros?
              </h2>
              <p className="mt-4 opacity-90">
                বাংলাভাষীদের জন্য, বাংলাদেশের প্রেক্ষাপটে তৈরি — যাতে হিসাব রাখা হয়ে ওঠে সহজ ও আনন্দদায়ক।
              </p>
            </div>
            <ul className="space-y-3">
              {[
                'সম্পূর্ণ বাংলায় ইন্টারফেস',
                'টাকার মাধ্যমে হিসাব (৳)',
                'বিকাশ, নগদ, রকেট সাপোর্ট',
                'PDF রিপোর্ট ডাউনলোড',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground shadow-lg">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            আজই শুরু করুন আপনার আর্থিক যাত্রা
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            মাত্র ১ মিনিটে অ্যাকাউন্ট খুলুন। কোনো ক্রেডিট কার্ড লাগবে না।
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-emerald-600 text-base shadow-lg hover:opacity-90">
              <Link to="/register">
                <UserPlus className="h-5 w-5" /> ফ্রি রেজিস্ট্রেশন
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <Link to="/login">
                <LogIn className="h-5 w-5" /> লগইন করুন
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
              <span className="font-display font-bold">JomaKhoros</span>
              <span className="text-xs text-muted-foreground">• Track. Save. Grow.</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link to="/user-guide" className="hover:text-foreground">গাইড</Link>
              <Link to="/terms" className="hover:text-foreground">শর্তাবলী</Link>
              <Link to="/login" className="hover:text-foreground">লগইন</Link>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">© 2026 JomaKhoros • সর্বস্বত্ব সংরক্ষিত</p>
        </div>
      </footer>
    </div>
  );
}
