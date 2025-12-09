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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTableData, deleteRecord, updateRecord, insertRecord } from '@/lib/database';
import type { Database } from '@/lib/supabase';
import { Eye, Trash2, Edit, Image, ExternalLink, Download } from 'lucide-react';

type PostImage = Database['public']['Tables']['post_images']['Row'];

export default function PostImagesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<PostImage | null>(null);
  const [viewingImage, setViewingImage] = useState<any>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
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
      console.log('Fetching post images...');
      const { data, error } = await supabaseAdmin
        .from('post_images')
        .select(`
          *,
          posts!post_images_post_id_fkey (title, slug, excerpt)
        `)
        .order('created_at', { ascending: false });
      
      console.log('Post images query result:', { data, error });
      
      if (error) {
        console.error('Post images query error:', error);
        throw error;
      }
      return data || [];
    },
  });

  // Fetch posts for dropdown
  const { data: posts = [] } = useQuery({
    queryKey: ['posts'],
    queryFn: () => fetchTableData('posts', 'id, title'),
  });

  // Bulk delete images mutation
  const bulkDeleteImagesMutation = useMutation({
    mutationFn: async (imageIds: string[]) => {
      const { data, error } = await (supabaseAdmin
        .from('post_images') as any)
        .delete()
        .in('id', imageIds)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['post-images'] });
      toast.success(`Deleted ${data?.length || 0} image(s)`);
      setSelectedImages([]);
    },
    onError: (error) => {
      toast.error(`Error deleting images: ${error.message}`);
    },
  });

  // Bulk update order mutation
  const bulkUpdateOrderMutation = useMutation({
    mutationFn: async (updates: { id: string; order_index: number }[]) => {
      const promises = updates.map(update => 
        (supabaseAdmin
          .from('post_images') as any)
          .update({ order_index: update.order_index })
          .eq('id', update.id)
      );
      
      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);
      
      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} images`);
      }
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-images'] });
      toast.success('Image order updated successfully');
      setSelectedImages([]);
    },
    onError: (error) => {
      toast.error(`Error updating order: ${error.message}`);
    },
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
  const handleBulkDelete = () => {
    if (selectedImages.length === 0) {
      toast.error('Please select images to delete');
      return;
    }
    
    if (confirm(`Are you sure you want to delete ${selectedImages.length} image(s)?`)) {
      bulkDeleteImagesMutation.mutate(selectedImages);
    }
  };

  const handleBulkReorder = (direction: 'up' | 'down') => {
    if (selectedImages.length === 0) {
      toast.error('Please select images to reorder');
      return;
    }
    
    const selectedImageData = (images as any).filter((img: any) => selectedImages.includes(img.id));
    const updates = selectedImageData.map((img: any) => ({
      id: img.id,
      order_index: direction === 'up' ? Math.max(0, img.order_index - 1) : img.order_index + 1
    }));
    
    bulkUpdateOrderMutation.mutate(updates);
  };

  const handleViewDetails = (image: any) => {
    setViewingImage(image);
  };

  const handleDownloadImage = (image: any) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.alt_text || 'image';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPostTitle = (img: any) => (img as any).posts?.title || 'Unknown';

  const columns: Column<PostImage>[] = [
    {
      key: 'select',
      header: 'Select',
      render: (img) => (
        <Checkbox
          checked={selectedImages.includes(img.id)}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedImages([...selectedImages, img.id]);
            } else {
              setSelectedImages(selectedImages.filter(id => id !== img.id));
            }
          }}
        />
      ),
    },
    {
      key: 'url',
      header: 'Image',
      render: (img) => (
        <div className="flex items-center gap-2">
          <img
            src={img.url}
            alt={img.alt_text || 'Post image'}
            className="w-12 h-8 object-cover rounded cursor-pointer"
            onClick={() => handleViewDetails(img)}
          />
          <div className="text-xs">
            <Badge variant="secondary" className="text-xs px-1 py-0">Order {img.order_index}</Badge>
          </div>
        </div>
      ),
    },
    {
      key: 'post_id',
      header: 'Post',
      render: (img) => {
        const post = (img as any).posts;
        return (
          <div className="max-w-xs">
            <div className="text-xs font-medium truncate">{post?.title || 'Unknown Post'}</div>
            {post?.slug && (
              <div className="text-xs text-muted-foreground truncate">/{post.slug}</div>
            )}
            <div className="text-xs text-muted-foreground">ID: {img.post_id?.slice(0, 6)}...</div>
          </div>
        );
      },
    },
    {
      key: 'alt_text',
      header: 'Alt Text',
      render: (img) => (
        <div className="max-w-[120px]">
          <div className="text-xs truncate">{img.alt_text || 'No alt text'}</div>
          {img.alt_text && img.alt_text.length > 20 && (
            <div className="text-xs text-muted-foreground">
              {img.alt_text.length} chars
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'order_index',
      header: 'Order',
      render: (img) => (
        <Badge variant={img.order_index === 0 ? 'default' : 'secondary'} className="text-xs">
          {img.order_index}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (img) => (
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(img)}
            className="h-6 w-6 p-0"
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadImage(img)}
            className="h-6 w-6 p-0"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
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
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Post Images</h2>
        <p className="text-sm text-muted-foreground">Manage images attached to posts.</p>
      </div>

      {/* Bulk Action Bar */}
      {selectedImages.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <span className="text-xs font-medium">
            {selectedImages.length} image{selectedImages.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-1 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkReorder('up')}
              disabled={bulkUpdateOrderMutation.isPending}
              className="h-7 px-2 text-xs"
            >
              Order Up
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkReorder('down')}
              disabled={bulkUpdateOrderMutation.isPending}
              className="h-7 px-2 text-xs"
            >
              Order Down
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleteImagesMutation.isPending}
              className="h-7 px-2 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-4">Loading images...</div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">Error loading images: {error.message}</div>
      ) : (
        <DataTable
          data={images}
          columns={columns}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          addLabel="Add Image"
          onBulkDelete={(items: any[]) => {
            const ids = items.map(item => item.id);
            setSelectedImages(ids);
            handleBulkDelete();
          }}
        />
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingImage ? 'Edit Image' : 'Add Image'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <div className="space-y-1">
              <Label className="text-sm">Post</Label>
              <Select
                value={formData.post_id}
                onValueChange={(value) => setFormData({ ...formData, post_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select post" />
                </SelectTrigger>
                <SelectContent>
                  {(posts as any).map((post: any) => (
                    <SelectItem key={post.id} value={post.id}>
                      {post.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Image URL</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Alt Text</Label>
              <Input
                value={formData.alt_text}
                onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                placeholder="Image description"
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Order Index</Label>
              <Input
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: Number(e.target.value) })}
                className="h-8"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-7 text-xs">Cancel</Button>
            <Button onClick={handleSubmit} className="h-7 text-xs">{editingImage ? 'Update' : 'Add'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      {viewingImage && (
        <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Image Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Image Preview */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Image Preview</h4>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <img
                    src={viewingImage.url}
                    alt={viewingImage.alt_text || 'Post image'}
                    className="max-w-full h-auto max-h-64 rounded-lg"
                  />
                </div>
              </div>

              {/* Post Information */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Post Information
                </h4>
                <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm font-medium">Title:</span>
                    <p className="text-sm">{viewingImage.posts?.title || 'Unknown Post'}</p>
                  </div>
                  {viewingImage.posts?.excerpt && (
                    <div>
                      <span className="text-sm font-medium">Excerpt:</span>
                      <p className="text-sm text-muted-foreground">{viewingImage.posts.excerpt}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium">Post ID:</span>
                    <p className="text-sm font-mono">{viewingImage.post_id}</p>
                  </div>
                  {viewingImage.posts?.slug && (
                    <div>
                      <span className="text-sm font-medium">Slug:</span>
                      <p className="text-sm font-mono">{viewingImage.posts.slug}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Information */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Image Information</h4>
                <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm font-medium">Image ID:</span>
                    <p className="text-sm font-mono">{viewingImage.id}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">URL:</span>
                    <p className="text-sm font-mono break-all">{viewingImage.url}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Alt Text:</span>
                    <p className="text-sm">{viewingImage.alt_text || 'No alt text provided'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Order Index:</span>
                    <Badge variant={viewingImage.order_index === 0 ? 'default' : 'secondary'} className="text-xs">
                      {viewingImage.order_index}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Created:</span>
                    <p className="text-sm">
                      {new Date(viewingImage.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    const postUrl = `https://dev-write.netlify.app/post/${viewingImage.posts?.slug}`;
                    window.open(postUrl, '_blank');
                  }}
                  disabled={!viewingImage.posts?.slug}
                  className="h-7 text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  View Post
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownloadImage(viewingImage)}
                  className="h-7 text-xs"
                >
                  <Download className="h-3 w-3 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewingImage(null);
                    handleEdit(viewingImage);
                  }}
                  className="h-7 text-xs"
                >
                  <Edit className="h-3 w-3 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteImageMutation.mutate(viewingImage.id);
                    setViewingImage(null);
                  }}
                  disabled={deleteImageMutation.isPending}
                  className="h-7 text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
