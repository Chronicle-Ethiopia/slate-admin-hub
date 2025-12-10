import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Combined data fetch to reduce multiple API calls
export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [
        profilesResult,
        postsResult,
        commentsResult,
        likesResult,
        categoriesResult,
        bookmarksResult,
        followersResult,
        notificationsResult,
        tagsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('posts').select('id', { count: 'exact' }),
        supabase.from('comments').select('id', { count: 'exact' }),
        supabase.from('likes').select('id', { count: 'exact' }),
        supabase.from('categories').select('id', { count: 'exact' }),
        supabase.from('bookmarks').select('id', { count: 'exact' }),
        supabase.from('followers').select('id', { count: 'exact' }),
        supabase.from('notifications').select('id', { count: 'exact' }),
        supabase.from('tags').select('id', { count: 'exact' }),
      ]);

      return {
        users: profilesResult.count || 0,
        posts: postsResult.count || 0,
        comments: commentsResult.count || 0,
        likes: likesResult.count || 0,
        categories: categoriesResult.count || 0,
        bookmarks: bookmarksResult.count || 0,
        followers: followersResult.count || 0,
        notifications: notificationsResult.count || 0,
        tags: tagsResult.count || 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Fetch recent activity data in one call
export const useRecentActivity = () => {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const [
        recentUsers,
        recentPosts,
        recentComments,
        recentLikes,
      ] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('likes').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      return {
        recentUsers: recentUsers.data || [],
        recentPosts: recentPosts.data || [],
        recentComments: recentComments.data || [],
        recentLikes: recentLikes.data || [],
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
