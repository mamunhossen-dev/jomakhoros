import { useState } from 'react';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryFormDialog } from '@/components/categories/CategoryFormDialog';
import { useCategories } from '@/hooks/useTransactions';
import { useDeleteCategory } from '@/hooks/useCategories';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Categories() {
  const [formOpen, setFormOpen] = useState(false);
  const [editCat, setEditCat] = useState<{ id: string; name: string; type: 'income' | 'expense' } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: allCategories, isLoading } = useCategories();
  const deleteMutation = useDeleteCategory();

  const incomeCategories = allCategories?.filter((c) => c.type === 'income') || [];
  const expenseCategories = allCategories?.filter((c) => c.type === 'expense') || [];

  const openEdit = (cat: { id: string; name: string; type: 'income' | 'expense' }) => {
    setEditCat(cat);
    setFormOpen(true);
  };

  const openAdd = () => {
    setEditCat(null);
    setFormOpen(true);
  };

  const renderList = (cats: typeof incomeCategories, type: 'income' | 'expense') => {
    if (isLoading) return <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>;
    if (!cats.length) return (
      <div className="flex flex-col items-center py-10 text-center">
        <Tag className="mb-2 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">কোনো ক্যাটাগরি নেই</p>
      </div>
    );

    return (
      <div className="space-y-2">
        {cats.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className={`h-2.5 w-2.5 rounded-full ${type === 'income' ? 'bg-success' : 'bg-destructive'}`} />
              <span className="text-sm font-medium">{cat.name}</span>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit({ id: cat.id, name: cat.name, type: cat.type as 'income' | 'expense' })}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(cat.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">ক্যাটাগরি</h1>
          <p className="text-muted-foreground">আপনার আয় ও ব্যয়ের ক্যাটাগরি পরিচালনা করুন।</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-1 h-4 w-4" /> নতুন ক্যাটাগরি
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <Tabs defaultValue="expense">
            <TabsList className="mb-4 w-full sm:w-auto">
              <TabsTrigger value="expense" className="flex-1 sm:flex-initial">ব্যয় ({expenseCategories.length})</TabsTrigger>
              <TabsTrigger value="income" className="flex-1 sm:flex-initial">আয় ({incomeCategories.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="expense">{renderList(expenseCategories, 'expense')}</TabsContent>
            <TabsContent value="income">{renderList(incomeCategories, 'income')}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} editCategory={editCat} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ক্যাটাগরি মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>এই ক্যাটাগরির অধীনে থাকা লেনদেনগুলো "Uncategorized" হয়ে যাবে।</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => { if (deleteId) deleteMutation.mutate(deleteId); setDeleteId(null); }}
            >
              মুছে ফেলুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
