import { useState } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteRecord } from '@/lib/database';
import type { Database } from '@/lib/supabase';

type Bookmark = Database['public']['Tables']['bookmarks']['Row'];

export default function BookmarksPage() {
  const queryClient = useQueryClient();

  // Fetch bookmarks with user and post data
  const { data: bookmarks = [], isLoading, error } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          *,
          profiles!bookmarks_user_id_fkey (full_name),
          posts!bookmarks_post_id_fkey (title)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Delete bookmark mutation
  const deleteBookmarkMutation = useMutation({
    mutationFn: (bookmarkId: string) => deleteRecord('bookmarks', bookmarkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success('Bookmark removed successfully');
    },
    onError: (error) => {
      toast.error(`Error removing bookmark: ${error.message}`);
    },
  });

  const getUserName = (bookmark: any) => (bookmark as any).profiles?.full_name || 'Unknown';
  const getPostTitle = (bookmark: any) => (bookmark as any).posts?.title || 'Unknown Post';

  const columns: Column<Bookmark>[] = [
    {
      key: 'user_id',
      header: 'User',
      render: (bookmark) => getUserName(bookmark),
    },
    {
      key: 'post_id',
      header: 'Post',
      render: (bookmark) => (
        <p className="max-w-xs truncate">{getPostTitle(bookmark)}</p>
      ),
    },
    { key: 'created_at', header: 'Date' },
  ];

  const handleDelete = (bookmark: Bookmark) => {
    deleteBookmarkMutation.mutate(bookmark.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Bookmarks</h2>
        <p className="text-muted-foreground">View and manage post bookmarks.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading bookmarks...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error loading bookmarks: {error.message}</div>
      ) : (
        <DataTable data={bookmarks} columns={columns} onDelete={handleDelete} />
      )}
    </div>
  );
}
