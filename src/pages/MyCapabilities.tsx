import { RoleGuideView } from '@/components/RoleGuideView';
import { USER_GUIDE } from '@/lib/roleCapabilities';

export default function MyCapabilities() {
  return (
    <RoleGuideView
      title="ইউজার গাইড"
      subtitle="JomaKhoros-এ আপনি কী কী করতে পারবেন — পরিষ্কার ভাষায় একসাথে।"
      badgeLabel="ইউজার গাইড"
      badgeClass="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
      sections={USER_GUIDE}
      intro={
        <>
          🙋 <strong>স্বাগতম!</strong> এই গাইড আপনার সব সুবিধা, সীমাবদ্ধতা ও কোথায় কোন অপশন পাবেন
          সব এক জায়গায় দেখায়। কোনো সমস্যা হলে নিচের <strong>সাপোর্ট চ্যাট</strong> থেকে আমাদের জানান —
          আমরা দ্রুত সাহায্য করব।
        </>
      }
    />
  );
}
