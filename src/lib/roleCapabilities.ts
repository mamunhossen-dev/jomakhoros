/**
 * Centralized role capability definitions.
 *
 * Add a new entry here whenever a new feature/scope is created — both the
 * Moderator Guide (/moderator-guide) and the Admin Guide (/admin-guide) will
 * auto-update from this single source of truth.
 */

export type CapabilityStatus = 'allowed' | 'forbidden' | 'partial';

export interface Capability {
  /** Short title shown in the guide list */
  title: string;
  /** One-line plain Bangla description */
  description: string;
  /** Where in the app it lives — e.g. "এডমিন প্যানেল → ইউজার ম্যানেজমেন্ট" */
  location?: string;
  /** Optional how-to / extra notes */
  howTo?: string;
  status: CapabilityStatus;
}

export interface CapabilitySection {
  id: string;
  title: string;
  icon: string; // lucide icon name (string, resolved in component)
  items: Capability[];
}

/* ============================================================
   MODERATOR — যা পারেন এবং যা পারেন না
   ============================================================ */
export const MODERATOR_GUIDE: CapabilitySection[] = [
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
        description: 'TxID যাচাই করে ইউজারের পেমেন্ট অনুমোদন বা প্রত্যাখ্যান করতে পারবেন।',
        location: 'এডমিন প্যানেল → পেমেন্ট ট্যাব → প্রতিটি কার্ডের অনুমোদন/প্রত্যাখ্যান বাটন',
        howTo: 'TxID ও অ্যামাউন্ট যাচাই করুন → অনুমোদন করলে ইউজারের প্রো প্ল্যান স্বয়ংক্রিয়ভাবে সক্রিয় হবে।',
        status: 'allowed',
      },
      {
        title: 'পেমেন্ট নোট লেখা',
        description: 'প্রতিটি পেমেন্ট রিকোয়েস্টে এডমিন নোট যোগ করতে পারবেন।',
        status: 'allowed',
      },
      {
        title: 'পেমেন্ট ডিলিট',
        description: 'পেমেন্ট রিকোয়েস্ট স্থায়ীভাবে ডিলিট করতে পারবেন না — শুধু এডমিন পারেন।',
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
        title: 'কুইক রিপ্লাই টেমপ্লেট ব্যবহার',
        description: '২৭+ প্রি-রিটেন বাংলা টেমপ্লেট এক ক্লিকে পাঠাতে পারবেন (গ্রিটিং, পেমেন্ট, অ্যাকাউন্ট, এসকেলেশন ইত্যাদি)।',
        location: 'সাপোর্ট চ্যাট → ⚡ Quick Reply বাটন',
        status: 'allowed',
      },
      {
        title: 'টিকেট স্ট্যাটাস পরিবর্তন',
        description: 'টিকেটকে নতুন/চলমান/সমাধান হয়েছে/বন্ধ হিসেবে চিহ্নিত করতে পারবেন।',
        status: 'allowed',
      },
      {
        title: 'এডমিনে ফরোয়ার্ড করা',
        description: 'যা আপনি পারবেন না (পাসওয়ার্ড রিসেট, ইউজার ব্লক/ডিলিট ইত্যাদি) সেগুলো সরাসরি সাপোর্ট চ্যাট থেকে এডমিনে ফরোয়ার্ড করতে পারবেন।',
        location: 'সাপোর্ট চ্যাট → 🛡️ এডমিনে ফরোয়ার্ড বাটন',
        howTo: 'বাটনে ক্লিক → ধরন/প্রায়োরিটি/বিস্তারিত লিখে পাঠান → এডমিন তাৎক্ষণিক নোটিফিকেশন পাবেন।',
        status: 'allowed',
      },
      {
        title: 'সাপোর্ট মেসেজ ডিলিট',
        description: 'কোনো সাপোর্ট মেসেজ স্থায়ীভাবে মুছতে পারবেন না — শুধু এডমিন পারেন।',
        status: 'forbidden',
      },
    ],
  },
  {
    id: 'mod-feedback',
    title: 'ফিডব্যাক',
    icon: 'MessageSquare',
    items: [
      {
        title: 'সব ফিডব্যাক দেখা',
        description: 'ইউজারদের পাঠানো সব ফিডব্যাক পড়তে পারবেন।',
        location: 'এডমিন প্যানেল → ফিডব্যাক ট্যাব',
        status: 'allowed',
      },
      {
        title: 'ফিডব্যাক ডিলিট',
        description: 'ফিডব্যাক ডিলিট করতে পারবেন না — এটা শুধু এডমিনের কাজ। প্রয়োজনে এডমিনে ফরোয়ার্ড করুন।',
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
        title: 'রিপোর্ট ডিলিট',
        description: 'রিপোর্ট রেকর্ড স্থায়ীভাবে মুছতে পারবেন না — শুধু এডমিন।',
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
        description: 'যেসব কাজ আপনি একা করতে পারবেন না (১৬টি ক্যাটাগরি), সেগুলোর জন্য এডমিনের কাছে অনুরোধ পাঠাতে পারবেন।',
        location: 'এডমিন প্যানেল → অ্যাডমিন রিকোয়েস্ট ট্যাব → "নতুন রিকোয়েস্ট" বাটন',
        status: 'allowed',
      },
      {
        title: 'নিজের রিকোয়েস্টের স্ট্যাটাস ট্র্যাক',
        description: 'আপনার পাঠানো সব রিকোয়েস্টের অবস্থা (অপেক্ষমাণ/অনুমোদিত/সম্পন্ন/প্রত্যাখ্যাত) দেখতে পারবেন।',
        location: 'অ্যাডমিন রিকোয়েস্ট ট্যাব → "আমার পাঠানো"',
        status: 'allowed',
      },
      {
        title: 'অন্যদের রিকোয়েস্টে রেসপন্স',
        description: 'অন্য মডারেটর/ইউজারের পাঠানো রিকোয়েস্টে রেসপন্ড করতে পারবেন না — শুধু এডমিন।',
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
      { title: 'সাবস্ক্রিপশন/ট্রায়াল ম্যানুয়াল এডিট', description: 'শুধু এডমিন পারেন।', status: 'forbidden' },
      { title: 'গ্লোবাল নোটিফিকেশন/ঘোষণা পাঠানো', description: 'শুধু এডমিন পারেন।', status: 'forbidden' },
      { title: 'সাইট সেটিংস/ব্র্যান্ডিং পরিবর্তন', description: 'শুধু এডমিন পারেন।', status: 'forbidden' },
      { title: 'পেইজ কন্টেন্ট এডিট (Landing/Terms/About/Guide)', description: 'শুধু এডমিন পারেন।', status: 'forbidden' },
      { title: 'অডিট লগ চেক', description: 'শুধু এডমিন পারেন।', status: 'forbidden' },
      { title: 'প্রোফাইল ডেটা সংশোধন', description: 'এডমিনে ফরোয়ার্ড করুন।', status: 'forbidden' },
    ],
  },
];

