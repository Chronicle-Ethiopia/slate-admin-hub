import { useState } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Eye, ExternalLink, Image } from 'lucide-react';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTableData, deleteRecord, updateRecord } from '@/lib/database';
import type { Database } from '@/lib/supabase';

type Post = Database['public']['Tables']['posts']['Row'];
type PostImage = Database['public']['Tables']['post_images']['Row'];

type PostWithDetails = Post & {
  authorName: string;
  categoryName: string;
  images: PostImage[];
  postUrl: string;
};

export default function PostsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content_markdown: '',
    excerpt: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
    category_id: '',
    allow_comments: true,
    comments_enabled: true,
    is_published: false,
    read_time: 5,
    featured_image: '',
    views: 0,
  });

  // Fetch posts with complete data
  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      console.log('Fetching posts with admin client...');
      const { data, error } = await supabaseAdmin
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch users for author mapping
  const { data: users = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => fetchTableData('profiles', 'id, full_name'),
  });

  // Fetch categories for mapping
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchTableData('categories', 'id, name'),
  });

  // Fetch post images
  const { data: postImages = [] } = useQuery({
    queryKey: ['post-images'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from('post_images')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Create lookup maps
  const userMap = users.reduce((acc: Record<string, string>, user: any) => {
    acc[user.id] = user.full_name;
    return acc;
  }, {});

  const categoryMap = categories.reduce((acc: Record<string, string>, category: any) => {
    acc[category.id] = category.name;
    return acc;
  }, {});

  // Group images by post
  const imagesByPost = postImages.reduce((acc: Record<string, PostImage[]>, image: PostImage) => {
    if (!acc[image.post_id]) acc[image.post_id] = [];
    acc[image.post_id].push(image);
    return acc;
  }, {});

  // Combine posts with details
  const postsWithDetails: PostWithDetails[] = posts.map(post => ({
    ...post,
    authorName: userMap[post.author_id] || 'Unknown',
    categoryName: categoryMap[post.category_id] || 'Uncategorized',
    images: imagesByPost[post.id] || [],
    postUrl: `https://dev-write.netlify.app/post/${post.slug}`,
  }));

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabaseAdmin
        .from('posts')
        .delete()
        .eq('id', postId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post deleted successfully');
    },
    onError: (error) => {
      toast.error(`Error deleting post: ${error.message}`);
    },
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: async (postData: { id: string; data: Partial<Post> }) => {
      const { error } = await supabaseAdmin
        .from('posts')
        .update(postData.data)
        .eq('id', postData.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post updated successfully');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Error updating post: ${error.message}`);
    },
  });
  const columns: Column<PostWithDetails>[] = [
    {
      key: 'title',
      header: 'Post',
      render: (post) => (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">{post.title}</p>
            <a
              href={post.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground">/{post.slug}</p>
          {post.images.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Image className="w-3 h-3" />
              {post.images.length} image{post.images.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'author_id',
      header: 'Author',
      render: (post) => (
        <div className="space-y-1">
          <div className="text-sm">{post.authorName}</div>
          <div className="text-xs text-muted-foreground">ID: {post.author_id}</div>
        </div>
      ),
    },
    {
      key: 'category_id',
      header: 'Category',
      render: (post) => (
        <div className="space-y-1">
          <div className="text-sm">{post.categoryName}</div>
          {post.category_id && (
            <div className="text-xs text-muted-foreground">ID: {post.category_id}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (post) => (
        <div className="space-y-1">
          <Badge
            variant={
              post.status === 'published'
                ? 'default'
                : post.status === 'draft'
                ? 'secondary'
                : 'outline'
            }
          >
            {post.status}
          </Badge>
          <div className="text-xs text-muted-foreground">
            Published: {post.is_published ? 'Yes' : 'No'}
          </div>
        </div>
      ),
    },
    {
      key: 'views',
      header: 'Engagement',
      render: (post) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4 text-muted-foreground" />
            {post.views.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">
            Read time: {post.read_time} min
          </div>
        </div>
      ),
    },
    {
      key: 'comments_enabled',
      header: 'Interaction',
      render: (post) => (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">
            Comments: {post.comments_enabled ? 'Enabled' : 'Disabled'}
          </div>
          <div className="text-xs text-muted-foreground">
            Allow: {post.allow_comments ? 'Yes' : 'No'}
          </div>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Dates',
      render: (post) => (
        <div className="space-y-1">
          <div className="text-sm">
            {new Date(post.created_at).toLocaleDateString()}
          </div>
          <div className="text-xs text-muted-foreground">
            Updated: {new Date(post.updated_at).toLocaleDateString()}
          </div>
        </div>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      slug: '',
      content_markdown: '',
      excerpt: '',
      status: 'draft',
      category_id: 'none',
      allow_comments: true,
      comments_enabled: true,
      is_published: false,
      read_time: 5,
      featured_image: '',
      views: 0,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (post: PostWithDetails) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      content_markdown: post.content_markdown || '',
      excerpt: post.excerpt || '',
      status: post.status as 'draft' | 'published' | 'archived',
      category_id: post.category_id || 'none',
      allow_comments: post.allow_comments ?? true,
      comments_enabled: post.comments_enabled,
      is_published: post.is_published ?? false,
      read_time: post.read_time || 5,
      featured_image: post.featured_image || '',
      views: post.views || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (post: Post) => {
    deletePostMutation.mutate(post.id);
  };

  const handleSubmit = () => {
    if (editingPost) {
      // Prepare data for update - only include fields that exist in database
      const updateData = {
        title: formData.title,
        slug: formData.slug,
        content_markdown: formData.content_markdown,
        excerpt: formData.excerpt || null,
        status: formData.status,
        category_id: formData.category_id === 'none' ? null : formData.category_id || null,
        allow_comments: formData.allow_comments,
        comments_enabled: formData.comments_enabled,
        is_published: formData.is_published,
        read_time: formData.read_time,
        featured_image: formData.featured_image || null,
        views: formData.views,
        updated_at: new Date().toISOString(),
      };

      updatePostMutation.mutate({
        id: editingPost.id,
        data: updateData,
      });
    } else {
      // Note: Creating posts requires author authentication
      toast.error('Post creation requires authentication');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Posts Management</h2>
        <p className="text-muted-foreground">Manage all blog posts and articles.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading posts...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error loading posts: {error.message}</div>
      ) : (
        <DataTable
          data={postsWithDetails}
          columns={columns}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          addLabel="Add Post"
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Edit Post' : 'Add New Post'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Post title"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="post-slug"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Featured Image URL</Label>
              <Input
                value={formData.featured_image}
                onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Read Time (min)</Label>
                <Input
                  type="number"
                  value={formData.read_time}
                  onChange={(e) => setFormData({ ...formData, read_time: parseInt(e.target.value) || 5 })}
                  min="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Brief description of the post..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={formData.content_markdown}
                onChange={(e) => setFormData({ ...formData, content_markdown: e.target.value })}
                placeholder="Write your post content in markdown..."
                rows={8}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Views</Label>
                <Input
                  type="number"
                  value={formData.views}
                  onChange={(e) => setFormData({ ...formData, views: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Publication</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Published</Label>
                    <Switch
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Comments Enabled</Label>
                    <Switch
                      checked={formData.comments_enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, comments_enabled: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Allow Comments</Label>
                    <Switch
                      checked={formData.allow_comments}
                      onCheckedChange={(checked) => setFormData({ ...formData, allow_comments: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingPost ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
