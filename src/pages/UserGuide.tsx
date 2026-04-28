import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  BookOpen, Sparkles, TrendingUp, TrendingDown, PieChart, PiggyBank,
  Tag, Brain, Wallet, ShieldCheck, Smartphone, Share2,
  FileImage, FileText, Lightbulb, CheckCircle2, ArrowRight,
  UserPlus, Banknote, ListPlus, BarChart3, Edit3, Trash2,
  Calendar, Target, Eye, Zap, LogIn,
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const gettingStarted = [
  { icon: UserPlus, color: 'bg-blue-500', title: 'ধাপ ১: অ্যাকাউন্ট তৈরি বা লগইন', desc: 'প্রথমে নিবন্ধন করুন অথবা আপনার বিদ্যমান অ্যাকাউন্ট দিয়ে লগইন করুন।' },
  { icon: Wallet, color: 'bg-teal-500', title: 'ধাপ ২: ওয়ালেট যোগ করুন', desc: 'নগদ, ব্যাংক, বিকাশ, নগদ ইত্যাদি ওয়ালেট তৈরি করুন।' },
  { icon: Tag, color: 'bg-violet-500', title: 'ধাপ ৩: ক্যাটাগরি তৈরি করুন', desc: 'আয় ও ব্যয়ের জন্য আলাদা ক্যাটাগরি যোগ করুন।' },
  { icon: TrendingUp, color: 'bg-emerald-500', title: 'ধাপ ৪: লেনদেন যোগ করুন', desc: 'প্রতিদিনের আয় ও খরচ লিপিবদ্ধ করুন।' },
  { icon: BarChart3, color: 'bg-indigo-500', title: 'ধাপ ৫: অ্যানালিটিক্স দেখুন', desc: 'চার্ট ও রিপোর্টের মাধ্যমে আপনার আর্থিক অবস্থা বুঝুন।' },
];

const walletPoints = [
  { icon: Wallet, title: 'ওয়ালেট কী?', desc: 'ওয়ালেট হলো আপনার টাকা রাখার ভার্চুয়াল জায়গা—যেমন নগদ, ব্যাংক বা মোবাইল ব্যাংকিং অ্যাকাউন্ট।' },
  { icon: ListPlus, title: 'ওয়ালেট তৈরি করুন', desc: '"ওয়ালেট" পেজ থেকে নাম, ধরন (Cash/Bank/Mobile Banking) ও প্রাথমিক ব্যালেন্স দিয়ে নতুন ওয়ালেট তৈরি করুন।' },
  { icon: Banknote, title: 'ব্যালেন্স ম্যানেজ', desc: 'প্রতিটি লেনদেনের সাথে ওয়ালেটের ব্যালেন্স স্বয়ংক্রিয়ভাবে আপডেট হয়।' },
  { icon: ArrowRight, title: 'ওয়ালেটের মাঝে স্থানান্তর', desc: 'এক ওয়ালেট থেকে অন্য ওয়ালেটে সহজেই টাকা ট্রান্সফার করুন।' },
];

const categoryPoints = [
  { icon: Tag, title: 'ক্যাটাগরি কী?', desc: 'ক্যাটাগরি হলো আয়-ব্যয়ের ধরন—যেমন বেতন, খাবার, যাতায়াত ইত্যাদি।' },
  { icon: TrendingUp, title: 'আয়ের ক্যাটাগরি', desc: 'বেতন, ব্যবসা, ফ্রিল্যান্স, উপহার—এমন ক্যাটাগরি তৈরি করুন।' },
  { icon: TrendingDown, title: 'খরচের ক্যাটাগরি', desc: 'বাজার, ভাড়া, যাতায়াত, বিল, বিনোদন ইত্যাদি যোগ করুন।' },
  { icon: Edit3, title: 'এডিট ও মুছে ফেলা', desc: 'যেকোনো সময় ক্যাটাগরি এডিট বা মুছে ফেলতে পারবেন।' },
];

const transactionPoints = [
  { icon: TrendingUp, title: 'আয় যোগ করুন', desc: 'টাকার পরিমাণ, ক্যাটাগরি ও ওয়ালেট নির্বাচন করে আয় এন্ট্রি দিন।' },
  { icon: TrendingDown, title: 'খরচ যোগ করুন', desc: 'একইভাবে দৈনিক খরচ লিপিবদ্ধ করুন।' },
  { icon: Wallet, title: 'ওয়ালেট নির্বাচন', desc: 'কোন ওয়ালেট থেকে লেনদেনটি হয়েছে তা চিহ্নিত করুন।' },
  { icon: Tag, title: 'ক্যাটাগরি নির্বাচন', desc: 'সঠিক ক্যাটাগরি বাছাই করুন রিপোর্টিং সঠিক রাখতে।' },
  { icon: Edit3, title: 'নোট যোগ করুন (ঐচ্ছিক)', desc: 'লেনদেনের বিস্তারিত মনে রাখতে নোট লিখুন।' },
  { icon: Trash2, title: 'এডিট / ডিলিট', desc: 'ভুল হলে যেকোনো লেনদেন এডিট বা মুছে ফেলুন।' },
];

