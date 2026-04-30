import { RoleGuideView } from '@/components/RoleGuideView';
import { MODERATOR_GUIDE } from '@/lib/roleCapabilities';

export default function ModeratorGuide() {
  return (
    <RoleGuideView
      title="মডারেটর গাইড"
      subtitle="আপনি কী কী করতে পারেন এবং কী কী এডমিনের কাছে পাঠাতে হবে — সব এক জায়গায়।"
      badgeLabel="মডারেটর"
      badgeClass="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
      sections={MODERATOR_GUIDE}
      intro={
        <>
          👋 <strong>স্বাগতম, মডারেটর!</strong> JomaKhoros টিমে সাহায্য করার জন্য ধন্যবাদ।
          এই গাইডে আপনার সব দায়িত্ব ও সীমাবদ্ধতা পরিষ্কারভাবে দেওয়া আছে।
          যা আপনি করতে পারবেন না, সেগুলোর জন্য সাপোর্ট চ্যাট থেকে
          <strong> 🛡️ "এডমিনে ফরোয়ার্ড"</strong> বাটন অথবা এডমিন প্যানেলের
          <strong> "অ্যাডমিন রিকোয়েস্ট"</strong> ট্যাব ব্যবহার করুন।
        </>
      }
    />
  );
}
