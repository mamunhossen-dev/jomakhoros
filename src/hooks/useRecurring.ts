import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type Recurring = {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category_id: string | null;
  wallet_id: string | null;
  description: string | null;
  frequency: Frequency;
  interval_count: number;
  next_run_date: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  last_run_at: string | null;
  created_at: string;
};

export type RecurringInput = {
  type: 'income' | 'expense';
  amount: number;
  category_id: string | null;
  wallet_id: string | null;
  description: string | null;
  frequency: Frequency;
  interval_count: number;
  next_run_date: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
};

export function useRecurring() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['recurring'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_transactions' as any)
        .select('*')
        .order('next_run_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Recurring[];
    },
    enabled: !!user,
  });
}

export function useCreateRecurring() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: RecurringInput) => {
      const { error } = await supabase
        .from('recurring_transactions' as any)
        .insert({ ...input, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring'] });
      toast.success('পুনরাবৃত্তি যোগ হয়েছে');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<RecurringInput> & { id: string }) => {
      const { error } = await supabase
        .from('recurring_transactions' as any)
        .update(input)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring'] });
      toast.success('আপডেট হয়েছে');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_transactions' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring'] });
      toast.success('মুছে ফেলা হয়েছে');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
