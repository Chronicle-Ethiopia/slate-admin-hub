import { useState } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTableData, deleteRecord, updateRecord, insertRecord } from '@/lib/database';
import type { Database } from '@/lib/supabase';

type Category = Database['public']['Tables']['categories']['Row'];

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });

  // Fetch categories
  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchTableData('categories', '*', { column: 'created_at', ascending: false }),
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: string) => deleteRecord('categories', categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      toast.error(`Error deleting category: ${error.message}`);
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: (categoryData: { id: string; data: Partial<Category> }) => 
      updateRecord('categories', categoryData.id, categoryData.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated successfully');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Error updating category: ${error.message}`);
    },
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (categoryData: Omit<Category, 'id' | 'created_at'>) => 
      insertRecord('categories', categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created successfully');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Error creating category: ${error.message}`);
    },
  });

  const columns: Column<Category>[] = [
    { key: 'name', header: 'Name' },
    { key: 'slug', header: 'Slug' },
    { key: 'created_at', header: 'Created At' },
  ];

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '' });
    setIsDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, slug: category.slug });
    setIsDialogOpen(true);
  };

  const handleDelete = (category: Category) => {
    deleteCategoryMutation.mutate(category.id);
  };

  const handleSubmit = () => {
    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        data: formData,
      });
    } else {
      createCategoryMutation.mutate({
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
      });
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Categories</h2>
        <p className="text-muted-foreground">Manage post categories.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading categories...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error loading categories: {error.message}</div>
      ) : (
        <DataTable
          data={categories}
          columns={columns}
          searchKey="name"
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          addLabel="Add Category"
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ 
                  name: e.target.value, 
                  slug: generateSlug(e.target.value) 
                })}
                placeholder="Category name"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="category-slug"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingCategory ? 'Update' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
