import { DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <DollarSign className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold">JomaKhoros</span>
        </Link>

        <h1 className="font-display text-3xl font-bold mb-6">শর্তাবলী (Terms & Conditions)</h1>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/80">
          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">১. ফ্রি ট্রায়াল নীতি</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>প্রতিটি নতুন ব্যবহারকারী রেজিস্ট্রেশনের পর <strong>১ মাস ফ্রি ট্রায়াল</strong> পাবেন।</li>
              <li>ট্রায়াল চলাকালীন সকল প্রো ফিচার সম্পূর্ণ বিনামূল্যে ব্যবহার করা যাবে।</li>
              <li>ট্রায়ালের মেয়াদ শেষ হলে আপগ্রেড অপশন দেখানো হবে।</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">২. ফ্রি ভার্সনের সীমাবদ্ধতা</h2>
            <p>ট্রায়ালের মেয়াদ শেষ হলে এবং আপগ্রেড না করলে ফ্রি ভার্সনে নিম্নলিখিত সীমাবদ্ধতা থাকবে:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>শুধুমাত্র শেষ ১৫ দিনের লেনদেন দেখা যাবে</li>
              <li>পূর্ণ লেনদেনের ইতিহাস লুকানো থাকবে</li>
              <li>PDF এক্সপোর্ট নিষ্ক্রিয়</li>
              <li>কিছু রিপোর্ট সীমিত থাকবে</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">৩. সাবস্ক্রিপশন মূল্য</h2>
            <div className="rounded-lg border border-border p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b"><th className="text-left py-2">প্ল্যান</th><th className="text-right py-2">মূল্য</th></tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="py-2">১ মাস</td><td className="text-right py-2 font-semibold">১০ ৳</td></tr>
                  <tr className="border-b"><td className="py-2">৬ মাস</td><td className="text-right py-2 font-semibold">৫০ ৳</td></tr>
                  <tr><td className="py-2">১ বছর</td><td className="text-right py-2 font-semibold">১০০ ৳</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">৪. পেমেন্ট যাচাই প্রক্রিয়া</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>ব্যবহারকারী সাবস্ক্রিপশন প্ল্যান নির্বাচন করবেন</li>
              <li>বিকাশ / নগদ / রকেট নম্বরে অথবা ব্যাংক একাউন্টে টাকা পাঠাবেন</li>
              <li>পেমেন্ট পদ্ধতি ও ট্রানজেকশন/রেফারেন্স আইডি জমা দেবেন</li>
              <li>অ্যাডমিন যাচাই করে প্রো অ্যাকাউন্ট সক্রিয় করবেন</li>
            </ul>
            <div className="mt-3 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <p className="text-sm text-destructive font-medium">📱 মোবাইল পেমেন্ট নম্বর: 01770025816</p>
              <p className="text-xs text-destructive/80 mt-1">
                এটি একটি ব্যক্তিগত নম্বর, মার্চেন্ট অ্যাকাউন্ট নয়। শুধুমাত্র <strong>সেন্ড মানি</strong> করুন (বিকাশ / নগদ / রকেট)।
              </p>
            </div>
            <div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 p-3">
              <p className="text-sm text-primary font-medium">🏦 ব্যাংক একাউন্টের তথ্য</p>
              <div className="text-xs text-foreground/80 mt-1.5 space-y-0.5">
                <p><strong>ব্যাংক:</strong> Dutch Bangla Bank Limited</p>
                <p><strong>একাউন্ট নম্বর:</strong> 1151580002115</p>
                <p><strong>শাখা:</strong> Mirpur</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                ব্যাংক ট্রান্সফারের পর রেফারেন্স/ট্রানজেকশন আইডি অ্যাপে জমা দিন।
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">৫. ফিচার সীমাবদ্ধতা ব্যাখ্যা</h2>
            <div className="rounded-lg border border-border p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b"><th className="text-left py-2">অ্যাকাউন্ট ধরন</th><th className="text-left py-2">অ্যাক্সেস</th></tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="py-2">ট্রায়াল</td><td className="py-2">সম্পূর্ণ প্রো অ্যাক্সেস</td></tr>
                  <tr className="border-b"><td className="py-2">ফ্রি</td><td className="py-2">শেষ ১৫ দিন, PDF নেই, সীমিত রিপোর্ট</td></tr>
                  <tr><td className="py-2">প্রো</td><td className="py-2">সম্পূর্ণ অ্যাক্সেস</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">৬. রিফান্ড নীতি</h2>
            <p className="text-destructive font-medium">কোনো রিফান্ড প্রদান করা হবে না। সকল বিক্রয় চূড়ান্ত।</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-foreground">৭. সম্মতি</h2>
            <p>
              রেজিস্ট্রেশনের সময় "আমি শর্তাবলীতে সম্মত" চেকবক্স চেক করে আপনি উপরের সকল শর্তে সম্মত হচ্ছেন।
              এই চেকবক্স চেক না করলে রেজিস্ট্রেশন সম্পন্ন করা যাবে না।
            </p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <Link to="/register" className="text-primary hover:underline font-medium">← রেজিস্ট্রেশনে ফিরে যান</Link>
        </div>
      </div>
    </div>
  );
}
