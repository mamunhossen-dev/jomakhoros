import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  category?: { id: string; name: string; type: 'income' | 'expense' } | null;
};

export function useBudgets(month: number, year: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['budgets', month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*, category:categories(id, name, type)')
        .eq('month', month)
        .eq('year', year)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!user,
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { category_id: string; amount: number; month: number; year: number }) => {
      const { data, error } = await supabase
        .from('budgets')
        .insert({ ...input, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); toast.success('বাজেট যোগ হয়েছে'); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const { data, error } = await supabase
        .from('budgets')
        .update({ amount })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); toast.success('বাজেট আপডেট হয়েছে'); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); toast.success('বাজেট মুছে ফেলা হয়েছে'); },
    onError: (err: Error) => toast.error(err.message),
  });
}
