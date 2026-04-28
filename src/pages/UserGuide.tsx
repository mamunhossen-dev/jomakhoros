import { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen, Sparkles, TrendingUp, TrendingDown, PieChart, PiggyBank,
  Tag, Brain, Wallet, ShieldCheck, Smartphone, Download, Share2,
  FileImage, FileText, Lightbulb, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const steps = [
  { icon: TrendingUp, color: 'bg-emerald-500', title: 'ধাপ ১: আয় যোগ করুন', desc: 'আপনার মাসিক বেতন, ব্যবসার আয় বা অন্য যেকোনো উৎস থেকে আয় সহজেই যোগ করুন।' },
  { icon: TrendingDown, color: 'bg-rose-500', title: 'ধাপ ২: খরচ যোগ করুন', desc: 'প্রতিদিনের খরচ ক্যাটাগরি অনুযায়ী লিপিবদ্ধ করুন—বাজার, যাতায়াত, বিল ইত্যাদি।' },
  { icon: PieChart, color: 'bg-indigo-500', title: 'ধাপ ৩: বিশ্লেষণ দেখুন', desc: 'চার্ট ও গ্রাফের মাধ্যমে আপনার আয়-ব্যয়ের ট্রেন্ড পরিষ্কারভাবে বুঝুন।' },
  { icon: PiggyBank, color: 'bg-amber-500', title: 'ধাপ ৪: সঞ্চয় ট্র্যাক করুন', desc: 'মাসিক সঞ্চয়ের হার দেখুন এবং আর্থিক লক্ষ্য পূরণে এগিয়ে যান।' },
];

const features = [
  { icon: Wallet, title: 'আয় ও ব্যয় ট্র্যাকিং', desc: 'সব লেনদেন এক জায়গায়।' },
  { icon: PieChart, title: 'অ্যানালিটিক্স ড্যাশবোর্ড', desc: 'ভিজ্যুয়াল রিপোর্ট ও KPI।' },
  { icon: Tag, title: 'ক্যাটাগরি ম্যানেজমেন্ট', desc: 'নিজের মতো ক্যাটাগরি তৈরি করুন।' },
  { icon: Brain, title: 'স্মার্ট ইনসাইটস', desc: 'খরচের প্যাটার্ন বুঝুন।' },
];

const benefits = [
  { icon: ShieldCheck, title: 'খরচ নিয়ন্ত্রণে সাহায্য করে', desc: 'কোথায় কত খরচ হচ্ছে স্পষ্ট জানুন।' },
  { icon: PiggyBank, title: 'সঞ্চয়ের অভ্যাস উন্নত করে', desc: 'লক্ষ্য নির্ধারণ করে সঞ্চয় বাড়ান।' },
  { icon: Smartphone, title: 'সহজ ও বাংলা-বান্ধব UI', desc: 'যে কেউ মুহূর্তেই ব্যবহার করতে পারবেন।' },
];

export default function UserGuide() {
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

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">ব্যবহার নির্দেশিকা</h1>
          <p className="text-sm text-muted-foreground">JomaKhoros কীভাবে ব্যবহার করবেন তার সম্পূর্ণ গাইড</p>
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
                  আপনার আয় ও ব্যয় সহজেই ট্র্যাক করুন। বাংলায় তৈরি, আপনার জন্য।
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How to use */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold">কীভাবে ব্যবহার করবেন</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((s, i) => (
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
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold">ফিচার সমূহ</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((f, i) => (
              <Card key={i} className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Why use */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold">কেন ব্যবহার করবেন</h2>
          </div>
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
}
