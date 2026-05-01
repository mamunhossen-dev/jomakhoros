import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';

const TABLES = ['profiles', 'transactions', 'categories', 'wallets', 'budgets', 'loans'] as const;

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, any>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
}

export function DataExportCard() {
  const { user } = useAuth();
  const { accountType } = useSubscription();
  const [busy, setBusy] = useState<'json' | 'csv' | null>(null);

  // Free plan blocks PDF; we still allow JSON/CSV for everyone — adjust if needed
  const canExport = accountType !== 'free';

  const fetchAll = async () => {
    const result: Record<string, any[]> = {};
    for (const t of TABLES) {
      const { data, error } = await supabase.from(t as any).select('*').eq('user_id', user!.id);
      if (error) throw error;
      result[t] = data ?? [];
    }
    return result;
  };

  const handleJson = async () => {
    if (!canExport) {
      toast.error('এই ফিচারটি প্রো প্ল্যানে উপলব্ধ');
      return;
    }
    setBusy('json');
    try {
      const all = await fetchAll();
      const payload = {
        exported_at: new Date().toISOString(),
        user_id: user!.id,
        data: all,
      };
      downloadBlob(
        `jomakhoros-data-${new Date().toISOString().slice(0, 10)}.json`,
        new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      );
      toast.success('ডেটা ডাউনলোড শুরু হয়েছে');
    } catch (e: any) {
      toast.error(e.message || 'ব্যর্থ');
    } finally {
      setBusy(null);
    }
  };

  const handleCsv = async () => {
    if (!canExport) {
      toast.error('এই ফিচারটি প্রো প্ল্যানে উপলব্ধ');
      return;
    }
    setBusy('csv');
    try {
      const all = await fetchAll();
      // Concatenate as separate sections in one CSV file (with table headers)
      const parts: string[] = [];
      for (const [tbl, rows] of Object.entries(all)) {
        parts.push(`### ${tbl} ###`);
        parts.push(toCsv(rows as any[]));
        parts.push('');
      }
      downloadBlob(
        `jomakhoros-data-${new Date().toISOString().slice(0, 10)}.csv`,
        new Blob([parts.join('\n')], { type: 'text/csv;charset=utf-8' })
      );
      toast.success('CSV ডাউনলোড শুরু হয়েছে');
    } catch (e: any) {
      toast.error(e.message || 'ব্যর্থ');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Download className="h-4 w-4" /> ডেটা এক্সপোর্ট
        </CardTitle>
        <CardDescription>
          আপনার সব লেনদেন, ওয়ালেট, ক্যাটাগরি, বাজেট ও ঋণের তথ্য ডাউনলোড করুন।
          {!canExport && <span className="block mt-1 text-xs text-warning">প্রো প্ল্যানে আপগ্রেড করলে এই ফিচার ব্যবহার করতে পারবেন।</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-2">
        <Button onClick={handleJson} disabled={busy !== null || !canExport} variant="outline" className="flex-1">
          {busy === 'json' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileJson className="mr-2 h-4 w-4" />}
          JSON ডাউনলোড
        </Button>
        <Button onClick={handleCsv} disabled={busy !== null || !canExport} variant="outline" className="flex-1">
          {busy === 'csv' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
          CSV / Excel ডাউনলোড
        </Button>
      </CardContent>
    </Card>
  );
}
