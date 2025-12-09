import { useState } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTableData, deleteRecord } from '@/lib/database';
import type { Database } from '@/lib/supabase';

type CommentLike = Database['public']['Tables']['comment_likes']['Row'];

export default function CommentLikesPage() {
  const queryClient = useQueryClient();

  // Fetch comment likes with user and comment data
  const { data: commentLikes = [], isLoading, error } = useQuery({
    queryKey: ['comment-likes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comment_likes')
        .select(`
          *,
          profiles!comment_likes_user_id_fkey (full_name),
          comments!comment_likes_comment_id_fkey (content_markdown)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Delete comment like mutation
  const deleteCommentLikeMutation = useMutation({
    mutationFn: (commentLikeId: string) => deleteRecord('comment_likes', commentLikeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comment-likes'] });
      toast.success('Comment like removed successfully');
    },
    onError: (error) => {
      toast.error(`Error removing comment like: ${error.message}`);
    },
  });

  const getUserName = (cl: any) => (cl as any).profiles?.full_name || 'Unknown';
  const getCommentPreview = (cl: any) => {
    const content = (cl as any).comments?.content_markdown;
    return content?.slice(0, 50) + '...' || 'Unknown';
  };

  const columns: Column<CommentLike>[] = [
    {
      key: 'user_id',
      header: 'User',
      render: (cl) => getUserName(cl),
    },
    {
      key: 'comment_id',
      header: 'Comment',
      render: (cl) => <span className="text-sm truncate max-w-[200px] block">{getCommentPreview(cl)}</span>,
    },
    { key: 'created_at', header: 'Date' },
  ];

  const handleDelete = (commentLike: CommentLike) => {
    deleteCommentLikeMutation.mutate(commentLike.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Comment Likes</h2>
        <p className="text-muted-foreground">View and manage comment likes.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading comment likes...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error loading comment likes: {error.message}</div>
      ) : (
        <DataTable
          data={commentLikes}
          columns={columns}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
