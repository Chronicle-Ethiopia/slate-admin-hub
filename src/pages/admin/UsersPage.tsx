import { useState } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Heart, MessageSquare, Users, Bell, Send, Bookmark, UserCheck, Settings } from 'lucide-react';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isNotifyDialogOpen, setIsNotifyDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [viewingUser, setViewingUser] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: '',
    phone: '',
    bio: '',
    role: 'user' as 'user' | 'admin' | 'moderator' | 'editor',
    is_active: true,
    password: '',
  });
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    type: 'info',
  });
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch user's detailed data when viewing
  const { data: userDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['userDetails', viewingUser?.id],
    queryFn: async () => {
      if (!viewingUser?.id) return null;
      
      const [
        postsResult,
        likesResult,
        commentsResult,
        followersResult,
        followingResult,
        bookmarksResult,
        notificationsResult,
        userRolesResult
      ] = await Promise.all([
        // User's posts
        supabase.from('posts').select('id, title, slug, created_at, views, status').eq('author_id', viewingUser.id),
        // User's likes with post details
        supabase.from('likes').select('*, posts!likes_post_id_fkey(id, title, slug, created_at)').eq('user_id', viewingUser.id),
        // User's comments with post details
        supabase.from('comments').select('*, posts!comments_post_id_fkey(id, title, slug, created_at)').eq('author_id', viewingUser.id),
        // User's followers with profile details including profile_image_url
        supabase.from('followers').select('*, profiles!followers_follower_id_fkey(id, full_name, profile_image_url)').eq('following_id', viewingUser.id),
        // User's following with profile details including profile_image_url
        supabase.from('followers').select('*, profiles!followers_following_id_fkey(id, full_name, profile_image_url)').eq('follower_id', viewingUser.id),
        // User's bookmarks with post details
        supabase.from('bookmarks').select('*, posts!bookmarks_post_id_fkey(id, title, slug, created_at)').eq('user_id', viewingUser.id),
        // User's notifications
        supabase.from('notifications').select('*').eq('user_id', viewingUser.id).order('created_at', { ascending: false }).limit(10),
        // User's roles with role details
        supabase.from('user_roles').select('*, roles!user_roles_role_id_fkey(id, name, display_name)').eq('user_id', viewingUser.id)
      ]);
      
      console.log('User details query results:', {
        posts: postsResult.data?.length || 0,
        likes: likesResult.data?.length || 0,
        comments: commentsResult.data?.length || 0,
        followers: followersResult.data?.length || 0,
        following: followingResult.data?.length || 0,
        bookmarks: bookmarksResult.data?.length || 0,
        notifications: notificationsResult.data?.length || 0,
        userRoles: userRolesResult.data?.length || 0,
      });
      
      console.log('Full query results:', {
        postsResult,
        likesResult,
        commentsResult,
        followersResult,
        followingResult,
        bookmarksResult,
        notificationsResult,
        userRolesResult
      });
      
      // Log sample data for debugging
      if (commentsResult.data && commentsResult.data.length > 0) {
        console.log('Sample comment data:', commentsResult.data[0]);
      }
      if (bookmarksResult.data && bookmarksResult.data.length > 0) {
        console.log('Sample bookmark data:', bookmarksResult.data[0]);
      }
      if (followersResult.data && followersResult.data.length > 0) {
        console.log('Sample follower data:', followersResult.data[0]);
      }
      
      return {
        posts: postsResult.data || [],
        likes: likesResult.data || [],
        comments: commentsResult.data || [],
        followers: followersResult.data || [],
        following: followingResult.data || [],
        bookmarks: bookmarksResult.data || [],
        notifications: notificationsResult.data || [],
        userRoles: userRolesResult.data || []
      };
    },
    enabled: !!viewingUser?.id
  });

  // Fetch users from database
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Filter users based on search, role, and status
  const filteredUsers = (users as any).filter((user: any) => {
    const matchesSearch = searchTerm === '' || 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.is_active && !user.blocked) ||
      (statusFilter === 'blocked' && user.blocked) ||
      (statusFilter === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<Profile> & { id: string; password?: string }) => {
      const { id, password, ...profileData } = userData;
      
      // Update profile data
      const { data, error } = await (supabaseAdmin
        .from('profiles') as any)
        .update(profileData)
        .eq('id', id)
        .select('id, full_name, role, is_active, blocked')
        .single();
      
      if (error) throw error;
      
      // Update password if provided
      if (password) {
        const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
          id,
          { password }
        );
        
        if (passwordError) throw passwordError;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('User updated successfully');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Error updating user: ${error.message}`);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Delete related records first (in order of dependencies)
      
      // 1. Delete from role_audit_log
      const { error: auditError } = await supabaseAdmin
        .from('role_audit_log')
        .delete()
        .eq('user_id', userId);
      
      if (auditError) throw auditError;
      
      // 2. Delete from user_roles
      const { error: userRolesError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (userRolesError) throw userRolesError;
      
      // 3. Delete from notifications
      const { error: notificationsError } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('user_id', userId);
      
      if (notificationsError) throw notificationsError;
      
      // 4. Delete from followers (both as follower and following)
      const { error: followersError1 } = await supabaseAdmin
        .from('followers')
        .delete()
        .eq('follower_id', userId);
      
      if (followersError1) throw followersError1;
      
      const { error: followersError2 } = await supabaseAdmin
        .from('followers')
        .delete()
        .eq('following_id', userId);
      
      if (followersError2) throw followersError2;
      
      // 5. Delete from bookmarks
      const { error: bookmarksError } = await supabaseAdmin
        .from('bookmarks')
        .delete()
        .eq('user_id', userId);
      
      if (bookmarksError) throw bookmarksError;
      
      // 6. Delete from likes
      const { error: likesError } = await supabaseAdmin
        .from('likes')
        .delete()
        .eq('user_id', userId);
      
      if (likesError) throw likesError;
      
      // 7. Delete from comments
      const { error: commentsError } = await supabaseAdmin
        .from('comments')
        .delete()
        .eq('author_id', userId);
      
      if (commentsError) throw commentsError;
      
      // 8. Delete from posts
      const { error: postsError } = await supabaseAdmin
        .from('posts')
        .delete()
        .eq('author_id', userId);
      
      if (postsError) throw postsError;
      
      // 9. Finally delete from profiles table
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      // 10. Delete from auth.users table
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (authError) throw authError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error(`Error deleting user: ${error.message}`);
    },
  });

  // Block/Unblock user mutation
  const blockUserMutation = useMutation({
    mutationFn: async ({ userId, blocked }: { userId: string; blocked: boolean }) => {
      console.log('Blocking user:', { userId, blocked });
      
      // Use admin client for elevated permissions
      const { data, error } = await (supabaseAdmin
        .from('profiles') as any)
        .update({ blocked })
        .eq('id', userId)
        .select('id, blocked');
      
      console.log('Update result:', { data, error });
      
      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      // Return the first result since we expect only one row
      return data?.[0] || { id: userId, blocked };
    },
    onSuccess: (updatedUser) => {
      console.log('Block success:', updatedUser);
      
      // Update the viewing user state immediately
      if (viewingUser && viewingUser.id === updatedUser.id) {
        setViewingUser({ ...viewingUser, blocked: updatedUser.blocked });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['userDetails', updatedUser.id] });
      
      toast.success(`User ${updatedUser.blocked ? 'blocked' : 'unblocked'} successfully`);
    },
    onError: (error) => {
      console.error('Block error:', error);
      toast.error(`Error blocking user: ${error.message}`);
    },
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (notificationData: {
      user_id: string;
      title: string;
      message: string;
      type: string;
    }) => {
      const { data, error } = await (supabaseAdmin
        .from('notifications') as any)
        .insert({
          user_id: notificationData.user_id,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          read: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Notification sent successfully');
      setIsNotifyDialogOpen(false);
      setNotificationData({ title: '', message: '', type: 'info' });
    },
    onError: (error) => {
      toast.error(`Error sending notification: ${error.message}`);
    },
  });

  const columns: Column<Profile>[] = [
    {
      key: 'profile_image_url',
      header: 'User',
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.profile_image_url} />
            <AvatarFallback>{user.full_name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{user.full_name}</p>
            <p className="text-xs text-muted-foreground">{user.bio}</p>
          </div>
        </div>
      ),
    },
    { key: 'age', header: 'Age' },
    { key: 'gender', header: 'Gender' },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
          {user.role}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (user) => (
        <div className="flex gap-1">
          {user.blocked && (
            <Badge variant="destructive">Blocked</Badge>
          )}
          {!user.blocked && (
            <Badge variant={user.is_active ? 'default' : 'secondary'}>
              {user.is_active ? 'Active' : 'Inactive'}
            </Badge>
          )}
        </div>
      ),
    },
    { key: 'login_count', header: 'Logins' },
  ];

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({
      full_name: '',
      age: '',
      gender: '',
      phone: '',
      bio: '',
      role: 'user' as 'user' | 'admin' | 'moderator' | 'editor',
      is_active: true,
      password: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (user: Profile) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      age: String(user.age || ''),
      gender: user.gender || '',
      phone: user.phone || '',
      bio: user.bio || '',
      role: user.role as 'user' | 'admin' | 'moderator' | 'editor',
      is_active: user.is_active || false,
      password: '',
    });
    setIsDialogOpen(true);
  };

  const handleView = (user: Profile) => {
    setViewingUser(user);
    setIsViewDialogOpen(true);
  };

  const handleNotify = (user: Profile) => {
    setViewingUser(user);
    setNotificationData({ title: '', message: '', type: 'info' });
    setIsNotifyDialogOpen(true);
  };

  const handleSendNotification = () => {
    if (!viewingUser || !notificationData.title || !notificationData.message) {
      toast.error('Please fill in all notification fields');
      return;
    }

    sendNotificationMutation.mutate({
      user_id: viewingUser.id,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
    });
  };

  const handleDelete = (user: Profile) => {
    deleteUserMutation.mutate(user.id);
  };

  const handleSubmit = () => {
    if (editingUser) {
      // Create update data with only non-null/empty fields
      const updateData: Partial<Profile> & { id: string; password?: string } = {
        id: editingUser.id,
      };

      // Only include fields that have values
      if (formData.full_name.trim()) updateData.full_name = formData.full_name.trim();
      if (formData.age.trim()) updateData.age = Number(formData.age) || null;
      if (formData.gender.trim()) updateData.gender = formData.gender.trim();
      if (formData.phone.trim()) updateData.phone = formData.phone.trim();
      if (formData.bio.trim()) updateData.bio = formData.bio.trim();
      if (formData.role) updateData.role = formData.role;
      if (formData.password.trim()) updateData.password = formData.password.trim();
      
      // Always include is_active as it's a boolean
      updateData.is_active = formData.is_active;

      // Check if there's anything to update
      const hasUpdates = Object.keys(updateData).length > 2; // More than just id and password
      
      if (!hasUpdates && !formData.password.trim()) {
        toast.error('Please fill in at least one field to update');
        return;
      }

      updateUserMutation.mutate(updateData);
    } else {
      // Note: Creating users requires auth integration
      toast.error('User creation requires authentication integration');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Users Management</h2>
        <p className="text-muted-foreground">Manage all user accounts and profiles.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="moderator">Moderators</SelectItem>
            <SelectItem value="editor">Editors</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error loading users: {error.message}</div>
      ) : (
        <DataTable
          data={filteredUsers}
          columns={columns}
          searchKey="full_name"
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          addLabel="Add User"
        />
      )}

      {/* Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Age</Label>
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="25"
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Non-binary">Non-binary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1234567890"
              />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Short bio..."
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as 'user' | 'admin' | 'moderator' | 'editor' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingUser && (
              <div className="space-y-2">
                <Label>New Password (leave empty to keep current)</Label>
                <Input
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter new password"
                />
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label>Active Status</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View User Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-6">
              {/* User Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={viewingUser.profile_image_url} />
                  <AvatarFallback className="text-2xl">{viewingUser.full_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{viewingUser.full_name}</h3>
                  <p className="text-muted-foreground">{viewingUser.bio}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge>{viewingUser.role}</Badge>
                    <Badge variant={viewingUser.is_active ? 'default' : 'destructive'}>
                      {viewingUser.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {viewingUser.blocked && (
                      <Badge variant="destructive">
                        Blocked
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Posts</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{detailsLoading ? '...' : userDetails?.posts.length || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-destructive" />
                      <span className="text-sm text-muted-foreground">Likes</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{detailsLoading ? '...' : userDetails?.likes.length || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-warning" />
                      <span className="text-sm text-muted-foreground">Comments</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{detailsLoading ? '...' : userDetails?.comments.length || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-success" />
                      <span className="text-sm text-muted-foreground">Followers</span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{detailsLoading ? '...' : userDetails?.followers.length || 0}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs for detailed content */}
              <Tabs defaultValue="posts" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="posts">Posts</TabsTrigger>
                  <TabsTrigger value="comments">Comments</TabsTrigger>
                  <TabsTrigger value="likes">Likes</TabsTrigger>
                  <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
                  <TabsTrigger value="social">Social</TabsTrigger>
                  <TabsTrigger value="info">Info</TabsTrigger>
                </TabsList>

                {/* Posts Tab */}
                <TabsContent value="posts" className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <h4 className="font-semibold">User Posts ({userDetails?.posts.length || 0})</h4>
                  </div>
                  {detailsLoading ? (
                    <div className="text-center py-4">Loading posts...</div>
                  ) : userDetails?.posts && userDetails.posts.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {userDetails.posts.map((post: any) => (
                        <Card key={post.id} className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <a 
                                href={`https://dev-write.netlify.app/post/${post.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {post.title}
                              </a>
                              <p className="text-sm text-muted-foreground">Views: {post.views}</p>
                              <p className="text-xs text-muted-foreground">{post.created_at}</p>
                            </div>
                            <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                              {post.status}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">No posts found</div>
                  )}
                </TabsContent>

                {/* Comments Tab */}
                <TabsContent value="comments" className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <h4 className="font-semibold">User Comments ({userDetails?.comments.length || 0})</h4>
                  </div>
                  {detailsLoading ? (
                    <div className="text-center py-4">Loading comments...</div>
                  ) : userDetails?.comments && userDetails.comments.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {userDetails.comments.map((comment: any) => (
                        <Card key={comment.id} className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm">{comment.content_markdown}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                On: <a 
                                  href={`https://dev-write.netlify.app/post/${(comment.posts as any)?.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {(comment.posts as any)?.title}
                                </a>
                              </p>
                              <p className="text-xs text-muted-foreground">{comment.created_at}</p>
                            </div>
                            <Badge variant={comment.approved ? 'default' : 'secondary'}>
                              {comment.approved ? 'Approved' : 'Pending'}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">No comments found</div>
                  )}
                </TabsContent>

                {/* Likes Tab */}
                <TabsContent value="likes" className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    <h4 className="font-semibold">Liked Posts ({userDetails?.likes.length || 0})</h4>
                  </div>
                  {detailsLoading ? (
                    <div className="text-center py-4">Loading likes...</div>
                  ) : userDetails?.likes && userDetails.likes.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {userDetails.likes.map((like: any) => (
                        <Card key={like.id} className="p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <a 
                                href={`https://dev-write.netlify.app/post/${(like.posts as any)?.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {(like.posts as any)?.title}
                              </a>
                              <p className="text-xs text-muted-foreground">{like.created_at}</p>
                            </div>
                            <Heart className="w-4 h-4 text-red-500" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">No liked posts found</div>
                  )}
                </TabsContent>

                {/* Bookmarks Tab */}
                <TabsContent value="bookmarks" className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4" />
                    <h4 className="font-semibold">Bookmarked Posts ({userDetails?.bookmarks.length || 0})</h4>
                  </div>
                  {detailsLoading ? (
                    <div className="text-center py-4">Loading bookmarks...</div>
                  ) : userDetails?.bookmarks && userDetails.bookmarks.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {userDetails.bookmarks.map((bookmark: any) => (
                        <Card key={bookmark.id} className="p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <a 
                                href={`https://dev-write.netlify.app/post/${(bookmark.posts as any)?.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {(bookmark.posts as any)?.title}
                              </a>
                              <p className="text-xs text-muted-foreground">{bookmark.created_at}</p>
                            </div>
                            <Bookmark className="w-4 h-4 text-blue-500" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">No bookmarks found</div>
                  )}
                </TabsContent>

                {/* Social Tab */}
                <TabsContent value="social" className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <h4 className="font-semibold">Social Activity</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Followers ({userDetails?.followers.length || 0})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {detailsLoading ? (
                          <div className="text-sm">Loading...</div>
                        ) : userDetails?.followers && userDetails.followers.length > 0 ? (
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {userDetails.followers.map((follower: any) => (
                              <div key={follower.id} className="flex items-center gap-2 text-sm">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={(follower.profiles as any)?.profile_image_url} />
                                  <AvatarFallback>
                                    {(follower.profiles as any)?.full_name?.[0] || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  {(follower.profiles as any)?.full_name || 'Unknown'}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">No followers</div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Following ({userDetails?.following.length || 0})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {detailsLoading ? (
                          <div className="text-sm">Loading...</div>
                        ) : userDetails?.following && userDetails.following.length > 0 ? (
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {userDetails.following.map((following: any) => (
                              <div key={following.id} className="flex items-center gap-2 text-sm">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={(following.profiles as any)?.profile_image_url} />
                                  <AvatarFallback>
                                    {(following.profiles as any)?.full_name?.[0] || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  {(following.profiles as any)?.full_name || 'Unknown'}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">Not following anyone</div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">User Roles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {detailsLoading ? (
                        <div className="text-sm">Loading...</div>
                      ) : userDetails?.userRoles && userDetails.userRoles.length > 0 ? (
                        <div className="flex gap-2 flex-wrap">
                          {userDetails.userRoles.map((userRole: any) => (
                            <Badge key={userRole.id} variant="secondary">
                              {(userRole.roles as any)?.display_name || (userRole.roles as any)?.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No roles assigned</div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Info Tab */}
                <TabsContent value="info" className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <h4 className="font-semibold">User Information</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Age:</span>
                      <span className="ml-2 font-medium">{viewingUser.age || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gender:</span>
                      <span className="ml-2 font-medium">{viewingUser.gender || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="ml-2 font-medium">{viewingUser.phone || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Login Count:</span>
                      <span className="ml-2 font-medium">{viewingUser.login_count || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Member Since:</span>
                      <span className="ml-2 font-medium">{new Date(viewingUser.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Login:</span>
                      <span className="ml-2 font-medium">
                        {viewingUser.last_login_at ? new Date(viewingUser.last_login_at).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="ml-2 font-medium">
                        <Badge variant={viewingUser.is_active ? 'default' : 'destructive'}>
                          {viewingUser.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Blocked:</span>
                      <span className="ml-2 font-medium">
                        <Badge variant={viewingUser.blocked ? 'destructive' : 'default'}>
                          {viewingUser.blocked ? 'Blocked' : 'Not Blocked'}
                        </Badge>
                      </span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button 
                  variant={viewingUser.blocked ? "default" : "destructive"} 
                  onClick={() => blockUserMutation.mutate({ userId: viewingUser.id, blocked: !viewingUser.blocked })}
                  disabled={blockUserMutation.isPending}
                >
                  {blockUserMutation.isPending ? (
                    'Processing...'
                  ) : viewingUser.blocked ? (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Unblock User
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Block User
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => handleNotify(viewingUser)}>
                  <Bell className="w-4 h-4 mr-2" />
                  Send Notification
                </Button>
                <Button onClick={() => {
                  setIsViewDialogOpen(false);
                  handleEdit(viewingUser);
                }}>
                  Edit User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog open={isNotifyDialogOpen} onOpenChange={setIsNotifyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Notification to {viewingUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Notification Type</Label>
              <Select
                value={notificationData.type}
                onValueChange={(value) => setNotificationData({ ...notificationData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={notificationData.title}
                onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                placeholder="Notification title"
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={notificationData.message}
                onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                placeholder="Enter your message..."
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsNotifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendNotification}>
              <Send className="w-4 h-4 mr-2" />
              Send Notification
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