const analyticsPoints = [
  { icon: Eye, title: 'ওভারভিউ', desc: 'মোট আয়, মোট ব্যয় ও বর্তমান ব্যালেন্স এক নজরে দেখুন।' },
  { icon: BarChart3, title: 'বার ও পাই চার্ট', desc: 'মাসিক ট্রেন্ড ও ক্যাটাগরি-ভিত্তিক খরচ ভিজ্যুয়ালি বুঝুন।' },
  { icon: TrendingUp, title: 'ট্রেন্ড বিশ্লেষণ', desc: 'কোন মাসে কোথায় বেশি খরচ হচ্ছে তা বুঝে পরিকল্পনা করুন।' },
];

const features = [
  { icon: Wallet, title: 'মাল্টি-ওয়ালেট সাপোর্ট', desc: 'একাধিক ওয়ালেট একসাথে।' },
  { icon: Tag, title: 'ক্যাটাগরি ট্র্যাকিং', desc: 'ক্যাটাগরি অনুযায়ী রিপোর্ট।' },
  { icon: PieChart, title: 'অ্যানালিটিক্স ড্যাশবোর্ড', desc: 'ভিজ্যুয়াল চার্ট ও KPI।' },
  { icon: Smartphone, title: 'বাংলা-বান্ধব UI', desc: 'সহজ ও পরিষ্কার ডিজাইন।' },
  { icon: Brain, title: 'স্মার্ট ইনসাইটস', desc: 'খরচের প্যাটার্ন বুঝুন।' },
];

const tips = [
  { icon: Calendar, title: 'প্রতিদিন এন্ট্রি দিন', desc: 'রাতে মাত্র ২ মিনিট সময় নিয়ে দিনের লেনদেন লিখুন।' },
  { icon: Tag, title: 'সঠিক ক্যাটাগরি ব্যবহার করুন', desc: 'রিপোর্ট সঠিক রাখতে সঠিক ক্যাটাগরি বাছুন।' },
  { icon: Eye, title: 'সাপ্তাহিক রিভিউ', desc: 'প্রতি সপ্তাহে অ্যানালিটিক্স দেখে পরিকল্পনা করুন।' },
  { icon: Target, title: 'অপ্রয়োজনীয় খরচ কমান', desc: 'ট্রেন্ড দেখে অপ্রয়োজনীয় ব্যয় চিহ্নিত করুন।' },
];

