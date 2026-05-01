/**
 * Centralized role capability definitions.
 *
 * Single source of truth for:
 *  - /moderator-guide  → MODERATOR_GUIDE
 *  - /admin-guide      → ADMIN_GUIDE
 *  - /my-capabilities  → USER_GUIDE  (regular signed-in user)
 *
 * Add an entry here whenever a feature is added so all three guides stay in sync.
 */

export type CapabilityStatus = 'allowed' | 'forbidden' | 'partial';

export interface Capability {
  title: string;
  description: string;
  location?: string;
  howTo?: string;
  status: CapabilityStatus;
}

export interface CapabilitySection {
  id: string;
  title: string;
  icon: string;
  items: Capability[];
}

/* ============================================================
   USER (সাধারণ ইউজার) — যা যা করতে পারেন
   ============================================================ */
export const USER_GUIDE: CapabilitySection[] = [
  {
    id: 'usr-account',
    title: 'অ্যাকাউন্ট ও প্রোফাইল',
    icon: 'User',
    items: [
      {
        title: 'রেজিস্ট্রেশন ও লগইন',
        description: 'ইমেইল/পাসওয়ার্ড অথবা Google দিয়ে সাইন-আপ ও লগইন করতে পারবেন।',
        location: '/register এবং /login',
        howTo: 'নতুন হলে রেজিস্ট্রেশন → ইমেইল ভেরিফাই → লগইন। ভুলে গেলে "পাসওয়ার্ড ভুলে গেছি"।',
        status: 'allowed',
      },
      {
        title: 'প্রোফাইল আপডেট',
        description: 'নাম, ফোন, ঠিকানা, প্রোফাইল ছবি যেকোনো সময় পরিবর্তন করতে পারবেন।',
        location: 'সেটিংস → প্রোফাইল ট্যাব',
        status: 'allowed',
      },
      {
        title: 'পাসওয়ার্ড পরিবর্তন',
        description: 'বর্তমান পাসওয়ার্ড দিয়ে নতুন পাসওয়ার্ড সেট করতে পারবেন।',
        location: 'সেটিংস → সিকিউরিটি',
        status: 'allowed',
      },
      {
        title: 'নিজের অ্যাকাউন্ট ডিলিট',
        description: 'নিজে নিজে অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলতে পারবেন — সব ডেটা চলে যাবে।',
        location: 'সেটিংস → অ্যাকাউন্ট ডিলিট',
        howTo: 'কনফার্মেশন টাইপ করতে হবে — অপরিবর্তনীয়।',
        status: 'allowed',
      },
      {
        title: 'অন্য ইউজারের প্রোফাইল দেখা/এডিট',
        description: 'অন্য কারও তথ্য দেখতে বা পরিবর্তন করতে পারবেন না।',
        status: 'forbidden',
      },
    ],
  },
  {
    id: 'usr-transactions',
    title: 'লেনদেন (আয় ও ব্যয়)',
    icon: 'ArrowUpDown',
    items: [
      {
        title: 'নতুন আয়/ব্যয় যোগ',
        description: 'অসীম সংখ্যক আয় ও ব্যয় এন্ট্রি করতে পারবেন — ক্যাটাগরি, ওয়ালেট, তারিখ, নোট সহ।',
        location: 'লেনদেন → "নতুন লেনদেন" বাটন',
        status: 'allowed',
      },
      {
        title: 'লেনদেন এডিট/ডিলিট',
        description: 'যেকোনো সময় নিজের লেনদেন সংশোধন বা মুছে ফেলতে পারবেন।',
        status: 'allowed',
      },
      {
        title: 'ফিল্টার ও সার্চ',
        description: 'ক্যাটাগরি, ওয়ালেট, তারিখ-রেঞ্জ, ধরন (আয়/ব্যয়), সার্চ টেক্সট দিয়ে ফিল্টার।',
        location: 'লেনদেন পেইজ → উপরের ফিল্টার বার',
        status: 'allowed',
      },
      {
        title: 'রিসিট/PDF ডাউনলোড',
        description: 'প্রতিটি লেনদেনের রিসিট PDF হিসেবে ডাউনলোড করতে পারবেন।',
        status: 'partial',
        howTo: 'Free প্ল্যানে PDF নেই — Pro/Trial-এ পাবেন।',
      },
      {
        title: 'পুনরাবৃত্ত (Recurring) লেনদেন',
        description: 'নিয়মিত আয়/ব্যয় (যেমন: বেতন, বাড়িভাড়া) অটো-জেনারেটের জন্য সেট করতে পারবেন।',
        location: 'পুনরাবৃত্তি পেইজ',
        status: 'allowed',
      },
    ],
  },
  {
    id: 'usr-wallets',
    title: 'ওয়ালেট ও ক্যাটাগরি',
    icon: 'Wallet',
    items: [
      {
        title: 'ওয়ালেট তৈরি/এডিট/ডিলিট',
        description: 'ক্যাশ, bKash, Nagad, ব্যাংক — যত খুশি ওয়ালেট তৈরি করতে পারবেন।',
        location: 'ওয়ালেট পেইজ',
        status: 'allowed',
      },
      {
        title: 'ব্যালেন্স ট্রান্সফার',
        description: 'এক ওয়ালেট থেকে আরেক ওয়ালেটে টাকা স্থানান্তর করতে পারবেন।',
        location: 'ওয়ালেট পেইজ → "ট্রান্সফার" বাটন',
        status: 'allowed',
      },
      {
        title: 'কাস্টম ক্যাটাগরি',
        description: 'নিজের পছন্দমতো আয়/ব্যয় ক্যাটাগরি (আইকন ও রং সহ) তৈরি করতে পারবেন।',
        location: 'ক্যাটাগরি পেইজ',
        status: 'allowed',
      },
    ],
  },
  {
    id: 'usr-budget',
    title: 'বাজেট ও দেনা-পাওনা',
    icon: 'DollarSign',
    items: [
      {
        title: 'মাসিক/সাপ্তাহিক বাজেট সেট',
        description: 'প্রতিটি ক্যাটাগরির জন্য আলাদা বাজেট লিমিট সেট ও প্রোগ্রেস ট্র্যাক করতে পারবেন।',
        location: 'বাজেট পেইজ',
        status: 'allowed',
      },
      {
        title: 'দেনা-পাওনা রেকর্ড',
        description: 'কে কত টাকা পাবে/দিবে — তারিখ ও স্ট্যাটাস সহ ট্র্যাক করতে পারবেন।',
        location: 'দেনা/পাওনা পেইজ',
        status: 'allowed',
      },
      {
        title: 'লোন আংশিক/পূর্ণ পরিশোধ',
        description: 'যেকোনো লোনে কিস্তি যোগ করে আপডেট করতে পারবেন।',
        status: 'allowed',
      },
    ],
  },
  {
    id: 'usr-analytics',
    title: 'বিশ্লেষণ ও রিপোর্ট',
    icon: 'PieChart',
    items: [
      {
        title: 'গ্রাফিকাল রিপোর্ট',
        description: 'মাসিক আয়-ব্যয়, ক্যাটাগরি-ভিত্তিক পাই চার্ট, ট্রেন্ড লাইন দেখতে পারবেন।',
        location: 'বিশ্লেষণ পেইজ',
        status: 'allowed',
      },
      {
        title: 'PDF এনালিটিক্স এক্সপোর্ট',
        description: 'সম্পূর্ণ এনালিটিক্স রিপোর্ট PDF হিসেবে ডাউনলোড করতে পারবেন।',
        status: 'partial',
        howTo: 'Free প্ল্যানে PDF বন্ধ — Pro/Trial-এ পাবেন।',
      },
      {
        title: 'CSV ডেটা এক্সপোর্ট',
        description: 'নিজের সব লেনদেন CSV আকারে ডাউনলোড করতে পারবেন (যদি ফিচার চালু থাকে)।',
        location: 'সেটিংস → ডেটা এক্সপোর্ট',
        status: 'partial',
      },
    ],
  },
  {
    id: 'usr-subscription',
    title: 'সাবস্ক্রিপশন',
    icon: 'CreditCard',
    items: [
      {
        title: 'প্ল্যান দেখা ও বেছে নেওয়া',
        description: 'Trial / Free / Pro প্ল্যানের তুলনা দেখে নিজের পছন্দেরটি বেছে নিতে পারবেন।',
        location: 'সাবস্ক্রিপশন পেইজ',
        status: 'allowed',
      },
      {
        title: 'পেমেন্ট রিকোয়েস্ট জমা',
        description: 'bKash/Nagad/Rocket-এ ম্যানুয়াল পেমেন্ট করে TxID জমা দিতে পারবেন।',
        howTo: 'পেমেন্ট নম্বর: 01770025816 (Personal) — পাঠিয়ে TxID টাইপ করে সাবমিট।',
        status: 'allowed',
      },
      {
        title: 'নিজের পেমেন্ট স্ট্যাটাস ট্র্যাক',
        description: 'অপেক্ষমাণ/অনুমোদিত/প্রত্যাখ্যাত — সব দেখতে পারবেন।',
        status: 'allowed',
      },
      {
        title: 'রিফান্ড অনুরোধ',
        description: 'পেমেন্ট করলে কোনো রিফান্ড দেওয়া হয় না — অনুগ্রহ করে বুঝে পেমেন্ট করুন।',
        status: 'forbidden',
      },
    ],
  },
  {
    id: 'usr-support',
    title: 'সাপোর্ট ও যোগাযোগ',
    icon: 'MessageCircle',
    items: [
      {
        title: 'সাপোর্ট টিকেট খোলা',
        description: 'যেকোনো সমস্যায় সরাসরি এডমিন/মডারেটরের সাথে চ্যাট করতে পারবেন।',
        location: 'নিচে-ডানে চ্যাট আইকন',
        status: 'allowed',
      },
      {
        title: 'ফিডব্যাক পাঠানো',
        description: 'অ্যাপ সম্পর্কে আপনার মতামত বা ফিচার রিকোয়েস্ট পাঠাতে পারবেন।',
        location: 'ফিডব্যাক পেইজ',
        status: 'allowed',
      },
      {
        title: 'নোটিফিকেশন দেখা',
        description: 'এডমিন থেকে আসা সব ব্যক্তিগত ও গ্লোবাল নোটিফিকেশন এক জায়গায়।',
        location: 'উপরে বেল আইকন → নোটিফিকেশন',
        status: 'allowed',
      },
      {
        title: 'অন্য ইউজারের টিকেট দেখা',
        description: 'শুধু এডমিন/মডারেটর পারেন।',
        status: 'forbidden',
      },
    ],
  },
  {
    id: 'usr-security',
    title: 'ডেটা ও নিরাপত্তা',
    icon: 'ShieldCheck',
    items: [
      {
        title: 'নিজের ডেটা সম্পূর্ণ নিয়ন্ত্রণ',
        description: 'আপনার সব ডেটা শুধু আপনিই দেখতে ও পরিবর্তন করতে পারবেন (RLS দ্বারা সুরক্ষিত)।',
        status: 'allowed',
      },
      {
        title: 'লগআউট সব ডিভাইস থেকে',
        description: 'যেকোনো সময় সব সেশন থেকে লগআউট করে দিতে পারবেন।',
        location: 'সেটিংস → সিকিউরিটি',
        status: 'allowed',
      },
      {
        title: 'অন্য ইউজারের ডেটা অ্যাক্সেস',
        description: 'কোনোভাবেই সম্ভব নয় — সব রো-লেভেল সিকিউরিটি দ্বারা ব্লক।',
        status: 'forbidden',
      },
    ],
  },
];

