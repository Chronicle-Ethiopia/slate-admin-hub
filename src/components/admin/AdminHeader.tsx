import { useState, useEffect, useMemo } from 'react';
import { Bell, Search, Settings, ExternalLink, User, MessageSquare, Heart, UserPlus, Calendar } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import type { Database } from '@/lib/supabase';

interface AdminHeaderProps {
  title: string;
}

type SearchResult = {
  id: string;
  type: 'post' | 'user' | 'comment' | 'category' | 'tag';
  title: string;
  description?: string;
  url: string;
  metadata?: any;
};

type Notification = {
  id: string;
  type: 'user_joined' | 'post_created' | 'comment_created' | 'user_followed' | 'post_liked' | 'comment_liked';
  title: string;
  message: string;
  user_name?: string;
  user_id?: string;
  post_id?: string;
  comment_id?: string;
  created_at: string;
  read: boolean;
};

export function AdminHeader({ title }: AdminHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Fetch notifications
  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch users for search
  const { data: users = [] } = useQuery({
    queryKey: ['search-users'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, bio, created_at')
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch posts for search
  const { data: posts = [] } = useQuery({
    queryKey: ['search-posts'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from('posts')
        .select('id, title, excerpt, slug, author_id, created_at')
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch comments for search
  const { data: comments = [] } = useQuery({
    queryKey: ['search-comments'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from('comments')
        .select('id, content_markdown, post_id, author_id, created_at')
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch categories for search
  const { data: categories = [] } = useQuery({
    queryKey: ['search-categories'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('id, name, slug')
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch tags for search
  const { data: tags = [] } = useQuery({
    queryKey: ['search-tags'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from('tags')
        .select('id, name, slug')
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Generate user activity notifications with useMemo to prevent infinite re-renders
  const userNotifications = useMemo(() => {
    const notifications: Notification[] = [];
    const now = new Date().toISOString(); // Create timestamp once
    
    // User joined notifications
    (users as any).forEach((user: any) => {
      notifications.push({
        id: `user-${user.id}`,
        type: 'user_joined',
        title: 'New User Joined',
        message: `${user.full_name} has joined the platform`,
        user_name: user.full_name,
        user_id: user.id,
        created_at: user.created_at || now,
        read: false,
      });
    });

    // Post created notifications
    (posts as any).forEach((post: any) => {
      const author = (users as any).find((u: any) => u.id === post.author_id);
      notifications.push({
        id: `post-${post.id}`,
        type: 'post_created',
        title: 'New Post Created',
        message: `${author?.full_name || 'Unknown'} created a new post: ${post.title}`,
        user_name: author?.full_name,
        user_id: post.author_id,
        post_id: post.id,
        created_at: post.created_at,
        read: false,
      });
    });

    // Comment created notifications
    (comments as any).forEach((comment: any) => {
      const author = (users as any).find((u: any) => u.id === comment.author_id);
      const post = (posts as any).find((p: any) => p.id === comment.post_id);
      notifications.push({
        id: `comment-${comment.id}`,
        type: 'comment_created',
        title: 'New Comment',
        message: `${author?.full_name || 'Unknown'} commented on: ${post?.title || 'Unknown post'}`,
        user_name: author?.full_name,
        user_id: comment.author_id,
        post_id: comment.post_id,
        comment_id: comment.id,
        created_at: comment.created_at,
        read: false,
      });
    });

    return notifications.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 20);
  }, [users, posts, comments]);

  const allNotifications = useMemo(() => [...notifications, ...userNotifications], [notifications, userNotifications]);
  const unreadCount = useMemo(() => allNotifications.filter(n => !n.read).length, [allNotifications]);

  // Search functionality
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Search users
    (users as any).forEach((user: any) => {
      if (user.full_name.toLowerCase().includes(query)) {
        results.push({
          id: user.id,
          type: 'user',
          title: user.full_name,
          description: user.bio || 'User profile',
          url: `/admin/users?id=${user.id}`,
          metadata: user,
        });
      }
    });

    // Search posts
    (posts as any).forEach((post: any) => {
      if (post.title.toLowerCase().includes(query) || 
          post.excerpt?.toLowerCase().includes(query)) {
        results.push({
          id: post.id,
          type: 'post',
          title: post.title,
          description: post.excerpt || 'Post content',
          url: `https://dev-write.netlify.app/post/${post.slug}`,
          metadata: post,
        });
      }
    });

    // Search comments
    (comments as any).forEach((comment: any) => {
      if (comment.content_markdown.toLowerCase().includes(query)) {
        const post = (posts as any).find((p: any) => p.id === comment.post_id);
        results.push({
          id: comment.id,
          type: 'comment',
          title: 'Comment',
          description: comment.content_markdown.substring(0, 100) + '...',
          url: `https://dev-write.netlify.app/post/${post?.slug || ''}`,
          metadata: comment,
        });
      }
    });

    // Search categories
    (categories as any).forEach((category: any) => {
      if (category.name.toLowerCase().includes(query)) {
        results.push({
          id: category.id,
          type: 'category',
          title: category.name,
          description: 'Category',
          url: `/admin/categories?id=${category.id}`,
          metadata: category,
        });
      }
    });

    // Search tags
    (tags as any).forEach((tag: any) => {
      if (tag.name.toLowerCase().includes(query)) {
        results.push({
          id: tag.id,
          type: 'tag',
          title: tag.name,
          description: 'Tag',
          url: `/admin/tags?id=${tag.id}`,
          metadata: tag,
        });
      }
    });

    setSearchResults(results.slice(0, 10));
  }, [searchQuery, users, posts, comments, categories, tags]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'user_joined': return <UserPlus className="w-4 h-4" />;
      case 'post_created': return <Calendar className="w-4 h-4" />;
      case 'comment_created': return <MessageSquare className="w-4 h-4" />;
      case 'user_followed': return <Heart className="w-4 h-4" />;
      case 'post_liked': return <Heart className="w-4 h-4" />;
      case 'comment_liked': return <Heart className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getSearchIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'user': return <User className="w-4 h-4 text-blue-500" />;
      case 'post': return <Calendar className="w-4 h-4 text-green-500" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-yellow-500" />;
      case 'category': return <div className="w-4 h-4 bg-purple-500 rounded-full" />;
      case 'tag': return <div className="w-4 h-4 bg-orange-500 rounded" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read logic here
    toast.success(`Notification: ${notification.title}`);
  };

  const handleSearchResultClick = (result: SearchResult) => {
    if (result.type === 'post' || result.type === 'comment') {
      window.open(result.url, '_blank');
    } else {
      // Navigate to admin page
      window.location.href = result.url;
    }
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
      <div className="flex items-center justify-between h-full px-6">
        <h1 className="text-xl font-semibold text-foreground hidden lg:block">{title}</h1>
        <div className="lg:hidden w-12" />
        
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <Popover open={isSearchOpen && searchResults.length > 0} onOpenChange={setIsSearchOpen}>
            <PopoverTrigger asChild>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users, posts, comments, categories, tags..."
                  className="pl-10 bg-background border-border"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchOpen(true)}
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <div className="max-h-80 overflow-y-auto">
                {searchResults.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleSearchResultClick(result)}
                  >
                    {getSearchIcon(result.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{result.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {result.type}
                        </Badge>
                      </div>
                      {result.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {result.description}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <div className="max-h-96 overflow-y-auto">
                {allNotifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  allNotifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="p-3 flex items-start gap-3 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3 ml-2 pl-4 border-l border-border">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-foreground">Admin User</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
