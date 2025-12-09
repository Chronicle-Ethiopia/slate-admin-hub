import { useState } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteRecord } from '@/lib/database';
import type { Database } from '@/lib/supabase';

type Follower = Database['public']['Tables']['followers']['Row'];

export default function FollowersPage() {
  const queryClient = useQueryClient();

  // Fetch followers with user data
  const { data: followers = [], isLoading, error } = useQuery({
    queryKey: ['followers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('followers')
        .select(`
          *,
          profiles!followers_follower_id_fkey (full_name, avatar_url),
          following:profiles!followers_following_id_fkey (full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Delete follower mutation
  const deleteFollowerMutation = useMutation({
    mutationFn: (followerId: string) => deleteRecord('followers', followerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      toast.success('Follower removed successfully');
    },
    onError: (error) => {
      toast.error(`Error removing follower: ${error.message}`);
    },
  });

  const getUser = (follower: any, type: 'follower' | 'following') => {
    if (type === 'follower') {
      return (follower as any).profiles;
    } else {
      return (follower as any).following;
    }
  };

  const columns: Column<Follower>[] = [
    {
      key: 'follower_id',
      header: 'Follower',
      render: (f) => {
        const user = getUser(f, 'follower');
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback>{user?.full_name?.[0]}</AvatarFallback>
            </Avatar>
            <span>{user?.full_name || 'Unknown'}</span>
          </div>
        );
      },
    },
    {
      key: 'following_id',
      header: 'Following',
      render: (f) => {
        const user = getUser(f, 'following');
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback>{user?.full_name?.[0]}</AvatarFallback>
            </Avatar>
            <span>{user?.full_name || 'Unknown'}</span>
          </div>
        );
      },
    },
    { key: 'created_at', header: 'Since' },
  ];

  const handleDelete = (follower: Follower) => {
    deleteFollowerMutation.mutate(follower.id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Followers</h2>
        <p className="text-muted-foreground">View and manage follower relationships.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading followers...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error loading followers: {error.message}</div>
      ) : (
        <DataTable
          data={followers}
          columns={columns}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
