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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTableData, deleteRecord, updateRecord, insertRecord } from '@/lib/database';
import type { Database } from '@/lib/supabase';
import { Trash2, Tag as TagIcon } from 'lucide-react';

type Tag = Database['public']['Tables']['tags']['Row'];

export default function TagsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    color: '#000000',
  });

  // Fetch tags with usage counts
  const { data: tags = [], isLoading, error } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      console.log('Fetching tags with usage counts...');
      
      // First fetch all tags
      const { data: tagsData, error: tagsError } = await supabaseAdmin
        .from('tags')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (tagsError) {
        console.error('Tags query error:', tagsError);
        throw tagsError;
      }
      
      // Then fetch all post_tags relationships
      const { data: postTags, error: usageError } = await supabaseAdmin
        .from('post_tags')
        .select('tag_id');
      
      if (usageError) {
        console.error('Tag usage query error:', usageError);
        throw usageError;
      }
      
      // Count usage for each tag
      const usageMap: { [key: string]: number } = {};
      (postTags || []).forEach((item: any) => {
        usageMap[item.tag_id] = (usageMap[item.tag_id] || 0) + 1;
      });
      
      // Combine tags with their usage counts
      const tagsWithUsage = (tagsData || []).map((tag: any) => ({
        ...tag,
        usage_count: usageMap[tag.id] || 0,
      }));
      
      console.log('Tags with usage:', tagsWithUsage);
      return tagsWithUsage;
    },
  });

  // Bulk delete tags mutation
  const bulkDeleteTagsMutation = useMutation({
    mutationFn: async (tagIds: string[]) => {
      // First delete from post_tags junction table
      await (supabaseAdmin
        .from('post_tags') as any)
        .delete()
        .in('tag_id', tagIds);
      
      // Then delete from tags table
      const { data, error } = await (supabaseAdmin
        .from('tags') as any)
        .delete()
        .in('id', tagIds)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success(`Deleted ${data?.length || 0} tag(s)`);
      setSelectedTags([]);
    },
    onError: (error) => {
      toast.error(`Error deleting tags: ${error.message}`);
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

  const handleBulkDelete = () => {
    if (selectedTags.length === 0) {
      toast.error('Please select tags to delete');
      return;
    }
    
    if (confirm(`Are you sure you want to delete ${selectedTags.length} tag(s)? This will also remove them from all posts.`)) {
      bulkDeleteTagsMutation.mutate(selectedTags);
    }
  };

  const columns: Column<Tag>[] = [
    {
      key: 'select',
      header: 'Select',
      render: (tag) => (
        <Checkbox
          checked={selectedTags.includes(tag.id)}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedTags([...selectedTags, tag.id]);
            } else {
              setSelectedTags(selectedTags.filter(id => id !== tag.id));
            }
          }}
        />
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (tag) => (
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: tag.color }}
          />
          <span className="font-medium">{tag.name}</span>
        </div>
      ),
    },
    { key: 'slug', header: 'Slug' },
    {
      key: 'color',
      header: 'Color',
      render: (tag) => (
        <div className="flex items-center gap-2">
          <span
            className="w-4 h-4 rounded border"
            style={{ backgroundColor: tag.color }}
          />
          <code className="text-xs bg-muted px-2 py-1 rounded">{tag.color}</code>
        </div>
      ),
    },
    {
      key: 'usage_count',
      header: 'Usage',
      render: (tag) => {
        const count = (tag as any).usage_count || 0;
        return (
          <Badge variant={count === 0 ? 'secondary' : 'default'} className="text-xs">
            {count} post{count !== 1 ? 's' : ''}
          </Badge>
        );
      },
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (tag) => (
        <div className="text-xs">
          <div>{new Date(tag.created_at).toLocaleDateString()}</div>
          <div className="text-muted-foreground">
            {new Date(tag.created_at).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
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
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Tags</h2>
        <p className="text-sm text-muted-foreground">Manage post tags.</p>
      </div>

      {/* Bulk Action Bar */}
      {selectedTags.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <span className="text-xs font-medium">
            {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-1 ml-auto">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleteTagsMutation.isPending}
              className="h-7 px-2 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-4">Loading tags...</div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">Error loading tags: {error.message}</div>
      ) : (
        <DataTable
          data={tags}
          columns={columns}
          searchKey="name"
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          addLabel="Add Tag"
          onBulkDelete={(items: any[]) => {
            const ids = items.map(item => item.id);
            setSelectedTags(ids);
            handleBulkDelete();
          }}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TagIcon className="h-5 w-5" />
              {editingTag ? 'Edit Tag' : 'Add Tag'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div className="space-y-1">
              <Label className="text-sm">Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({
                  ...formData,
                  name: e.target.value,
                  slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                })}
                placeholder="Tag name"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-8 h-8 p-1"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1 h-8"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-7 text-xs">Cancel</Button>
            <Button onClick={handleSubmit} className="h-7 text-xs">{editingTag ? 'Update' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
