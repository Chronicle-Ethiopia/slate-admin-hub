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

type Tag = Database['public']['Tables']['tags']['Row'];

export default function TagsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    color: '#000000',
  });

  // Fetch tags
  const { data: tags = [], isLoading, error } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: (tagId: string) => deleteRecord('tags', tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag deleted successfully');
    },
    onError: (error) => {
      toast.error(`Error deleting tag: ${error.message}`);
    },
  });

  // Update tag mutation
  const updateTagMutation = useMutation({
    mutationFn: (tagData: { id: string; data: Partial<Tag> }) => 
      updateRecord('tags', tagData.id, tagData.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag updated successfully');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Error updating tag: ${error.message}`);
    },
  });

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: (tagData: Omit<Tag, 'id' | 'created_at'>) => 
      insertRecord('tags', tagData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag created successfully');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Error creating tag: ${error.message}`);
    },
  });

  const columns: Column<Tag>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (tag) => (
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: tag.color }}
          />
          {tag.name}
        </div>
      ),
    },
    { key: 'slug', header: 'Slug' },
    {
      key: 'color',
      header: 'Color',
      render: (tag) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">{tag.color}</code>
      ),
    },
    { key: 'created_at', header: 'Created At' },
  ];

  const handleAdd = () => {
    setEditingTag(null);
    setFormData({ name: '', slug: '', color: '#3B82F6' });
    setIsDialogOpen(true);
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name, slug: tag.slug, color: tag.color });
    setIsDialogOpen(true);
  };

  const handleDelete = (tag: Tag) => {
    deleteTagMutation.mutate(tag.id);
  };

  const handleSubmit = () => {
    if (editingTag) {
      updateTagMutation.mutate({
        id: editingTag.id,
        data: formData,
      });
    } else {
      createTagMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Tags</h2>
        <p className="text-muted-foreground">Manage post tags.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading tags...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error loading tags: {error.message}</div>
      ) : (
        <DataTable
          data={tags}
          columns={columns}
          searchKey="name"
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          addLabel="Add Tag"
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Edit Tag' : 'Add Tag'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({
                  ...formData,
                  name: e.target.value,
                  slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                })}
                placeholder="Tag name"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingTag ? 'Update' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