/* ============================================================
   ADMIN — সম্পূর্ণ ক্ষমতা
   ============================================================ */
export const ADMIN_GUIDE: CapabilitySection[] = [
  {
    id: 'adm-users',
    title: 'ইউজার ম্যানেজমেন্ট',
    icon: 'Users',
    items: [
      {
        title: 'সব ইউজার দেখা ও সার্চ',
        description: 'নাম/ইমেইল/ফোন/UID দিয়ে ইউজার খুঁজুন; প্ল্যান, রোল, সাইনআপ তারিখ অনুযায়ী ফিল্টার করুন।',
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
        location: 'ইউজার কার্ড → 🗑️ ডিলিট বাটন',
        status: 'allowed',
      },
      {
        title: 'প্রোফাইল ডেটা সংশোধন',
        description: 'ইউজারের নাম, ফোন, ঠিকানা সরাসরি এডিট করতে পারেন।',
        location: 'ইউজার কার্ড → ✏️ এডিট বাটন',
        status: 'allowed',
      },
      {
        title: 'পাসওয়ার্ড রিসেট',
        description: 'ইউজারের জন্য নতুন পাসওয়ার্ড সেট করতে পারেন (Edge Function: admin-reset-password)।',
        location: 'ইউজার কার্ড → 🔑 পাসওয়ার্ড বাটন',
        status: 'allowed',
      },
      {
        title: 'রোল পরিবর্তন',
        description: 'যেকোনো ইউজারকে admin/moderator/user রোল দিতে পারেন।',
        location: 'ইউজারস ট্যাব → প্রতিটি ইউজারের রোল ড্রপডাউন',
        status: 'allowed',
      },
      {
        title: 'বাল্ক অপারেশন',
        description: 'একসাথে একাধিক ইউজার ব্লক, ডিলিট অথবা পার্সোনাল নোটিফিকেশন পাঠাতে পারেন।',
        location: 'ইউজারস ট্যাব → চেকবক্স দিয়ে নির্বাচন → বাল্ক অ্যাকশন বাটন',
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
        description: 'মডারেটরের মতই সব কাজ করতে পারেন।',
        status: 'allowed',
      },
      {
        title: 'পেমেন্ট রিকোয়েস্ট ডিলিট',
        description: 'পেমেন্ট রেকর্ড স্থায়ীভাবে মুছতে পারেন।',
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
        description: 'সাবস্ক্রিপশন পেইজের প্ল্যান, দাম, ফিচার লিস্ট সম্পাদনা করতে পারেন।',
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
        title: 'গ্লোবাল ঘোষণা পাঠানো',
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
        description: 'রিইউজেবল নোটিফিকেশন টেমপ্লেট তৈরি/এডিট/ডিলিট করতে পারেন।',
        status: 'allowed',
      },
    ],
  },
  {
    id: 'adm-cms',
    title: 'CMS / কন্টেন্ট এডিটিং',
    icon: 'Pencil',
    items: [
      { title: 'Landing পেইজ এডিট', description: 'হোমপেইজের সব সেকশন কাস্টমাইজ করতে পারেন।', status: 'allowed' },
      { title: 'Terms & Conditions এডিট', description: 'শর্তাবলী পেইজের কন্টেন্ট পরিবর্তন করতে পারেন।', status: 'allowed' },
      { title: 'About পেইজ এডিট', description: 'About পেইজের কন্টেন্ট পরিবর্তন করতে পারেন।', status: 'allowed' },
      { title: 'User Guide এডিট', description: 'ইউজারদের জন্য গাইড পেইজ এডিট করতে পারেন।', status: 'allowed' },
      { title: 'Auth পেইজ এডিট', description: 'লগইন/রেজিস্টার পেইজের কন্টেন্ট ও স্বাগত মেসেজ এডিট করতে পারেন।', status: 'allowed' },
      { title: 'Welcome Banner এডিট', description: 'ড্যাশবোর্ডের ওয়েলকাম ব্যানার কাস্টমাইজ করতে পারেন।', status: 'allowed' },
    ],
  },
  {
    id: 'adm-settings',
    title: 'সাইট সেটিংস',
    icon: 'Settings',
    items: [
      { title: 'সাইট সেটিংস', description: 'গ্লোবাল কনফিগ পরিবর্তন করতে পারেন।', status: 'allowed' },
      { title: 'ব্র্যান্ডিং', description: 'লোগো, ব্র্যান্ড নাম, রং কাস্টমাইজ করতে পারেন।', status: 'allowed' },
      { title: 'সাইনআপ রুলস', description: 'নতুন রেজিস্ট্রেশন চালু/বন্ধ, ডিফল্ট রোল ও ট্রায়াল মেয়াদ সেট করতে পারেন।', status: 'allowed' },
      { title: 'টার্মস চেকবক্স টগল', description: 'রেজিস্ট্রেশনে শর্তাবলী চেকবক্স দেখানো নিয়ন্ত্রণ করতে পারেন।', status: 'allowed' },
    ],
  },
  {
    id: 'adm-support',
    title: 'সাপোর্ট ম্যানেজমেন্ট',
    icon: 'MessageCircle',
    items: [
      { title: 'মডারেটরের সব ক্ষমতা', description: 'উত্তর পাঠানো, কুইক রিপ্লাই, স্ট্যাটাস পরিবর্তন — সব করতে পারেন।', status: 'allowed' },
      { title: 'সাপোর্ট মেসেজ ডিলিট', description: 'কোনো মেসেজ বা টিকেট স্থায়ীভাবে মুছতে পারেন।', status: 'allowed' },
      { title: 'সাপোর্ট টেমপ্লেট ম্যানেজ', description: 'কুইক রিপ্লাই টেমপ্লেট তৈরি/এডিট/ডিলিট করতে পারেন।', status: 'allowed' },
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
        description: 'অনুমোদিত/চলমান/সম্পন্ন/প্রত্যাখ্যাত স্ট্যাটাস ও মন্তব্য পাঠাতে পারেন। ইউজার তাৎক্ষণিক নোটিফিকেশন পাবেন।',
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
        description: 'এডমিন/মডারেটরের সব অ্যাকশনের সম্পূর্ণ লগ দেখতে পারেন (কে, কখন, কী করেছে)।',
        location: 'এডমিন প্যানেল → অডিট লগ ট্যাব',
        status: 'allowed',
      },
      {
        title: 'অ্যানালিটিক্স ড্যাশবোর্ড',
        description: 'ইউজার গ্রোথ, রেভিনিউ, অ্যাক্টিভিটির গ্রাফ ও পরিসংখ্যান দেখতে পারেন।',
        location: 'এডমিন প্যানেল → অ্যানালিটিক্স',
        status: 'allowed',
      },
    ],
  },
];
