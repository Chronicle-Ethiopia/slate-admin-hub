import { useState } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteRecord } from '@/lib/database';
import type { Database } from '@/lib/supabase';
import { Eye, Trash2, Bookmark, ExternalLink } from 'lucide-react';

type Bookmark = Database['public']['Tables']['bookmarks']['Row'];

export default function BookmarksPage() {
  const queryClient = useQueryClient();
  const [selectedBookmarks, setSelectedBookmarks] = useState<string[]>([]);
  const [viewingBookmark, setViewingBookmark] = useState<any>(null);

  // Fetch bookmarks with user and post data
  const { data: bookmarks = [], isLoading, error } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      console.log('Fetching bookmarks...');
      const { data, error } = await supabaseAdmin
        .from('bookmarks')
        .select(`
          *,
          profiles!bookmarks_user_id_fkey (full_name, profile_image_url),
          posts!bookmarks_post_id_fkey (title, slug, excerpt)
        `)
        .order('created_at', { ascending: false });
      
      console.log('Bookmarks query result:', { data, error });
      
      if (error) {
        console.error('Bookmarks query error:', error);
        throw error;
      }
      return data || [];
    },
  });

  // Bulk delete bookmarks mutation
  const bulkDeleteBookmarksMutation = useMutation({
    mutationFn: async (bookmarkIds: string[]) => {
      const { data, error } = await (supabaseAdmin
        .from('bookmarks') as any)
        .delete()
        .in('id', bookmarkIds)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      toast.success(`Removed ${data?.length || 0} bookmark(s)`);
      setSelectedBookmarks([]);
    },
    onError: (error) => {
      toast.error(`Error removing bookmarks: ${error.message}`);
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

  const handleBulkDelete = () => {
    if (selectedBookmarks.length === 0) {
      toast.error('Please select bookmarks to remove');
      return;
    }
    
    if (confirm(`Are you sure you want to remove ${selectedBookmarks.length} bookmark(s)?`)) {
      bulkDeleteBookmarksMutation.mutate(selectedBookmarks);
    }
  };

  const handleViewDetails = (bookmark: any) => {
    setViewingBookmark(bookmark);
  };

  const getUserName = (bookmark: any) => (bookmark as any).profiles?.full_name || 'Unknown';
  const getPostTitle = (bookmark: any) => (bookmark as any).posts?.title || 'Unknown Post';

  const columns: Column<Bookmark>[] = [
    {
      key: 'select',
      header: 'Select',
      render: (bookmark) => (
        <Checkbox
          checked={selectedBookmarks.includes(bookmark.id)}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedBookmarks([...selectedBookmarks, bookmark.id]);
            } else {
              setSelectedBookmarks(selectedBookmarks.filter(id => id !== bookmark.id));
            }
          }}
        />
      ),
    },
    {
      key: 'user_id',
      header: 'User',
      render: (bookmark) => {
        const user = (bookmark as any).profiles;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user?.profile_image_url} />
              <AvatarFallback className="text-xs">
                {user?.full_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xs font-medium">{user?.full_name || 'Unknown User'}</div>
              <div className="text-xs text-muted-foreground">ID: {bookmark.user_id?.slice(0, 8)}...</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'post_id',
      header: 'Post',
      render: (bookmark) => {
        const post = (bookmark as any).posts;
        return (
          <div className="max-w-sm">
            <div className="text-xs font-medium">{post?.title || 'Unknown Post'}</div>
            {post?.excerpt && (
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {post.excerpt}
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              ID: {bookmark.post_id?.slice(0, 8)}...
            </div>
          </div>
        );
      },
    },
    {
      key: 'created_at',
      header: 'Bookmarked On',
      render: (bookmark) => (
        <div className="text-xs">
          <div>{new Date(bookmark.created_at).toLocaleDateString()}</div>
          <div className="text-muted-foreground">
            {new Date(bookmark.created_at).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (bookmark) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewDetails(bookmark)}
          >
            <Eye className="h-3 w-3 mr-1" />
            Details
          </Button>
        </div>
      ),
    },
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

      {/* Bulk Action Bar */}
      {selectedBookmarks.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedBookmarks.length} bookmark{selectedBookmarks.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleteBookmarksMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remove Selected
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">Loading bookmarks...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error loading bookmarks: {error.message}</div>
      ) : (
        <DataTable 
          data={bookmarks} 
          columns={columns} 
          onDelete={handleDelete}
          onBulkDelete={(items: any[]) => {
            const ids = items.map(item => item.id);
            setSelectedBookmarks(ids);
            handleBulkDelete();
          }}
        />
      )}

      {/* Details Dialog */}
      {viewingBookmark && (
        <Dialog open={!!viewingBookmark} onOpenChange={() => setViewingBookmark(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5" />
                Bookmark Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* User Information */}
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={viewingBookmark.profiles?.profile_image_url} />
                  <AvatarFallback>
                    {viewingBookmark.profiles?.full_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{viewingBookmark.profiles?.full_name || 'Unknown User'}</h3>
                  <p className="text-sm text-muted-foreground">User ID: {viewingBookmark.user_id}</p>
                </div>
              </div>

              {/* Post Information */}
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Post Information
                </h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm font-medium">Title:</span>
                    <p className="text-sm">{viewingBookmark.posts?.title || 'Unknown Post'}</p>
                  </div>
                  {viewingBookmark.posts?.excerpt && (
                    <div>
                      <span className="text-sm font-medium">Excerpt:</span>
                      <p className="text-sm text-muted-foreground">{viewingBookmark.posts.excerpt}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium">Post ID:</span>
                    <p className="text-sm font-mono">{viewingBookmark.post_id}</p>
                  </div>
                  {viewingBookmark.posts?.slug && (
                    <div>
                      <span className="text-sm font-medium">Slug:</span>
                      <p className="text-sm font-mono">{viewingBookmark.posts.slug}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bookmark Information */}
              <div className="space-y-2">
                <h4 className="font-semibold">Bookmark Information</h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm font-medium">Bookmark ID:</span>
                    <p className="text-sm font-mono">{viewingBookmark.id}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Created:</span>
                    <p className="text-sm">
                      {new Date(viewingBookmark.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    const postUrl = `https://dev-write.netlify.app/post/${viewingBookmark.posts?.slug}`;
                    window.open(postUrl, '_blank');
                  }}
                  disabled={!viewingBookmark.posts?.slug}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Post
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteBookmarkMutation.mutate(viewingBookmark.id);
                    setViewingBookmark(null);
                  }}
                  disabled={deleteBookmarkMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Bookmark
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
