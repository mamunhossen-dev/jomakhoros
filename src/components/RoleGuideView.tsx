import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, XCircle, AlertCircle, MapPin, Lightbulb, Sparkles } from 'lucide-react';
import * as Lucide from 'lucide-react';
import type { CapabilitySection, CapabilityStatus } from '@/lib/roleCapabilities';
import { cn } from '@/lib/utils';

const STATUS_META: Record<CapabilityStatus, { icon: typeof CheckCircle2; cls: string; label: string }> = {
  allowed: { icon: CheckCircle2, cls: 'text-emerald-600 dark:text-emerald-400', label: 'অনুমোদিত' },
  forbidden: { icon: XCircle, cls: 'text-destructive', label: 'অনুমোদিত নয়' },
  partial: { icon: AlertCircle, cls: 'text-amber-600 dark:text-amber-400', label: 'আংশিক' },
};

function ResolveIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (Lucide as any)[name] || Lucide.Circle;
  return <Icon className={className} />;
}

interface RoleGuideViewProps {
  title: string;
  subtitle: string;
  badgeLabel: string;
  badgeClass: string;
  sections: CapabilitySection[];
  intro?: React.ReactNode;
}

export function RoleGuideView({ title, subtitle, badgeLabel, badgeClass, sections, intro }: RoleGuideViewProps) {
  const totalAllowed = sections.reduce(
    (acc, s) => acc + s.items.filter(i => i.status === 'allowed').length, 0
  );
  const totalForbidden = sections.reduce(
    (acc, s) => acc + s.items.filter(i => i.status === 'forbidden').length, 0
  );

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={badgeClass}>
            <Sparkles className="mr-1 h-3 w-3" /> {badgeLabel}
          </Badge>
          <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
            <CheckCircle2 className="mr-1 h-3 w-3" /> {totalAllowed} অনুমোদিত
          </Badge>
          {totalForbidden > 0 && (
            <Badge variant="outline" className="text-destructive border-destructive/30">
              <XCircle className="mr-1 h-3 w-3" /> {totalForbidden} নিষিদ্ধ
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      {intro && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 text-sm">{intro}</CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {sections.map(section => (
          <Card key={section.id}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ResolveIcon name={section.icon} className="h-5 w-5 text-primary" />
                {section.title}
                <Badge variant="secondary" className="ml-auto text-xs">
                  {section.items.length}টি
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {section.items.map((item, idx) => {
                  const meta = STATUS_META[item.status];
                  const Icon = meta.icon;
                  return (
                    <AccordionItem key={idx} value={`${section.id}-${idx}`} className="border-b last:border-0">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-3 text-left flex-1 min-w-0">
                          <Icon className={cn('h-4 w-4 shrink-0', meta.cls)} />
                          <span className="font-medium text-sm truncate">{item.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pl-7 space-y-2 text-sm">
                        <p className="text-foreground/90">{item.description}</p>
                        {item.location && (
                          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                            <span><strong>অবস্থান:</strong> {item.location}</span>
                          </p>
                        )}
                        {item.howTo && (
                          <p className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/40 p-2 rounded">
                            <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                            <span>{item.howTo}</span>
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center pt-4">
        🔄 এই গাইড স্বয়ংক্রিয়ভাবে আপডেট হয় — নতুন ফিচার যোগ হলে এখানে প্রতিফলিত হবে।
      </p>
    </div>
  );
}
