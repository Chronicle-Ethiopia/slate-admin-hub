import { useState } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { deleteRecord } from '@/lib/database';
import type { Database } from '@/lib/supabase';
import { UserPlus, UserMinus, Filter, Users, Search } from 'lucide-react';

type Follower = Database['public']['Tables']['followers']['Row'];

export default function FollowersPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFollowers, setSelectedFollowers] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'followers' | 'following'>('all');
  const [showFollowDialog, setShowFollowDialog] = useState(false);
  const [followTarget, setFollowTarget] = useState<{ id: string; name: string } | null>(null);

  // Helper function to get user data
  const getUser = (follower: any, type: 'follower' | 'following') => {
    if (type === 'follower') {
      return (follower as any).profiles;
    } else {
      return (follower as any).following;
    }
  };

  // Fetch users for follow functionality
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-follow'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, profile_image_url')
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch followers with user data
  const { data: followers = [], isLoading, error } = useQuery({
    queryKey: ['followers'],
    queryFn: async () => {
      console.log('Fetching followers...');
      const { data, error } = await supabaseAdmin
        .from('followers')
        .select(`
          *,
          profiles!followers_follower_id_fkey (full_name, profile_image_url),
          following:profiles!followers_following_id_fkey (full_name, profile_image_url)
        `)
        .order('created_at', { ascending: false });
      
      console.log('Followers query result:', { data, error });
      
      if (error) {
        console.error('Followers query error:', error);
        throw error;
      }
      return data || [];
    },
  });

  // Follow user mutation
  const followUserMutation = useMutation({
    mutationFn: async ({ followerId, followingId }: { followerId: string; followingId: string }) => {
      const { data, error } = await (supabaseAdmin
        .from('followers') as any)
        .insert({
          follower_id: followerId,
          following_id: followingId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      toast.success('User followed successfully');
      setShowFollowDialog(false);
      setFollowTarget(null);
    },
    onError: (error) => {
      toast.error(`Error following user: ${error.message}`);
    },
  });

  // Unfollow user mutation
  const unfollowUserMutation = useMutation({
    mutationFn: async ({ followerId, followingId }: { followerId: string; followingId: string }) => {
      const { data, error } = await (supabaseAdmin
        .from('followers') as any)
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      toast.success('User unfollowed successfully');
    },
    onError: (error) => {
      toast.error(`Error unfollowing user: ${error.message}`);
    },
  });

  // Bulk delete followers mutation
  const bulkDeleteFollowersMutation = useMutation({
    mutationFn: async (followerIds: string[]) => {
      const { data, error } = await (supabaseAdmin
        .from('followers') as any)
        .delete()
        .in('id', followerIds)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      toast.success(`Removed ${data?.length || 0} follower relationships`);
      setSelectedFollowers([]);
    },
    onError: (error) => {
      toast.error(`Error removing followers: ${error.message}`);
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

  // Filter and search logic
  const filteredFollowers = followers.filter((follower: any) => {
    const followerUser = getUser(follower, 'follower');
    const followingUser = getUser(follower, 'following');
    
    // Search filter - search in both follower and following names
    const matchesSearch = searchQuery === '' || 
      followerUser?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      followingUser?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Type filter - for demo purposes, let's filter based on user data availability
    let matchesType = true;
    if (filterType === 'followers') {
      // Show relationships where we have follower data
      matchesType = followerUser?.full_name && followerUser?.full_name !== 'Unknown';
    } else if (filterType === 'following') {
      // Show relationships where we have following data  
      matchesType = followingUser?.full_name && followingUser?.full_name !== 'Unknown';
    }
    // 'all' shows everything
    
    return matchesSearch && matchesType;
  });

  const handleFollow = (targetUserId: string, targetUserName: string) => {
    setFollowTarget({ id: targetUserId, name: targetUserName });
    setShowFollowDialog(true);
  };

  const handleUnfollow = (followerId: string, followingId: string) => {
    unfollowUserMutation.mutate({ followerId, followingId });
  };

  const handleBulkDelete = () => {
    if (selectedFollowers.length === 0) {
      toast.error('Please select followers to remove');
      return;
    }
    
    if (confirm(`Are you sure you want to remove ${selectedFollowers.length} follower relationship(s)?`)) {
      bulkDeleteFollowersMutation.mutate(selectedFollowers);
    }
  };

  const columns: Column<Follower>[] = [
    {
      key: 'select',
      header: 'Select',
      render: (f) => (
        <Checkbox
          checked={selectedFollowers.includes(f.id)}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedFollowers([...selectedFollowers, f.id]);
            } else {
              setSelectedFollowers(selectedFollowers.filter(id => id !== f.id));
            }
          }}
        />
      ),
    },
    {
      key: 'follower_id',
      header: 'Follower',
      render: (f) => {
        const user = getUser(f, 'follower');
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profile_image_url} />
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
              <AvatarImage src={user?.profile_image_url} />
              <AvatarFallback>{user?.full_name?.[0]}</AvatarFallback>
            </Avatar>
            <span>{user?.full_name || 'Unknown'}</span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (f) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUnfollow(f.follower_id, f.following_id)}
            disabled={unfollowUserMutation.isPending}
          >
            <UserMinus className="h-3 w-3 mr-1" />
            Unfollow
          </Button>
        </div>
      ),
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

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search followers or following users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Relationships</SelectItem>
              <SelectItem value="followers">Followers Only</SelectItem>
              <SelectItem value="following">Following Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setShowFollowDialog(true)} variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          Follow User
        </Button>
      </div>

      {/* Bulk Action Bar */}
      {selectedFollowers.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedFollowers.length} relationship{selectedFollowers.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleteFollowersMutation.isPending}
            >
              <UserMinus className="h-4 w-4 mr-1" />
              Remove Selected
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">Loading followers...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error loading followers: {error.message}</div>
      ) : (
        <DataTable
          data={filteredFollowers}
          columns={columns}
          onDelete={handleDelete}
        />
      )}

      {/* Follow User Dialog */}
      {showFollowDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Follow a User</h3>
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-muted-foreground">No users available to follow</p>
              ) : (
                users.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.profile_image_url} />
                        <AvatarFallback>{user.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.full_name}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        // For demo, using first user as follower
                        const followerId = (users as any)[0]?.id;
                        if (followerId) {
                          followUserMutation.mutate({ 
                            followerId, 
                            followingId: user.id 
                          });
                        }
                      }}
                      disabled={followUserMutation.isPending}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Follow
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowFollowDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