/* ============================================================
   MODERATOR — যা পারেন এবং যা পারেন না
   ============================================================ */
export const MODERATOR_GUIDE: CapabilitySection[] = [
  {
    id: 'mod-overview',
    title: 'ভূমিকা ও দায়িত্ব',
    icon: 'Sparkles',
    items: [
      {
        title: 'মডারেটরের মূল দায়িত্ব',
        description: 'পেমেন্ট যাচাই, সাপোর্ট রিপ্লাই, ফিডব্যাক রিভিউ ও ফোরাম মডারেশন — এই চারটি মূল কাজ।',
        status: 'allowed',
      },
      {
        title: 'সম্পূর্ণ Pro অ্যাক্সেস',
        description: 'মডারেটর হিসেবে আপনি নিজেও সব Pro ফিচার ফ্রি-তে ব্যবহার করতে পারবেন।',
        status: 'allowed',
      },
      {
        title: 'দ্রুত এডমিনে ফরোয়ার্ড',
        description: 'যা আপনি পারবেন না সেটা সাপোর্ট চ্যাটের 🛡️ বাটন বা অ্যাডমিন রিকোয়েস্ট দিয়ে এডমিনে পাঠান।',
        status: 'allowed',
      },
    ],
  },
  {
    id: 'mod-payment',
    title: 'পেমেন্ট ম্যানেজমেন্ট',
    icon: 'CreditCard',
    items: [
      {
        title: 'পেমেন্ট রিকোয়েস্ট দেখা',
        description: 'সব ইউজারের জমা দেওয়া পেমেন্ট রিকোয়েস্ট দেখতে পারবেন।',
        location: 'এডমিন প্যানেল → পেমেন্ট ট্যাব',
        status: 'allowed',
      },
      {
        title: 'পেমেন্ট অনুমোদন/প্রত্যাখ্যান',
        description: 'TxID যাচাই করে পেমেন্ট অনুমোদন বা প্রত্যাখ্যান করতে পারবেন।',
        location: 'পেমেন্ট ট্যাব → প্রতিটি কার্ডের অনুমোদন/প্রত্যাখ্যান বাটন',
        howTo: 'TxID ও অ্যামাউন্ট যাচাই করুন → অনুমোদনে ইউজারের প্রো প্ল্যান স্বয়ংক্রিয়ভাবে সক্রিয় হবে।',
        status: 'allowed',
      },
      {
        title: 'পেমেন্ট নোট লেখা',
        description: 'প্রতিটি পেমেন্ট রিকোয়েস্টে এডমিন নোট যোগ করতে পারবেন।',
        status: 'allowed',
      },
      {
        title: 'ম্যানুয়াল Pro গ্রান্ট',
        description: 'বিশেষ ক্ষেত্রে ইউজারকে ম্যানুয়ালি Pro দিতে চাইলে — সেটি Admin Approval-এর মাধ্যমে যাবে।',
        howTo: 'অ্যাডমিন রিকোয়েস্ট → "ম্যানুয়াল Pro গ্রান্ট" → এডমিন অনুমোদন দিলে কার্যকর।',
        status: 'partial',
      },
      {
        title: 'পেমেন্ট রেকর্ড স্থায়ী ডিলিট',
        description: 'শুধু এডমিন পারেন।',
        status: 'forbidden',
      },
    ],
  },
  {
    id: 'mod-support',
    title: 'সাপোর্ট চ্যাট',
    icon: 'MessageCircle',
    items: [
      {
        title: 'সব সাপোর্ট টিকেট দেখা',
        description: 'ইউজারদের পাঠানো সব সাপোর্ট মেসেজ ও টিকেট দেখতে পারবেন।',
        location: 'এডমিন প্যানেল → সাপোর্ট ট্যাব',
        status: 'allowed',
      },
      {
        title: 'উত্তর পাঠানো',
        description: 'যেকোনো ওপেন টিকেটে ইউজারকে রিপ্লাই করতে পারবেন।',
        status: 'allowed',
      },
      {
        title: 'কুইক রিপ্লাই টেমপ্লেট',
        description: '২৭+ প্রি-রিটেন বাংলা টেমপ্লেট এক ক্লিকে পাঠাতে পারবেন।',
        location: 'সাপোর্ট চ্যাট → ⚡ Quick Reply বাটন',
        status: 'allowed',
      },
      {
        title: 'টিকেট স্ট্যাটাস পরিবর্তন',
        description: 'নতুন/চলমান/সমাধান হয়েছে/বন্ধ হিসেবে চিহ্নিত করতে পারবেন।',
        status: 'allowed',
      },
      {
        title: 'এডমিনে ফরোয়ার্ড',
        description: 'যা আপনি পারবেন না সেগুলো সরাসরি সাপোর্ট চ্যাট থেকে এডমিনে ফরোয়ার্ড করতে পারবেন।',
        location: 'সাপোর্ট চ্যাট → 🛡️ এডমিনে ফরোয়ার্ড',
        howTo: 'বাটনে ক্লিক → ধরন/প্রায়োরিটি/বিস্তারিত লিখে পাঠান।',
        status: 'allowed',
      },
      {
        title: 'সাপোর্ট মেসেজ স্থায়ী ডিলিট',
        description: 'শুধু এডমিন পারেন।',
        status: 'forbidden',
      },
    ],
  },
  {
    id: 'mod-feedback',
    title: 'ফিডব্যাক রিভিউ',
    icon: 'MessageSquare',
    items: [
      {
        title: 'সব ফিডব্যাক পড়া',
        description: 'ইউজারদের পাঠানো সব ফিডব্যাক পড়তে পারবেন।',
        location: 'এডমিন প্যানেল → ফিডব্যাক ট্যাব',
        status: 'allowed',
      },
      {
        title: 'গুরুত্বপূর্ণ ফিডব্যাক এডমিনে পাঠানো',
        description: 'এডমিন রিকোয়েস্ট সিস্টেম ব্যবহার করে গুরুত্বপূর্ণ ফিডব্যাক এডমিনের নজরে আনতে পারবেন।',
        status: 'allowed',
      },
      {
        title: 'ফিডব্যাক ডিলিট',
        description: 'শুধু এডমিন পারেন।',
        status: 'forbidden',
      },
    ],
  },
  {
    id: 'mod-forum',
    title: 'কমিউনিটি ফোরাম মডারেশন',
    icon: 'Users',
    items: [
      {
        title: 'পোস্ট/কমেন্ট হাইড বা ডিলিট',
        description: 'অনুপযুক্ত পোস্ট ও কমেন্ট মুছে ফেলতে পারবেন।',
        status: 'allowed',
      },
      {
        title: 'রিপোর্ট রিভিউ',
        description: 'ইউজারদের রিপোর্ট করা পোস্ট/কমেন্ট দেখে স্ট্যাটাস আপডেট করতে পারবেন।',
        status: 'allowed',
      },
      {
        title: 'রিপোর্ট রেকর্ড স্থায়ী ডিলিট',
        description: 'শুধু এডমিন পারেন।',
        status: 'forbidden',
      },
    ],
  },
  {
    id: 'mod-admin-requests',
    title: 'এডমিন রিকোয়েস্ট সিস্টেম',
    icon: 'Inbox',
    items: [
      {
        title: 'নতুন রিকোয়েস্ট পাঠানো',
        description: 'যেসব কাজ আপনি একা করতে পারবেন না (১৬+ ক্যাটাগরি), সেগুলোর জন্য এডমিনের কাছে অনুরোধ পাঠাতে পারবেন।',
        location: 'এডমিন প্যানেল → অ্যাডমিন রিকোয়েস্ট ট্যাব → "নতুন রিকোয়েস্ট"',
        status: 'allowed',
      },
      {
        title: 'নিজের রিকোয়েস্টের স্ট্যাটাস ট্র্যাক',
        description: 'সব পাঠানো রিকোয়েস্টের অবস্থা (অপেক্ষমাণ/অনুমোদিত/সম্পন্ন/প্রত্যাখ্যাত) দেখতে পারবেন।',
        location: 'অ্যাডমিন রিকোয়েস্ট ট্যাব → "আমার পাঠানো"',
        status: 'allowed',
      },
      {
        title: 'অন্যদের রিকোয়েস্টে রেসপন্স',
        description: 'শুধু এডমিন পারেন।',
        status: 'forbidden',
      },
    ],
  },
  {
    id: 'mod-restrictions',
    title: '⛔ যা মডারেটর করতে পারবেন না',
    icon: 'ShieldAlert',
    items: [
      { title: 'ইউজার ব্লক/আনব্লক', description: 'এডমিনে ফরোয়ার্ড করুন।', status: 'forbidden' },
      { title: 'ইউজার অ্যাকাউন্ট ডিলিট', description: 'এডমিনে ফরোয়ার্ড করুন।', status: 'forbidden' },
      { title: 'রোল পরিবর্তন (admin/moderator/user)', description: 'শুধু এডমিন পারেন।', status: 'forbidden' },
      { title: 'ইউজারের পাসওয়ার্ড রিসেট', description: 'এডমিনে ফরোয়ার্ড করুন।', status: 'forbidden' },
      { title: 'সাবস্ক্রিপশন/ট্রায়াল সরাসরি এডিট', description: 'শুধু এডমিন পারেন (অথবা admin-request)।', status: 'forbidden' },
      { title: 'গ্লোবাল নোটিফিকেশন/ঘোষণা পাঠানো', description: 'শুধু এডমিন পারেন।', status: 'forbidden' },
      { title: 'সাইট সেটিংস/ব্র্যান্ডিং পরিবর্তন', description: 'শুধু এডমিন পারেন।', status: 'forbidden' },
      { title: 'ফিচার ফ্ল্যাগ টগল', description: 'শুধু এডমিন পারেন।', status: 'forbidden' },
      { title: 'পেইজ কন্টেন্ট এডিট (Landing/Terms/About/Guide)', description: 'শুধু এডমিন পারেন।', status: 'forbidden' },
      { title: 'অডিট লগ চেক', description: 'শুধু এডমিন পারেন।', status: 'forbidden' },
      { title: 'প্রোফাইল ডেটা সংশোধন', description: 'এডমিনে ফরোয়ার্ড করুন।', status: 'forbidden' },
      { title: 'অ্যানালিটিক্স ড্যাশবোর্ড', description: 'শুধু এডমিন পারেন।', status: 'forbidden' },
    ],
  },
];

