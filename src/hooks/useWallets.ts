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
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wallets'] }); toast.success('ওয়ালেট যোগ হয়েছে'); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; wallet_type?: string; balance?: number }) => {
      const { data, error } = await supabase
        .from('wallets')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wallets'] }); toast.success('ওয়ালেট আপডেট হয়েছে'); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('wallets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wallets'] }); toast.success('ওয়ালেট মুছে ফেলা হয়েছে'); },
    onError: (err: Error) => toast.error(err.message),
  });
}
