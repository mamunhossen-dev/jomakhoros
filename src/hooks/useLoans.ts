import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type Loan = {
  id: string;
  user_id: string;
  person_name: string;
  amount: number;
  type: 'dena' | 'paona';
  description: string | null;
  due_date: string | null;
  is_settled: boolean;
  created_at: string;
  updated_at: string;
};

export type LoanInput = {
  person_name: string;
  amount: number;
  type: 'dena' | 'paona';
  description: string | null;
  due_date: string | null;
};

export function useLoans(showSettled = false) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['loans', showSettled],
    queryFn: async () => {
      let query = supabase
        .from('loans')
        .select('*')
        .order('is_settled', { ascending: true })
        .order('created_at', { ascending: false });
      if (!showSettled) query = query.eq('is_settled', false);
      const { data, error } = await query;
      if (error) throw error;
      return data as Loan[];
    },
    enabled: !!user,
  });
}

export function useCreateLoan() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: LoanInput) => {
      const { data, error } = await supabase
        .from('loans')
        .insert({ ...input, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['loans'] }); toast.success('ঋণ যোগ হয়েছে'); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<LoanInput> & { id: string; is_settled?: boolean }) => {
      const { data, error } = await supabase
        .from('loans')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['loans'] }); toast.success('আপডেট হয়েছে'); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('loans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['loans'] }); toast.success('মুছে ফেলা হয়েছে'); },
    onError: (err: Error) => toast.error(err.message),
  });
}
