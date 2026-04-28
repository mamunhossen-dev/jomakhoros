import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type Wallet = {
  id: string;
  user_id: string;
  name: string;
  wallet_type: string;
  balance: number;
  created_at: string;
  updated_at: string;
};

const OPENING_CAT_NAME = 'ওয়ালেট ওপেনিং ব্যালেন্স';
const CLOSING_CAT_NAME = 'ওয়ালেট ক্লোজিং ব্যালেন্স';

async function ensureCategory(userId: string, name: string, type: 'income' | 'expense') {
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .eq('name', name)
    .eq('type', type)
    .maybeSingle();
  if (existing?.id) return existing.id;
  const { data, error } = await supabase
    .from('categories')
    .insert({ user_id: userId, name, type })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export function useWallets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Wallet[];
    },
    enabled: !!user,
  });
}

export function useCreateWallet() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { name: string; wallet_type: string; balance: number }) => {
      const { data, error } = await supabase
        .from('wallets')
        .insert({ ...input, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;

      // যদি ওপেনিং ব্যালেন্স > 0 হয়, একটি income ট্রানজ্যাকশন যোগ করি যাতে মোট আয়/ব্যালেন্স মিলে যায়
      if (Number(input.balance) > 0) {
        const catId = await ensureCategory(user!.id, OPENING_CAT_NAME, 'income');
        const today = new Date().toISOString().slice(0, 10);
        await supabase.from('transactions').insert({
          user_id: user!.id,
          amount: Number(input.balance),
          type: 'income',
          category_id: catId,
          wallet_id: null,
          to_wallet_id: null,
          description: `${input.name} - ওপেনিং ব্যালেন্স`,
          date: today,
        });
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallets'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('ওয়ালেট যোগ হয়েছে');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateWallet() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; wallet_type?: string; balance?: number }) => {
      // পুরাতন ব্যালেন্স আনি যাতে পার্থক্য সমন্বয় করতে পারি
      const { data: prev } = await supabase
        .from('wallets')
        .select('balance, name')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('wallets')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      if (prev && input.balance !== undefined) {
        const diff = Number(input.balance) - Number(prev.balance);
        if (diff !== 0) {
          const isIncome = diff > 0;
          const amt = Math.abs(diff);
          const catName = isIncome ? OPENING_CAT_NAME : CLOSING_CAT_NAME;
          const catId = await ensureCategory(user!.id, catName, isIncome ? 'income' : 'expense');
          const today = new Date().toISOString().slice(0, 10);
          await supabase.from('transactions').insert({
            user_id: user!.id,
            amount: amt,
            type: isIncome ? 'income' : 'expense',
            category_id: catId,
            wallet_id: null,
            to_wallet_id: null,
            description: `${input.name ?? prev.name} - ব্যালেন্স সমন্বয়`,
            date: today,
          });
        }
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallets'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('ওয়ালেট আপডেট হয়েছে');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteWallet() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      // ডিলেটের আগে ব্যালেন্স আনি
      const { data: w } = await supabase
        .from('wallets')
        .select('name, balance')
        .eq('id', id)
        .single();

      const { error } = await supabase.from('wallets').delete().eq('id', id);
      if (error) throw error;

      if (w && Number(w.balance) > 0) {
        const catId = await ensureCategory(user!.id, CLOSING_CAT_NAME, 'expense');
        const today = new Date().toISOString().slice(0, 10);
        await supabase.from('transactions').insert({
          user_id: user!.id,
          amount: Number(w.balance),
          type: 'expense',
          category_id: catId,
          wallet_id: null,
          to_wallet_id: null,
          description: `${w.name} - ওয়ালেট ক্লোজিং ব্যালেন্স`,
          date: today,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallets'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('ওয়ালেট মুছে ফেলা হয়েছে');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
