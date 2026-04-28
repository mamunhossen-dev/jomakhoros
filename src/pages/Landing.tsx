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

const features = [
  { icon: Wallet, title: 'মাল্টি-ওয়ালেট', desc: 'নগদ, ব্যাংক, বিকাশ, রকেট — সব এক জায়গায়।', color: 'from-teal-500 to-emerald-600' },
  { icon: Tag, title: 'স্মার্ট ক্যাটাগরি', desc: 'আয়-ব্যয় সাজান আপনার মতো করে।', color: 'from-violet-500 to-purple-600' },
  { icon: BarChart3, title: 'লাইভ অ্যানালিটিক্স', desc: 'চার্ট ও রিপোর্টে স্পষ্ট চিত্র।', color: 'from-indigo-500 to-blue-600' },
  { icon: PiggyBank, title: 'বাজেট ও সঞ্চয়', desc: 'লক্ষ্য সেট করে সঞ্চয় বাড়ান।', color: 'from-pink-500 to-rose-600' },
  { icon: ShieldCheck, title: '১০০% নিরাপদ', desc: 'আপনার ডেটা সম্পূর্ণ সুরক্ষিত।', color: 'from-emerald-500 to-teal-600' },
  { icon: Smartphone, title: 'মোবাইল ফ্রেন্ডলি', desc: 'যেকোনো ডিভাইসে নিখুঁত।', color: 'from-amber-500 to-orange-600' },
  { icon: FileText, title: 'PDF রিপোর্ট', desc: 'মাসিক রিপোর্ট ডাউনলোড করুন এক ক্লিকে।', color: 'from-sky-500 to-blue-600' },
  { icon: Target, title: 'লোন ট্র্যাকিং', desc: 'ধার দেওয়া-নেওয়ার হিসাব রাখুন।', color: 'from-fuchsia-500 to-pink-600' },
  { icon: Globe, title: 'সম্পূর্ণ বাংলায়', desc: 'বাংলাভাষীদের জন্য তৈরি।', color: 'from-lime-500 to-green-600' },
];

const stats = [
  { value: '১০,০০০+', label: 'সক্রিয় ব্যবহারকারী' },
  { value: '৫০ লক্ষ+', label: 'লেনদেন ট্র্যাক' },
  { value: '৪.৯★', label: 'গড় রেটিং' },
];

const steps = [
  { icon: UserPlus2, title: 'অ্যাকাউন্ট খুলুন', desc: 'মাত্র ১ মিনিটে ফ্রি রেজিস্ট্রেশন করুন।' },
  { icon: Banknote, title: 'লেনদেন যোগ করুন', desc: 'প্রতিদিনের আয়-ব্যয় সহজে এন্ট্রি দিন।' },
  { icon: LineChart, title: 'অগ্রগতি দেখুন', desc: 'রিপোর্ট ও চার্টে আপনার আর্থিক চিত্র জানুন।' },
];

const testimonials = [
  {
    name: 'রাকিবুল হাসান',
    role: 'শিক্ষার্থী, ঢাকা',
    text: 'আগে মাস শেষে টাকা কোথায় খরচ হলো বুঝতাম না। JomaKhoros ব্যবহার শুরুর পর প্রতিটি টাকার হিসাব এখন আমার হাতে।',
  },
  {
    name: 'সুমাইয়া আক্তার',
    role: 'গৃহিণী, চট্টগ্রাম',
    text: 'বাজার, বিল, বাচ্চার খরচ — সব আলাদা ক্যাটাগরিতে রাখতে পারি। বাংলায় হওয়ায় ব্যবহার করা খুবই সহজ।',
  },
  {
    name: 'তানভীর আহমেদ',
    role: 'ফ্রিল্যান্সার, সিলেট',
    text: 'বিকাশ, ব্যাংক, নগদ — সব ওয়ালেট এক অ্যাপে। মাসিক PDF রিপোর্ট দেখে এখন বাজেট প্ল্যান করতে পারি।',
  },
];