const benefits = [
  { icon: ShieldCheck, title: 'টাকা ব্যবস্থাপনা সহজ করে', desc: 'কোথায় কত খরচ স্পষ্ট জানুন।' },
  { icon: PiggyBank, title: 'সঞ্চয়ের অভ্যাস বাড়ায়', desc: 'লক্ষ্য নির্ধারণ করে সঞ্চয় বাড়ান।' },
  { icon: Zap, title: 'নতুনদের জন্য সহজ', desc: 'যে কেউ মুহূর্তেই ব্যবহার করতে পারবেন।' },
];

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
  const guideRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (type: 'pdf' | 'image') => {
    if (!guideRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(guideRef.current, {
        scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false,
      });
      if (type === 'image') {
        const link = document.createElement('a');
        link.download = 'JomaKhoros-User-Guide.png';
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
        pdf.save('JomaKhoros-User-Guide.pdf');
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
      title: 'JomaKhoros - ব্যবহার নির্দেশিকা',
      text: 'JomaKhoros দিয়ে সহজেই আপনার আয়-ব্যয় ট্র্যাক করুন!',
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

  const content = (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">ব্যবহার নির্দেশিকা</h1>
          <p className="text-sm text-muted-foreground">JomaKhoros-এর সম্পূর্ণ ব্যবহার গাইড</p>
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

      {/* Exportable content */}
      <div ref={guideRef} className="space-y-6 bg-background p-2">
        {/* Hero / Welcome */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary via-primary to-emerald-600 text-primary-foreground shadow-lg">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">স্বাগতম</p>
                <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">JomaKhoros-এ আপনাকে স্বাগতম</h2>
                <p className="mt-3 text-sm opacity-95 sm:text-base">
                  দৈনন্দিন জীবনের জন্য একটি সহজ আয়-ব্যয় ট্র্যাকিং সিস্টেম। বাংলায় তৈরি, আপনার আর্থিক জীবনকে সহজ করার জন্য।
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <section>
          <SectionHeader icon={BookOpen} title="শুরু করার ধাপসমূহ" />
          <div className="grid gap-3 sm:grid-cols-2">
            {gettingStarted.map((s, i) => (
              <Card key={i} className="transition-shadow hover:shadow-md">
                <CardContent className="flex gap-3 p-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.color} text-white`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Wallet Management */}
        <section>
          <SectionHeader icon={Wallet} title="ওয়ালেট ব্যবস্থাপনা" />
          <div className="grid gap-3 sm:grid-cols-2">
            {walletPoints.map((p, i) => (
              <InfoCard key={i} {...p} color="bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300" />
            ))}
          </div>

          {/* Important Security Notice */}
          <Card className="mt-3 border-l-4 border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/30">
            <CardContent className="flex gap-3 p-4">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
              <div className="space-y-1">
                <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                  গুরুত্বপূর্ণ: ওয়ালেট ব্যালেন্স সম্পর্কে স্পষ্টীকরণ
                </p>
                <p className="text-sm text-emerald-800 dark:text-emerald-300">
                  JomaKhoros-এ যে ব্যালেন্স যোগ করা হয় তা <strong>সম্পূর্ণ ভার্চুয়াল ও ম্যানুয়াল হিসাবরক্ষণের তথ্য</strong> মাত্র — এটি আপনার আসল ব্যাংক, বিকাশ, নগদ বা রকেট অ্যাকাউন্টের সাথে <strong>কোনোভাবেই সংযুক্ত নয়</strong>।
                </p>
                <ul className="ml-4 list-disc space-y-1 text-sm text-emerald-800 dark:text-emerald-300">
                  <li>আমরা আপনার আসল অ্যাকাউন্টের কোনো তথ্য, পিন, OTP বা পাসওয়ার্ড <strong>চাই না এবং সংরক্ষণ করি না</strong>।</li>
                  <li>এখানে দেওয়া ব্যালেন্স আপনার নিজস্ব হিসাব রাখার জন্য — এটি দিয়ে কোনো টাকা পাঠানো, তোলা বা লেনদেন করা যায় না।</li>
                  <li>এই অ্যাপ থেকে কেউ আপনার আসল টাকা <strong>হ্যাক বা স্ক্যাম করতে পারবে না</strong>, কারণ অ্যাপটি কোনো আর্থিক প্রতিষ্ঠানের সাথে সরাসরি সংযুক্ত নয়।</li>
                  <li>মনে করুন এটি একটি <strong>ডিজিটাল খাতা/ডায়েরি</strong> — আপনি কাগজে যেভাবে আয়-ব্যয় লিখে রাখতেন, ঠিক সেভাবেই এখানে লিখে রাখছেন।</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Category Management */}
        <section>
          <SectionHeader icon={Tag} title="ক্যাটাগরি ব্যবস্থাপনা" />
          <div className="grid gap-3 sm:grid-cols-2">
            {categoryPoints.map((p, i) => (
              <InfoCard key={i} {...p} color="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" />
            ))}
          </div>
        </section>

        {/* Transactions */}
        <section>
          <SectionHeader icon={Banknote} title="লেনদেন (Transactions)" />
          <div className="grid gap-3 sm:grid-cols-2">
            {transactionPoints.map((p, i) => (
              <InfoCard key={i} {...p} color="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" />
            ))}
          </div>
        </section>

        {/* Analytics */}
        <section>
          <SectionHeader icon={BarChart3} title="অ্যানালিটিক্স ড্যাশবোর্ড" />
          <div className="grid gap-3">
            {analyticsPoints.map((p, i) => (
              <InfoCard key={i} {...p} color="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" />
            ))}
          </div>
        </section>

        {/* Tip box */}
        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="flex gap-3 p-4">
            <Lightbulb className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200">টিপ</p>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                প্রতিদিন রাতে মাত্র ২ মিনিট সময় নিয়ে দিনের লেনদেন এন্ট্রি করুন—এটি অভ্যাসে পরিণত হবে।
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <section>
          <SectionHeader icon={Sparkles} title="মূল ফিচারসমূহ" />
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((f, i) => (
              <InfoCard key={i} {...f} />
            ))}
          </div>
        </section>

        {/* Tips for Better Use */}
        <section>
          <SectionHeader icon={Lightbulb} title="ভালো ব্যবহারের টিপস" />
          <div className="grid gap-3 sm:grid-cols-2">
            {tips.map((t, i) => (
              <InfoCard key={i} {...t} color="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" />
            ))}
          </div>
        </section>

        {/* Why use */}
        <section>
          <SectionHeader icon={CheckCircle2} title="কেন JomaKhoros ব্যবহার করবেন" />
          <div className="grid gap-3">
            {benefits.map((b, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <b.icon className="h-5 w-5" />
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

        {/* CTA for unauthenticated users */}
        {!user && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-emerald-500/5">
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-xl font-bold sm:text-2xl">আজই শুরু করুন আপনার আর্থিক যাত্রা</h3>
                <p className="mx-auto max-w-md text-sm text-muted-foreground">
                  JomaKhoros-এ বিনামূল্যে অ্যাকাউন্ট খুলুন এবং সহজেই আপনার আয়-ব্যয় ট্র্যাক করা শুরু করুন।
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button asChild size="lg">
                  <Link to="/register">
                    <UserPlus className="h-4 w-4" /> রেজিস্ট্রেশন করুন
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/login">
                    <LogIn className="h-4 w-4" /> লগইন করুন
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
            <p className="font-display text-lg font-bold">JomaKhoros</p>
            <p className="text-xs text-muted-foreground">আপনার ব্যক্তিগত আর্থিক সঙ্গী • Track. Save. Grow.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (user) return content;

  // Public layout for unauthenticated visitors
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold">JomaKhoros</span>
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

