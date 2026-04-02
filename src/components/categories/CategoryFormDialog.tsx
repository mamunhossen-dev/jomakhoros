import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateCategory, useUpdateCategory } from '@/hooks/useCategories';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editCategory?: Category | null;
}

export function CategoryFormDialog({ open, onOpenChange, editCategory }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const isEdit = !!editCategory;

  useEffect(() => {
    if (editCategory) {
      setName(editCategory.name);
      setType(editCategory.type);
    } else {
      setName('');
      setType('expense');
    }
  }, [editCategory, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: name.trim(), type };
    if (isEdit) {
      updateMutation.mutate({ ...payload, id: editCategory.id }, { onSuccess: () => onOpenChange(false) });
    } else {
      createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন ক্যাটাগরি'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'income' ? 'default' : 'outline'}
              className={type === 'income' ? 'bg-success hover:bg-success/90 flex-1' : 'flex-1'}
              onClick={() => setType('income')}
            >
              আয়
            </Button>
            <Button
              type="button"
              variant={type === 'expense' ? 'default' : 'outline'}
              className={type === 'expense' ? 'bg-destructive hover:bg-destructive/90 flex-1' : 'flex-1'}
              onClick={() => setType('expense')}
            >
              ব্যয়
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">ক্যাটাগরির নাম</Label>
            <Input
              id="name"
              placeholder="যেমন: খাবার, বেতন..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending || !name.trim()}>
            {isPending ? 'সংরক্ষণ হচ্ছে...' : isEdit ? 'আপডেট করুন' : 'যোগ করুন'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
