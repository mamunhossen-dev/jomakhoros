import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  category_id: string | null;
  wallet_id: string | null;
  to_wallet_id: string | null;
  description: string | null;
  date: string;
  created_at: string;
  category?: { id: string; name: string; type: 'income' | 'expense' } | null;
  wallet?: { id: string; name: string; wallet_type: string } | null;
  to_wallet?: { id: string; name: string; wallet_type: string } | null;
};

export type TransactionInput = {
  amount: number;
  type: TransactionType;
  category_id: string | null;
  wallet_id: string | null;
  to_wallet_id: string | null;
  description: string | null;
  date: string;
};

export function useTransactions(filters?: { dateFrom?: string; dateTo?: string; categoryId?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select('*, category:categories(id, name, type), wallet:wallets!transactions_wallet_id_fkey(id, name, wallet_type), to_wallet:wallets!transactions_to_wallet_id_fkey(id, name, wallet_type)')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.dateFrom) query = query.gte('date', filters.dateFrom);
      if (filters?.dateTo) query = query.lte('date', filters.dateTo);
      if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Transaction[];
    },
    enabled: !!user,
  });
}

export function useCategories(type?: 'income' | 'expense') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['categories', type],
    queryFn: async () => {
      let query = supabase.from('categories').select('*').order('name');
      if (type) query = query.eq('type', type);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: TransactionInput) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...input, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('লেনদেন সংরক্ষিত হয়েছে');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: TransactionInput & { id: string }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('লেনদেন আপডেট হয়েছে');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('লেনদেন মুছে ফেলা হয়েছে');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
