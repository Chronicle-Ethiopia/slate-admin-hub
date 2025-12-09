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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, ExternalLink, Calendar, User, FileText, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteRecord, updateRecord } from '@/lib/database';
import type { Database } from '@/lib/supabase';

type Comment = Database['public']['Tables']['comments']['Row'];
type CommentWithDetails = Comment & {
  profiles?: { full_name: string };
  posts?: { title: string; slug: string };
};

export default function CommentsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<CommentWithDetails | null>(null);
  const [viewingComment, setViewingComment] = useState<CommentWithDetails | null>(null);
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    content_markdown: '',
    approved: false,
  });

  // Fetch comments with user and post data using separate queries
  const { data: comments = [], isLoading, error } = useQuery({
    queryKey: ['comments'],
    queryFn: async () => {
      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabaseAdmin
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (commentsError) throw commentsError;

      // Fetch profiles for authors
      const { data: profilesData, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name');
      
      if (profilesError) throw profilesError;

      // Fetch posts
      const { data: postsData, error: postsError } = await supabaseAdmin
        .from('posts')
        .select('id, title, slug');
      
      if (postsError) throw postsError;

      // Create lookup maps
      const profileMap = profilesData.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as Record<string, any>);

      const postMap = postsData.reduce((acc, post) => {
        acc[post.id] = post;
        return acc;
      }, {} as Record<string, any>);

      // Combine data
      const commentsWithDetails = commentsData.map(comment => ({
        ...comment,
        profiles: profileMap[comment.author_id],
        posts: postMap[comment.post_id]
      }));

      return commentsWithDetails || [];
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabaseAdmin
        .from('comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
      return commentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast.success('Comment deleted successfully');
    },
    onError: (error) => {
      toast.error(`Error deleting comment: ${error.message}`);
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async (commentData: { id: string; data: Partial<Comment> }) => {
      const { error } = await supabaseAdmin
        .from('comments')
        .update(commentData.data)
        .eq('id', commentData.id);
      
      if (error) throw error;
      return commentData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast.success('Comment updated successfully');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Error updating comment: ${error.message}`);
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (commentIds: string[]) => {
      const { error } = await supabaseAdmin
        .from('comments')
        .delete()
        .in('id', commentIds);
      
      if (error) throw error;
      return commentIds;
    },
    onSuccess: (deletedIds) => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      setSelectedComments([]);
      toast.success(`Deleted ${deletedIds.length} comments successfully`);
    },
    onError: (error) => {
      toast.error(`Error deleting comments: ${error.message}`);
    },
  });

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationFn: async (commentIds: string[]) => {
      const { error } = await supabaseAdmin
        .from('comments')
        .update({ approved: true })
        .in('id', commentIds);
      
      if (error) throw error;
      return commentIds;
    },
    onSuccess: (updatedIds) => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      setSelectedComments([]);
      toast.success(`Approved ${updatedIds.length} comments successfully`);
    },
    onError: (error) => {
      toast.error(`Error approving comments: ${error.message}`);
    },
  });

  // Bulk reject mutation
  const bulkRejectMutation = useMutation({
    mutationFn: async (commentIds: string[]) => {
      const { error } = await supabaseAdmin
        .from('comments')
        .update({ approved: false })
        .in('id', commentIds);
      
      if (error) throw error;
      return commentIds;
    },
    onSuccess: (updatedIds) => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      setSelectedComments([]);
      toast.success(`Rejected ${updatedIds.length} comments successfully`);
    },
    onError: (error) => {
      toast.error(`Error rejecting comments: ${error.message}`);
    },
  });

  const getUserName = (comment: CommentWithDetails) => comment.profiles?.full_name || 'Unknown';
  const getPostTitle = (comment: CommentWithDetails) => comment.posts?.title || 'Unknown Post';
  const getPostSlug = (comment: CommentWithDetails) => comment.posts?.slug || '';

  const columns: Column<CommentWithDetails>[] = [
    {
      key: 'select',
      header: 'Select',
      render: (comment) => (
        <Checkbox
          checked={selectedComments.includes(comment.id)}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedComments([...selectedComments, comment.id]);
            } else {
              setSelectedComments(selectedComments.filter(id => id !== comment.id));
            }
          }}
        />
      ),
    },
    {
      key: 'content_markdown',
      header: 'Content',
      render: (comment) => (
        <p className="max-w-xs truncate">{comment.content_markdown}</p>
      ),
    },
    {
      key: 'author_id',
      header: 'Author',
      render: (comment) => getUserName(comment),
    },
    {
      key: 'post_id',
      header: 'Post',
      render: (comment) => (
        <p className="max-w-[150px] truncate">{getPostTitle(comment)}</p>
      ),
    },
    {
      key: 'approved',
      header: 'Status',
      render: (comment) => (
        <Badge variant={comment.approved ? 'default' : 'secondary'}>
          {comment.approved ? 'Approved' : 'Pending'}
        </Badge>
      ),
    },
    { 
      key: 'created_at', 
      header: 'Date',
      render: (comment) => new Date(comment.created_at).toLocaleDateString()
    },
    {
      key: 'updated_at',
      header: 'Updated',
      render: (comment) => new Date(comment.updated_at).toLocaleDateString()
    },
  ];

  const handleEdit = (comment: CommentWithDetails) => {
    setEditingComment(comment);
    setFormData({
      content_markdown: comment.content_markdown,
      approved: comment.approved,
    });
    setIsDialogOpen(true);
  };

  const handleView = (comment: CommentWithDetails) => {
    setViewingComment(comment);
    setIsDetailsOpen(true);
  };

  const handleDelete = (comment: CommentWithDetails) => {
    deleteCommentMutation.mutate(comment.id);
  };

  const handleSubmit = () => {
    if (editingComment) {
      updateCommentMutation.mutate({
        id: editingComment.id,
        data: formData,
      });
    }
  };

  const handleViewPost = () => {
    if (viewingComment && getPostSlug(viewingComment)) {
      window.open(`https://dev-write.netlify.app/post/${getPostSlug(viewingComment)}`, '_blank');
    }
  };

  const handleBulkDelete = () => {
    if (selectedComments.length === 0) {
      toast.error('No comments selected');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedComments.length} comment(s)?`)) {
      bulkDeleteMutation.mutate(selectedComments);
    }
  };

  const handleBulkApprove = () => {
    if (selectedComments.length === 0) {
      toast.error('No comments selected');
      return;
    }
    bulkApproveMutation.mutate(selectedComments);
  };

  const handleBulkReject = () => {
    if (selectedComments.length === 0) {
      toast.error('No comments selected');
      return;
    }
    bulkRejectMutation.mutate(selectedComments);
  };

  const handleSelectAll = () => {
    const allCommentIds = comments.map(comment => comment.id);
    setSelectedComments(allCommentIds);
  };

  const handleDeselectAll = () => {
    setSelectedComments([]); 
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Comments</h2>
        <p className="text-muted-foreground">Moderate and manage comments.</p>
      </div>

      {/* Bulk Actions */}
    {/* Bulk Actions */}
{selectedComments.length > 0 && (
  <Card className="border-primary/20 bg-primary/5">
    <CardContent className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            {selectedComments.length} comment{selectedComments.length !== 1 ? 's' : ''} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            disabled={selectedComments.length === comments.length}
            className="h-8"
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeselectAll}
            className="h-8"
          >
            Deselect All
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkApprove}
            disabled={bulkApproveMutation.isPending}
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkReject}
            disabled={bulkRejectMutation.isPending}
            className="flex items-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Reject
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkDeleteMutation.isPending}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
)}

  {isLoading ? (
    <div className="text-center py-8">Loading comments...</div>
  ) : error ? (
    <div className="text-center py-8 text-red-500">Error loading comments: {error.message}</div>
  ) : (
    <DataTable
      data={comments}
      columns={columns}
      searchKey="content_markdown"
      onEdit={handleEdit}
      onDelete={handleDelete}
      onView={handleView}
    />
  )}

  {/* Edit Dialog */}
  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Comment</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Content</Label>
          <Textarea
            value={formData.content_markdown}
            onChange={(e) => setFormData({ ...formData, content_markdown: e.target.value })}
            rows={4}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Approved</Label>
          <Switch
            checked={formData.approved}
            onCheckedChange={(checked) => setFormData({ ...formData, approved: checked })}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
        <Button onClick={handleSubmit}>Update</Button>
      </div>
    </DialogContent>
  </Dialog>

  {/* View Details Dialog */}
  <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Comment Details
        </DialogTitle>
      </DialogHeader>
      {viewingComment && (
        <div className="space-y-6 py-4">
          {/* Comment Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comment Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{viewingComment.content_markdown}</p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant={viewingComment.approved ? 'default' : 'secondary'}>
                  {viewingComment.approved ? 'Approved' : 'Pending'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Author Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                Author Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Name</Label>
                  <p className="font-medium">{getUserName(viewingComment)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Author ID</Label>
                  <p className="font-mono text-sm">{viewingComment.author_id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Post Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5" />
                Post Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Post Title</Label>
                  <p className="font-medium">{getPostTitle(viewingComment)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Post ID</Label>
                  <p className="font.
                  font dist: 1.0, 2024
                  <潜移默化
                  font-mono text-sm">{viewingComment.post_id}</p>
                </div>
              </div>
              {getPostSlug(viewingComment) && (
                <div className="mt-4">
                  <Button onClick={handleViewPost} className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View Post
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamp Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5" />
                Timestamp Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Created At</Label>
                  <p className="font-medium">
                    {new Date(viewingComment.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Updated At</Label>
                  <p className="font-medium">
                    {new Date(viewingComment.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Label className="text-sm text-muted-foreground">Comment ID</Label>
                <p className="font-mono text-sm">{viewingComment.id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          {viewingComment.parent_comment_id && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reply Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label className="text-sm text-muted-foreground">Parent Comment ID</Label>
                  <p className="font-mono text-sm">{viewingComment.parent_comment_id}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
          Close
        </Button>
        <Button onClick={() => {
          setIsDetailsOpen(false);
          handleEdit(viewingComment!);
        }}>
          Edit Comment
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</div>
);
}