const faqs = [
  {
    q: 'JomaKhoros কি ফ্রি?',
    a: 'হ্যাঁ, রেজিস্ট্রেশন সম্পূর্ণ বিনামূল্যে। প্রথম এক মাস সব Pro ফিচার ফ্রি ট্রায়াল হিসেবে পাবেন। এরপর আপনি ফ্রি প্ল্যানে চালিয়ে যেতে পারবেন বা মাত্র ১০ টাকা থেকে শুরু হওয়া Pro প্ল্যান নিতে পারবেন।',
  },
  {
    q: 'আমার ডেটা কি নিরাপদ?',
    a: 'অবশ্যই। আপনার সব ডেটা এনক্রিপ্টেড সার্ভারে সুরক্ষিত থাকে এবং শুধুমাত্র আপনি নিজেই অ্যাক্সেস করতে পারেন। আমরা কখনও আপনার তথ্য তৃতীয় পক্ষের সাথে শেয়ার করি না।',
  },
  {
    q: 'আমি কি একাধিক ওয়ালেট ব্যবহার করতে পারব?',
    a: 'হ্যাঁ। নগদ, ব্যাংক, বিকাশ, নগদ, রকেট — যত ইচ্ছা ওয়ালেট তৈরি করতে পারবেন এবং একটি থেকে অন্যটিতে সহজেই টাকা ট্রান্সফারের হিসাব রাখতে পারবেন।',
  },
  {
    q: 'মোবাইলে কি ব্যবহার করা যাবে?',
    a: 'হ্যাঁ। JomaKhoros সম্পূর্ণ মোবাইল-ফ্রেন্ডলি। যেকোনো স্মার্টফোন, ট্যাবলেট বা কম্পিউটারের ব্রাউজার থেকে সরাসরি ব্যবহার করতে পারবেন — কোনো অ্যাপ ইনস্টলের ঝামেলা নেই।',
  },
  {
    q: 'পেমেন্ট কীভাবে করব?',
    a: 'বিকাশ, নগদ বা রকেটের মাধ্যমে সরাসরি Send Money করে পেমেন্ট করতে পারবেন। পেমেন্টের পর ট্রানজেকশন আইডি দিলেই আপনার Pro সাবস্ক্রিপশন অ্যাক্টিভ হয়ে যাবে।',
  },
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
                <a href="#features">
                  <Sparkles className="h-5 w-5" /> ফিচারগুলো দেখুন
                </a>
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

      {/* How it works */}
      <section id="how" className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Clock className="h-3.5 w-3.5" /> মাত্র ৩ ধাপে শুরু
            </div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">কীভাবে কাজ করে</h2>
            <p className="mt-4 text-muted-foreground">
              জটিলতা নেই। মাত্র ১ মিনিটেই শুরু করতে পারবেন আপনার আর্থিক যাত্রা।
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                <Card className="h-full border-border/50 transition-all hover:-translate-y-1 hover:shadow-xl">
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground shadow-lg">
                      <s.icon className="h-7 w-7" />
                    </div>
                    <div className="mb-2 text-xs font-semibold text-primary">ধাপ {['১', '২', '৩'][i]}</div>
                    <h3 className="font-display text-lg font-bold">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
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
                'কোনো বিজ্ঞাপন নেই',
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

      {/* Testimonials */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <HeartHandshake className="h-3.5 w-3.5" /> ব্যবহারকারীদের কথা
            </div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              যারা JomaKhoros-কে ভালোবাসেন
            </h2>
            <p className="mt-4 text-muted-foreground">
              হাজারো মানুষ ইতোমধ্যে তাদের আর্থিক জীবন বদলেছেন। আপনিও যোগ দিন।
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-border/50 transition-all hover:shadow-xl">
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

      {/* FAQ */}
      <section id="faq" className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Bell className="h-3.5 w-3.5" /> সাধারণ প্রশ্ন
            </div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">আপনার প্রশ্ন, আমাদের উত্তর</h2>
            <p className="mt-4 text-muted-foreground">
              যদি আরও কিছু জানতে চান, আমাদের সাথে যোগাযোগ করুন।
            </p>
          </div>

          <Accordion type="single" collapsible className="mt-10 w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border/50">
                <AccordionTrigger className="text-left text-base font-semibold">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
