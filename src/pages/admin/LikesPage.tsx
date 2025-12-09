import { useState } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteRecord } from '@/lib/database';
import type { Database } from '@/lib/supabase';

type Like = Database['public']['Tables']['likes']['Row'];

export default function LikesPage() {
  const queryClient = useQueryClient();

  // Fetch likes with user and post data
  const { data: likes = [], isLoading, error } = useQuery({
    queryKey: ['likes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          *,
          profiles!likes_user_id_fkey (full_name),
          posts!likes_post_id_fkey (title)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Delete like mutation
  const deleteLikeMutation = useMutation({
    mutationFn: (likeId: string) => deleteRecord('likes', likeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['likes'] });
      toast.success('Like removed successfully');
    },
    onError: (error) => {
      toast.error(`Error removing like: ${error.message}`);
    },
  });

  const getUserName = (like: any) => (like as any).profiles?.full_name || 'Unknown';
  const getPostTitle = (like: any) => (like as any).posts?.title || 'Unknown Post';

  const columns: Column<Like>[] = [
    {
      key: 'user_id',
      header: 'User',
      render: (like) => getUserName(like),
    },
    {
      key: 'post_id',
      header: 'Post',
      render: (like) => (
        <p className="max-w-xs truncate">{getPostTitle(like)}</p>
      ),
    },
    { key: 'created_at', header: 'Date' },
  ];

  const handleDelete = (like: Like) => {
    deleteLikeMutation.mutate(like.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Likes</h2>
        <p className="text-muted-foreground">View and manage post likes.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading likes...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error loading likes: {error.message}</div>
      ) : (
        <DataTable data={likes} columns={columns} onDelete={handleDelete} />
      )}
    </div>
  );
}