/* ============================================================
   ADMIN — সম্পূর্ণ ক্ষমতা
   ============================================================ */
export const ADMIN_GUIDE: CapabilitySection[] = [
  {
    id: 'adm-overview',
    title: 'ভূমিকা',
    icon: 'Crown',
    items: [
      {
        title: 'সর্বোচ্চ ক্ষমতা',
        description: 'প্ল্যাটফর্মের প্রতিটি অংশের সম্পূর্ণ পঠন/লিখন/মুছে ফেলার অধিকার আপনার আছে।',
        status: 'allowed',
      },
      {
        title: 'মডারেটরের সব ক্ষমতা + আরও',
        description: 'মডারেটর যা যা পারেন — পেমেন্ট/সাপোর্ট/ফিডব্যাক/ফোরাম — সবই আপনিও পারেন এবং অতিরিক্তভাবে অনেক কিছু।',
        status: 'allowed',
      },
      {
        title: 'এডমিন রিকোয়েস্ট ইনবক্স',
        description: 'মডারেটর/ইউজারের পাঠানো সব রিকোয়েস্ট দেখা ও দ্রুত রেসপন্স দেওয়া।',
        location: 'এডমিন প্যানেল → অ্যাডমিন রিকোয়েস্ট ট্যাব',
        status: 'allowed',
      },
    ],
  },
  {
    id: 'adm-users',
    title: 'ইউজার ম্যানেজমেন্ট',
    icon: 'Users',
    items: [
      {
        title: 'সব ইউজার দেখা ও সার্চ',
        description: 'নাম/ইমেইল/ফোন/UID দিয়ে ইউজার খুঁজুন; প্ল্যান, রোল, সাইনআপ তারিখ অনুযায়ী ফিল্টার।',
        location: 'এডমিন প্যানেল → ইউজারস ট্যাব',
        status: 'allowed',
      },
      {
        title: 'ইউজার ব্লক/আনব্লক',
        description: 'কারণসহ যেকোনো ইউজার ব্লক করতে পারেন — তারা অ্যাপের কোথাও ক্লিক করতে পারবেন না।',
        location: 'ইউজার কার্ড → 🔒 ব্লক/আনলক বাটন',
        status: 'allowed',
      },
      {
        title: 'ইউজার অ্যাকাউন্ট ডিলিট',
        description: 'auth + profile + সব ডেটা সম্পূর্ণভাবে মুছে ফেলে। অপরিবর্তনীয়।',
        location: 'ইউজার কার্ড → 🗑️ ডিলিট',
        status: 'allowed',
      },
      {
        title: 'প্রোফাইল ডেটা সংশোধন',
        description: 'ইউজারের নাম, ফোন, ঠিকানা সরাসরি এডিট করতে পারেন।',
        location: 'ইউজার কার্ড → ✏️ এডিট',
        status: 'allowed',
      },
      {
        title: 'পাসওয়ার্ড রিসেট',
        description: 'ইউজারের জন্য নতুন পাসওয়ার্ড সেট করতে পারেন (Edge Function দ্বারা)।',
        location: 'ইউজার কার্ড → 🔑 পাসওয়ার্ড',
        status: 'allowed',
      },
      {
        title: 'রোল পরিবর্তন',
        description: 'যেকোনো ইউজারকে admin/moderator/user রোল দিতে পারেন।',
        location: 'প্রতিটি ইউজারের রোল ড্রপডাউন',
        status: 'allowed',
      },
      {
        title: 'বাল্ক অপারেশন',
        description: 'একসাথে একাধিক ইউজার ব্লক, ডিলিট অথবা পার্সোনাল নোটিফিকেশন পাঠাতে পারেন।',
        location: 'ইউজারস ট্যাব → চেকবক্স দিয়ে নির্বাচন → বাল্ক অ্যাকশন',
        status: 'allowed',
      },
      {
        title: 'ইউজার ডেটা CSV এক্সপোর্ট',
        description: 'সব ইউজারের ডেটা CSV ফাইল হিসেবে ডাউনলোড করতে পারেন।',
        location: 'ইউজারস ট্যাব → 📥 Export CSV',
        status: 'allowed',
      },
      {
        title: 'গ্লোবাল ব্লক মেসেজ এডিট',
        description: 'ব্লকড ইউজার যে মেসেজটি দেখবে সেটি কাস্টমাইজ করতে পারেন।',
        status: 'allowed',
      },
    ],
  },
  {
    id: 'adm-payment',
    title: 'পেমেন্ট ও সাবস্ক্রিপশন',
    icon: 'CreditCard',
    items: [
      {
        title: 'পেমেন্ট রিকোয়েস্ট অনুমোদন/প্রত্যাখ্যান',
        description: 'মডারেটরের মতই সব কাজ + অতিরিক্ত নিয়ন্ত্রণ।',
        status: 'allowed',
      },
      {
        title: 'পেমেন্ট রেকর্ড স্থায়ী ডিলিট',
        description: 'যেকোনো পেমেন্ট রেকর্ড স্থায়ীভাবে মুছতে পারেন।',
        status: 'allowed',
      },
      {
        title: 'সাবস্ক্রিপশন ম্যানুয়াল এডিট',
        description: 'যেকোনো ইউজারের প্ল্যান, ট্রায়াল মেয়াদ, সাবস্ক্রিপশন শেষ তারিখ পরিবর্তন করতে পারেন।',
        location: 'এডমিন প্যানেল → সাবস্ক্রিপশন এডিটর',
        status: 'allowed',
      },
      {
        title: 'প্ল্যান প্রাইসিং পরিবর্তন',
        description: 'সাবস্ক্রিপশন পেইজের প্ল্যান, দাম, ফিচার লিস্ট সম্পাদনা।',
        status: 'allowed',
      },
      {
        title: 'পেমেন্ট ড্যাশবোর্ড',
        description: 'মাসিক রেভিনিউ, পেন্ডিং পেমেন্ট, কনভার্শন রেট দেখতে পারেন।',
        location: 'পেমেন্ট ট্যাব → পেমেন্ট ড্যাশবোর্ড',
        status: 'allowed',
      },
    ],
  },
  {
    id: 'adm-notifications',
    title: 'নোটিফিকেশন ও ঘোষণা',
    icon: 'Bell',
    items: [
      {
        title: 'গ্লোবাল ঘোষণা',
        description: 'সব ইউজারের কাছে একসাথে অ্যানাউন্সমেন্ট পাঠাতে পারেন (start/end সময় সহ)।',
        location: 'এডমিন প্যানেল → গ্লোবাল ঘোষণা',
        status: 'allowed',
      },
      {
        title: 'পার্সোনাল নোটিফিকেশন',
        description: 'নির্দিষ্ট ইউজার বা গ্রুপকে আলাদাভাবে নোটিফিকেশন পাঠাতে পারেন।',
        status: 'allowed',
      },
      {
        title: 'নোটিফিকেশন টেমপ্লেট ম্যানেজ',
        description: 'রিইউজেবল টেমপ্লেট তৈরি/এডিট/ডিলিট।',
        status: 'allowed',
      },
      {
        title: 'অটো-নোটিফিকেশন (প্ল্যান/রোল/ব্লক পরিবর্তনে)',
        description: 'এডমিন কোনো ইউজারের প্ল্যান, রোল বা ব্লক স্ট্যাটাস বদলালে ইউজার স্বয়ংক্রিয়ভাবে নোটিফিকেশন পান।',
        status: 'allowed',
      },
    ],
  },
  {
    id: 'adm-features',
    title: 'ফিচার ফ্ল্যাগ ও কনফিগ',
    icon: 'ToggleRight',
    items: [
      {
        title: 'ফিচার চালু/বন্ধ',
        description: 'যেকোনো সাম্প্রতিক ফিচার (ফিডব্যাক, নোটিফিকেশন, সাপোর্ট, অনবোর্ডিং, Google Sign-up, রেজিস্ট্রেশন ইত্যাদি) এক ক্লিকে চালু/বন্ধ করতে পারেন।',
        location: 'এডমিন প্যানেল → সেটিংস → ফিচার',
        status: 'allowed',
      },
      {
        title: 'ফিচারের প্ল্যান/রোল-গেটিং',
        description: 'প্রতিটি ফিচার Free/Trial/Pro অথবা User/Moderator/Admin-এর জন্য সীমাবদ্ধ করতে পারেন।',
        status: 'allowed',
      },
      {
        title: 'কাস্টম disabled message',
        description: 'ফিচার বন্ধ থাকলে ব্যবহারকারী কী মেসেজ দেখবেন (Hide / Coming Soon / Pro Only) সব এডিট করতে পারেন।',
        status: 'allowed',
      },
    ],
  },
  {
    id: 'adm-cms',
    title: 'CMS / কন্টেন্ট এডিটিং',
    icon: 'Pencil',
    items: [
      { title: 'Landing পেইজ এডিট', description: 'হোমপেইজের সব সেকশন কাস্টমাইজ।', status: 'allowed' },
      { title: 'Terms & Conditions এডিট', description: 'শর্তাবলী পেইজের কন্টেন্ট পরিবর্তন।', status: 'allowed' },
      { title: 'About পেইজ এডিট', description: 'About পেইজের কন্টেন্ট পরিবর্তন।', status: 'allowed' },
      { title: 'User Guide এডিট', description: 'ইউজার গাইড পেইজ এডিট।', status: 'allowed' },
      { title: 'Auth পেইজ এডিট', description: 'লগইন/রেজিস্টার পেইজের কন্টেন্ট ও স্বাগত মেসেজ।', status: 'allowed' },
      { title: 'Welcome Banner এডিট', description: 'ড্যাশবোর্ডের ওয়েলকাম ব্যানার।', status: 'allowed' },
    ],
  },
  {
    id: 'adm-settings',
    title: 'সাইট সেটিংস',
    icon: 'Settings',
    items: [
      { title: 'সাইট সেটিংস', description: 'গ্লোবাল কনফিগ পরিবর্তন।', status: 'allowed' },
      { title: 'ব্র্যান্ডিং', description: 'লোগো, ব্র্যান্ড নাম, রং কাস্টমাইজ।', status: 'allowed' },
      { title: 'সাইনআপ রুলস', description: 'নতুন রেজিস্ট্রেশন চালু/বন্ধ, ডিফল্ট রোল ও ট্রায়াল মেয়াদ সেট।', status: 'allowed' },
      { title: 'টার্মস চেকবক্স টগল', description: 'রেজিস্ট্রেশনে শর্তাবলী চেকবক্স দেখানো নিয়ন্ত্রণ।', status: 'allowed' },
      { title: 'পাসওয়ার্ড পলিসি', description: 'HIBP leaked-password প্রটেকশন চালু/বন্ধ এবং মিনিমাম দৈর্ঘ্য সেট।', status: 'allowed' },
    ],
  },
  {
    id: 'adm-support',
    title: 'সাপোর্ট ম্যানেজমেন্ট',
    icon: 'MessageCircle',
    items: [
      { title: 'মডারেটরের সব ক্ষমতা', description: 'উত্তর, কুইক রিপ্লাই, স্ট্যাটাস পরিবর্তন।', status: 'allowed' },
      { title: 'সাপোর্ট মেসেজ ডিলিট', description: 'কোনো মেসেজ বা টিকেট স্থায়ীভাবে মুছতে পারেন।', status: 'allowed' },
      { title: 'কুইক রিপ্লাই টেমপ্লেট ম্যানেজ', description: 'সব টেমপ্লেট তৈরি/এডিট/ডিলিট।', status: 'allowed' },
    ],
  },
  {
    id: 'adm-requests',
    title: 'এডমিন রিকোয়েস্ট সিস্টেম',
    icon: 'Inbox',
    items: [
      {
        title: 'মডারেটরদের সব রিকোয়েস্ট দেখা',
        description: 'ইনবক্সে সব পেন্ডিং/চলমান রিকোয়েস্ট দেখতে পারেন।',
        location: 'এডমিন প্যানেল → অ্যাডমিন রিকোয়েস্ট ট্যাব → 📥 ইনবক্স',
        status: 'allowed',
      },
      {
        title: 'রিকোয়েস্টে রেসপন্স দেওয়া',
        description: 'অনুমোদিত/চলমান/সম্পন্ন/প্রত্যাখ্যাত স্ট্যাটাস ও মন্তব্য পাঠাতে পারেন।',
        status: 'allowed',
      },
      {
        title: 'রিকোয়েস্ট ডিলিট',
        description: 'যেকোনো রিকোয়েস্ট স্থায়ীভাবে মুছতে পারেন।',
        status: 'allowed',
      },
    ],
  },
  {
    id: 'adm-audit',
    title: 'অডিট ও মনিটরিং',
    icon: 'ShieldCheck',
    items: [
      {
        title: 'অডিট লগ ভিউয়ার',
        description: 'এডমিন/মডারেটরের সব অ্যাকশনের সম্পূর্ণ লগ (কে, কখন, কী করেছে)।',
        location: 'এডমিন প্যানেল → অডিট লগ ট্যাব',
        status: 'allowed',
      },
      {
        title: 'অ্যানালিটিক্স ড্যাশবোর্ড',
        description: 'ইউজার গ্রোথ, রেভিনিউ, অ্যাক্টিভিটির গ্রাফ ও পরিসংখ্যান।',
        location: 'এডমিন প্যানেল → অ্যানালিটিক্স',
        status: 'allowed',
      },
      {
        title: 'ফিচার ফ্ল্যাগ অডিট',
        description: 'কোন এডমিন কখন কোন ফিচার টগল করল — সব লগে রেকর্ড থাকে।',
        status: 'allowed',
      },
    ],
  },
];
