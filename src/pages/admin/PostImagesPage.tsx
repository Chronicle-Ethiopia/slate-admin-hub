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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTableData, deleteRecord, updateRecord, insertRecord } from '@/lib/database';
import type { Database } from '@/lib/supabase';

type PostImage = Database['public']['Tables']['post_images']['Row'];

export default function PostImagesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<PostImage | null>(null);
  const [formData, setFormData] = useState({
    post_id: '',
    url: '',
    alt_text: '',
    order_index: 0,
  });

  // Fetch post images with post data
  const { data: images = [], isLoading, error } = useQuery({
    queryKey: ['post-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_images')
        .select(`
          *,
          posts!post_images_post_id_fkey (title)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch posts for dropdown
  const { data: posts = [] } = useQuery({
    queryKey: ['posts'],
    queryFn: () => fetchTableData('posts', 'id, title'),
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => deleteRecord('post_images', imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-images'] });
      toast.success('Image deleted successfully');
    },
    onError: (error) => {
      toast.error(`Error deleting image: ${error.message}`);
    },
  });

  // Update image mutation
  const updateImageMutation = useMutation({
    mutationFn: (imageData: { id: string; data: Partial<PostImage> }) => 
      updateRecord('post_images', imageData.id, imageData.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-images'] });
      toast.success('Image updated successfully');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Error updating image: ${error.message}`);
    },
  });

  // Create image mutation
  const createImageMutation = useMutation({
    mutationFn: (imageData: Omit<PostImage, 'id' | 'created_at'>) => 
      insertRecord('post_images', imageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-images'] });
      toast.success('Image created successfully');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Error creating image: ${error.message}`);
    },
  });
  const getPostTitle = (img: any) => (img as any).posts?.title || 'Unknown';

  const columns: Column<PostImage>[] = [
    {
      key: 'url',
      header: 'Image',
      render: (img) => (
        <img
          src={img.url}
          alt={img.alt_text || 'Post image'}
          className="w-16 h-12 object-cover rounded"
        />
      ),
    },
    {
      key: 'post_id',
      header: 'Post',
      render: (img) => <span className="truncate max-w-[200px] block">{getPostTitle(img)}</span>,
    },
    { key: 'alt_text', header: 'Alt Text' },
    { key: 'order_index', header: 'Order' },
  ];

  const handleAdd = () => {
    setEditingImage(null);
    setFormData({ post_id: '', url: '', alt_text: '', order_index: 0 });
    setIsDialogOpen(true);
  };

  const handleEdit = (image: PostImage) => {
    setEditingImage(image);
    setFormData({
      post_id: image.post_id,
      url: image.url,
      alt_text: image.alt_text || '',
      order_index: image.order_index,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (image: PostImage) => {
    deleteImageMutation.mutate(image.id);
  };

  const handleSubmit = () => {
    if (editingImage) {
      updateImageMutation.mutate({
        id: editingImage.id,
        data: formData,
      });
    } else {
      createImageMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Post Images</h2>
        <p className="text-muted-foreground">Manage images attached to posts.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading images...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error loading images: {error.message}</div>
      ) : (
        <DataTable
          data={images}
          columns={columns}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          addLabel="Add Image"
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingImage ? 'Edit Image' : 'Add Image'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Post</Label>
              <Select
                value={formData.post_id}
                onValueChange={(value) => setFormData({ ...formData, post_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select post" />
                </SelectTrigger>
                <SelectContent>
                  {posts.map((post: any) => (
                    <SelectItem key={post.id} value={post.id}>
                      {post.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Alt Text</Label>
              <Input
                value={formData.alt_text}
                onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                placeholder="Image description"
              />
            </div>
            <div className="space-y-2">
              <Label>Order Index</Label>
              <Input
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingImage ? 'Update' : 'Add'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
