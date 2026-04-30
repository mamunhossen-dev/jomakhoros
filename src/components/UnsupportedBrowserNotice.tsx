import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type DetectedBrowser = {
  name: string;
  reason: string;
} | null;

const STORAGE_KEY = 'unsupported_browser_dismissed_v1';

function detectUnsupportedBrowser(): DetectedBrowser {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';

  // Opera Mini — uses server-side proxy rendering, breaks SPAs
  if (/Opera Mini/i.test(ua)) {
    return {
      name: 'Opera Mini',
      reason:
        'Opera Mini সার্ভার-সাইড প্রক্সি দিয়ে পেজ রেন্ডার করে — এটি React-এর মতো আধুনিক অ্যাপ, রিয়েলটাইম আপডেট বা লগইন সেশন সাপোর্ট করে না।',
    };
  }

  // UC Browser Mini / UC Mini — similar proxy/cloud-rendering issues
  if (/UCBrowser\/.*Mini|UCWEB.*Mini|UCMini/i.test(ua) || /UCBrowser/i.test(ua)) {
    return {
      name: 'UC Browser',
      reason:
        'UC Browser-এর "Speed/Cloud" মোড পেজ কম্প্রেস করে আনে এবং অনেক আধুনিক JavaScript ও CSS ফিচার সাপোর্ট করে না, ফলে অ্যাপ ভেঙে যেতে পারে।',
    };
  }

  // Internet Explorer (any version) — no ES6+, no modern CSS
  if (/MSIE |Trident\//i.test(ua)) {
    return {
      name: 'Internet Explorer',
      reason:
        'Internet Explorer অনেক পুরনো — আধুনিক JavaScript (ES6+), CSS Grid বা Flexbox ঠিকমতো সাপোর্ট করে না। Microsoft নিজেই এটি বন্ধ করে দিয়েছে।',
    };
  }

  // KaiOS browser — feature-phone OS, very limited
  if (/KAIOS/i.test(ua)) {
    return {
      name: 'KaiOS Browser',
      reason:
        'KaiOS ফিচার-ফোনের জন্য তৈরি — সীমিত মেমরি ও পুরনো ব্রাউজার ইঞ্জিন থাকায় আধুনিক ওয়েব অ্যাপ চালাতে পারে না।',
    };
  }

  // Old Android stock browser (pre-Chrome WebView, Android < 5)
  const androidMatch = ua.match(/Android (\d+)/i);
  if (
    androidMatch &&
    parseInt(androidMatch[1], 10) < 5 &&
    /Android.*AppleWebKit/i.test(ua) &&
    !/Chrome|Firefox|Edg|Samsung/i.test(ua)
  ) {
    return {
      name: 'পুরনো Android Browser',
      reason:
        'আপনার Android ভার্সন (৫.০-এর নিচে) ও স্টক ব্রাউজার অনেক পুরনো — আধুনিক ওয়েব অ্যাপ ঠিকমতো চলবে না।',
    };
  }

  // Puffin browser — also uses cloud rendering
  if (/Puffin/i.test(ua)) {
    return {
      name: 'Puffin Browser',
      reason:
        'Puffin ক্লাউড-রেন্ডারিং ব্রাউজার — সার্ভার দিয়ে পেজ প্রক্রিয়া করে, ফলে লগইন সেশন ও রিয়েলটাইম ফিচার ঠিকমতো কাজ করে না।',
    };
  }

  return null;
}

export function UnsupportedBrowserNotice() {
  const [browser, setBrowser] = useState<DetectedBrowser>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') {
        setDismissed(true);
        return;
      }
    } catch {
      // sessionStorage may not work in some old browsers — show notice anyway
    }
    setBrowser(detectUnsupportedBrowser());
  }, []);

  if (!browser || dismissed) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  return (
    <div className="fixed inset-x-0 top-0 z-[100] border-b border-amber-300 bg-amber-50 px-3 py-3 shadow-md dark:border-amber-700 dark:bg-amber-950">
      <div className="mx-auto flex max-w-4xl items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="flex-1 space-y-1.5">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            আপনার ব্রাউজার ({browser.name}) এই অ্যাপ পুরোপুরি সাপোর্ট করে না
          </p>
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
            {browser.reason}
          </p>
          <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
            সম্পূর্ণ অভিজ্ঞতার জন্য <strong>Chrome</strong>, <strong>Firefox</strong>,{' '}
            <strong>Samsung Internet</strong> বা <strong>Edge</strong> ব্যবহার করুন।
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="shrink-0 text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900"
          aria-label="বন্ধ করুন"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
