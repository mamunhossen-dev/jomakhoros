import { RoleGuideView } from '@/components/RoleGuideView';
import { ADMIN_GUIDE } from '@/lib/roleCapabilities';

export default function AdminGuide() {
  return (
    <RoleGuideView
      title="এডমিন গাইড"
      subtitle="JomaKhoros প্ল্যাটফর্মে আপনার সম্পূর্ণ ক্ষমতা ও দায়িত্বের একটি বিস্তারিত রেফারেন্স।"
      badgeLabel="এডমিন"
      badgeClass="bg-primary/15 text-primary border-primary/30"
      sections={ADMIN_GUIDE}
      intro={
        <>
          👑 <strong>স্বাগতম, এডমিন!</strong> আপনার কাছে JomaKhoros প্ল্যাটফর্মের সম্পূর্ণ নিয়ন্ত্রণ আছে।
          এই গাইডে আপনি কী কী করতে পারবেন এবং কোথায় সেই অপশন পাবেন তার বিস্তারিত আছে।
          মডারেটরদের পাঠানো রিকোয়েস্ট দেখতে যান <strong>এডমিন প্যানেল → অ্যাডমিন রিকোয়েস্ট ট্যাব</strong> এ।
        </>
      }
    />
  );
}
