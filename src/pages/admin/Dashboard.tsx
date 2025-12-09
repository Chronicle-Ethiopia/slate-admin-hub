import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, MessageSquare, Heart, TrendingUp, Eye, Bookmark, UserPlus, Activity, Calendar, Settings, AlertCircle, Zap, Target, Clock, ArrowUpRight, ArrowDownRight, MoreHorizontal, RefreshCw, Download, Share2, Filter, Search, Edit, Trash2, Plus, BarChart3, PieChart as PieChartIcon, TrendingDown, UserCheck, UserX, Mail, Shield, Bell, Database, Globe, Lock, Unlock } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
} from 'recharts';

const COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(280, 67%, 60%)'];

// Fetch real dashboard analytics data
const fetchDashboardData = async () => {
  const [
    profilesResult,
    postsResult,
    commentsResult,
    likesResult,
    categoriesResult,
    bookmarksResult,
    followersResult,
    notificationsResult,
    roleAuditResult,
    tagsResult,
    postTagsResult,
    imagesResult
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('id, full_name, role, created_at, last_login_at, is_active'),
    supabaseAdmin.from('posts').select('id, title, created_at, category_id, author_id, views, status, excerpt'),
    supabaseAdmin.from('comments').select('id, content_markdown, created_at, post_id, author_id'),
    supabaseAdmin.from('likes').select('id, created_at, post_id, user_id'),
    supabaseAdmin.from('categories').select('name, id, created_at'),
    supabaseAdmin.from('bookmarks').select('id, created_at, post_id, user_id'),
    supabaseAdmin.from('followers').select('id, created_at, follower_id, following_id'),
    supabaseAdmin.from('notifications').select('id, created_at, type, user_id, read'),
    supabaseAdmin.from('role_audit_log').select('id, changed_at, user_id, new_role').order('changed_at', { ascending: false }).limit(10),
    supabaseAdmin.from('tags').select('id, name, created_at'),
    supabaseAdmin.from('post_tags').select('id, post_id, tag_id'),
    supabaseAdmin.from('post_images').select('id, post_id, created_at')
  ]);

  if (profilesResult.error) throw profilesResult.error;
  if (postsResult.error) throw postsResult.error;
  if (commentsResult.error) throw commentsResult.error;
  if (likesResult.error) throw likesResult.error;
  if (categoriesResult.error) throw categoriesResult.error;
  if (bookmarksResult.error) throw bookmarksResult.error;
  if (followersResult.error) throw followersResult.error;
  if (notificationsResult.error) throw notificationsResult.error;
  if (roleAuditResult.error) throw roleAuditResult.error;
  if (tagsResult.error) throw tagsResult.error;
  if (postTagsResult.error) throw postTagsResult.error;
  if (imagesResult.error) throw imagesResult.error;

  const profiles = profilesResult.data || [];
  const posts = postsResult.data || [];
  const comments = commentsResult.data || [];
  const likes = likesResult.data || [];
  const categories = categoriesResult.data || [];
  const bookmarks = bookmarksResult.data || [];
  const followers = followersResult.data || [];
  const notifications = notificationsResult.data || [];
  const roleAudits = roleAuditResult.data || [];
  const tags = tagsResult.data || [];
  const postTags = postTagsResult.data || [];
  const images = imagesResult.data || [];

  // Calculate real stats
  const totalUsers = profiles.length;
  const totalPosts = posts.length;
  const totalComments = comments.length;
  const totalLikes = likes.length;
  const totalBookmarks = bookmarks.length;
  const totalFollows = followers.length;
  const totalNotifications = notifications.length;
  const totalTags = tags.length;
  const totalImages = images.length;

  // Active users (logged in within last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const activeUsers = profiles.filter((p: any) => p.last_login_at && new Date(p.last_login_at) > sevenDaysAgo).length;

  // Calculate real growth (compare with last month)
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const lastMonthUsers = profiles.filter((p: any) => new Date(p.created_at) < oneMonthAgo).length;
  const thisMonthUsers = profiles.filter((p: any) => new Date(p.created_at) >= oneMonthAgo).length;
  const userGrowth = lastMonthUsers > 0 ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 : 0;

  const lastMonthPosts = posts.filter((p: any) => new Date(p.created_at) < oneMonthAgo).length;
  const thisMonthPosts = posts.filter((p: any) => new Date(p.created_at) >= oneMonthAgo).length;
  const postGrowth = lastMonthPosts > 0 ? ((thisMonthPosts - lastMonthPosts) / lastMonthPosts) * 100 : 0;

  const lastMonthComments = comments.filter((c: any) => new Date(c.created_at) < oneMonthAgo).length;
  const thisMonthComments = comments.filter((c: any) => new Date(c.created_at) >= oneMonthAgo).length;
  const commentGrowth = lastMonthComments > 0 ? ((thisMonthComments - lastMonthComments) / lastMonthComments) * 100 : 0;

  const lastMonthLikes = likes.filter((l: any) => new Date(l.created_at) < oneMonthAgo).length;
  const thisMonthLikes = likes.filter((l: any) => new Date(l.created_at) >= oneMonthAgo).length;
  const likeGrowth = lastMonthLikes > 0 ? ((thisMonthLikes - lastMonthLikes) / lastMonthLikes) * 100 : 0;

  // Real monthly users data
  const monthlyUsers = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  
  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(currentYear, i, 1);
    const nextMonthDate = new Date(currentYear, i + 1, 1);
    
    const usersInMonth = profiles.filter((p: any) => {
      const createdAt = new Date(p.created_at);
      return createdAt >= monthDate && createdAt < nextMonthDate;
    }).length;
    
    monthlyUsers.push({
      month: months[i],
      users: usersInMonth,
      cumulative: profiles.filter((p: any) => new Date(p.created_at) < nextMonthDate).length
    });
  }

  // Real posts by category
  const postsByCategory = categories.map((category: any) => ({
    name: category.name,
    value: posts.filter((post: any) => post.category_id === category.id).length
  })).filter((cat: any) => cat.value > 0);

  // Real engagement by day (last 7 days)
  const engagementByDay = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
    
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    const dayEnd = new Date(date.setHours(23, 59, 59, 999));
    
    const likesInDay = likes.filter((l: any) => {
      const createdAt = new Date(l.created_at);
      return createdAt >= dayStart && createdAt <= dayEnd;
    }).length;
    
    const commentsInDay = comments.filter((c: any) => {
      const createdAt = new Date(c.created_at);
      return createdAt >= dayStart && createdAt <= dayEnd;
    }).length;
    
    engagementByDay.push({
      day: dayName,
      likes: likesInDay,
      comments: commentsInDay
    });
  }

  // Real users by role
  const usersByRole = [
    { role: 'Users', count: profiles.filter((p: any) => p.role === 'user').length },
    { role: 'Editors', count: profiles.filter((p: any) => p.role === 'editor').length },
    { role: 'Moderators', count: profiles.filter((p: any) => p.role === 'moderator').length },
    { role: 'Admins', count: profiles.filter((p: any) => p.role === 'admin').length },
  ];

  // Recent activities
  const recentActivities = [
    ...roleAudits.map((audit: any) => ({
      id: audit.id,
      type: 'role_change',
      user_id: audit.user_id,
      message: `Role changed to ${audit.new_role}`,
      created_at: audit.changed_at
    })),
    ...posts.slice(-5).reverse().map((post: any) => ({
      id: post.id,
      type: 'post_created',
      user_id: post.author_id,
      message: `Created post: ${post.title}`,
      created_at: post.created_at
    })),
    ...comments.slice(-5).reverse().map((comment: any) => ({
      id: comment.id,
      type: 'comment_created',
      user_id: comment.author_id,
      message: `Commented on post`,
      created_at: comment.created_at
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10);

  // Content statistics
  const publishedPosts = posts.filter((p: any) => p.status === 'published').length;
  const draftPosts = posts.filter((p: any) => p.status === 'draft').length;
  const totalViews = posts.reduce((sum, post: any) => sum + (post.views || 0), 0);

  // Additional analytics
  const unreadNotifications = notifications.filter((n: any) => !n.read).length;
  const avgViewsPerPost = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0;
  const engagementRate = totalViews > 0 ? Math.round(((totalLikes + totalComments) / totalViews) * 100) : 0;
  
  // Top performing posts
  const topPosts = posts
    .filter((p: any) => p.status === 'published')
    .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  // Tag usage statistics
  const tagUsage = tags.map((tag: any) => ({
    name: tag.name,
    usage: postTags.filter((pt: any) => pt.tag_id === tag.id).length
  })).sort((a, b) => b.usage - a.usage).slice(0, 10);

  // User activity heatmap (last 30 days)
  const userActivity = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    const dayEnd = new Date(date.setHours(23, 59, 59, 999));
    
    const activeCount = profiles.filter((p: any) => 
      p.last_login_at && new Date(p.last_login_at) >= dayStart && new Date(p.last_login_at) <= dayEnd
    ).length;
    
    userActivity.push({
      date: date.toLocaleDateString(),
      active: activeCount,
      dateObj: date
    });
  }

  return {
    totalUsers,
    totalPosts,
    totalComments,
    totalLikes,
    totalBookmarks,
    totalFollows,
    totalNotifications,
    totalTags,
    totalImages,
    activeUsers,
    publishedPosts,
    draftPosts,
    totalViews,
    userGrowth,
    postGrowth,
    commentGrowth,
    likeGrowth,
    monthlyUsers,
    postsByCategory,
    engagementByDay,
    usersByRole,
    recentActivities,
    profiles,
    posts,
    comments,
    unreadNotifications,
    avgViewsPerPost,
    engagementRate,
    topPosts,
    tagUsage,
    userActivity
  };
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: fetchDashboardData,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-500">
          <p className="font-medium">Error loading dashboard</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'role_change': return <Users className="w-4 h-4 text-blue-500" />;
      case 'post_created': return <FileText className="w-4 h-4 text-green-500" />;
      case 'comment_created': return <MessageSquare className="w-4 h-4 text-yellow-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getUserName = (userId: string) => {
    const user = (analyticsData.profiles as any).find((p: any) => p.id === userId);
    return user?.full_name || 'Unknown User';
  };

  const handlePostClick = (postId: string) => {
    navigate(`/admin/posts?edit=${postId}`);
  };

  const handleTagClick = (tagName: string) => {
    navigate(`/admin/tags?search=${tagName}`);
  };

  const handleViewAll = (section: string) => {
    switch (section) {
      case 'activities':
        navigate('/admin/activities');
        break;
      case 'posts':
        navigate('/admin/posts');
        break;
      case 'tags':
        navigate('/admin/tags');
        break;
      case 'users':
        navigate('/admin/users');
        break;
      default:
        console.log('Unknown section:', section);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create-post':
        navigate('/admin/posts?action=create');
        break;
      case 'manage-users':
        navigate('/admin/users');
        break;
      case 'view-analytics':
        navigate('/admin/analytics');
        break;
      case 'settings':
        navigate('/admin/settings');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString()}
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleQuickAction('create-post')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Create Post</p>
              <p className="text-xs text-muted-foreground">New content</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleQuickAction('manage-users')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium">Manage Users</p>
              <p className="text-xs text-muted-foreground">User admin</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleQuickAction('view-analytics')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium">Analytics</p>
              <p className="text-xs text-muted-foreground">Deep insights</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleQuickAction('settings')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Settings className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="font-medium">Settings</p>
              <p className="text-xs text-muted-foreground">System config</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Grid - Responsive */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Total Users"
          value={analyticsData.totalUsers.toLocaleString()}
          change={analyticsData.userGrowth}
          icon={Users}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
        <StatCard
          title="Total Posts"
          value={analyticsData.totalPosts.toLocaleString()}
          change={analyticsData.postGrowth}
          icon={FileText}
          iconColor="text-success"
          iconBg="bg-success/10"
        />
        <StatCard
          title="Total Comments"
          value={analyticsData.totalComments.toLocaleString()}
          change={analyticsData.commentGrowth}
          icon={MessageSquare}
          iconColor="text-warning"
          iconBg="bg-warning/10"
        />
        <StatCard
          title="Total Likes"
          value={analyticsData.totalLikes.toLocaleString()}
          change={analyticsData.likeGrowth}
          icon={Heart}
          iconColor="text-destructive"
          iconBg="bg-destructive/10"
        />
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Views</p>
              <p className="text-lg font-semibold">{analyticsData.totalViews.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">Bookmarks</p>
              <p className="text-lg font-semibold">{analyticsData.totalBookmarks.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Follows</p>
              <p className="text-lg font-semibold">{analyticsData.totalFollows.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Active Users</p>
              <p className="text-lg font-semibold">{analyticsData.activeUsers.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Published</p>
              <p className="text-lg font-semibold">{analyticsData.publishedPosts.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-xs text-muted-foreground">Drafts</p>
              <p className="text-lg font-semibold">{analyticsData.draftPosts.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* New Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Engagement Rate Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Engagement Rate</p>
              <p className="text-2xl font-bold">{analyticsData.engagementRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {analyticsData.totalLikes + analyticsData.totalComments} interactions
              </p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Target className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </Card>

        {/* Avg Views Per Post Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Views/Post</p>
              <p className="text-2xl font-bold">{analyticsData.avgViewsPerPost.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Across {analyticsData.publishedPosts} posts
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Eye className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </Card>

        {/* Unread Notifications Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Unread Notifications</p>
              <p className="text-2xl font-bold">{analyticsData.unreadNotifications.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {analyticsData.totalNotifications} total
              </p>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <Bell className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Top Posts and Tags Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Top Performing Posts</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => handleViewAll('posts')}>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.topPosts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No posts available</p>
              ) : (
                analyticsData.topPosts.map((post: any, index: number) => (
                  <div 
                    key={post.id} 
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => handlePostClick(post.id)}
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{post.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {post.views?.toLocaleString() || 0} views
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {post.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Popular Tags */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Popular Tags</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => handleViewAll('tags')}>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.tagUsage.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No tags available</p>
              ) : (
                analyticsData.tagUsage.map((tag: any, index: number) => (
                  <div key={tag.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium">{tag.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {tag.usage} uses
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row - Responsive */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* User Growth Chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.monthlyUsers}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-muted-foreground" fontSize={12} />
                  <YAxis className="text-muted-foreground" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="hsl(217, 91%, 60%)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Posts by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Posts by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] sm:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.postsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analyticsData.postsByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Responsive */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Engagement Chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] sm:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.engagementByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-muted-foreground" fontSize={12} />
                  <YAxis className="text-muted-foreground" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="likes" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="comments" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Activities</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => handleViewAll('activities')}>
              See All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[350px] overflow-y-auto">
              {analyticsData.recentActivities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No recent activities</p>
              ) : (
                analyticsData.recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {getUserName(activity.user_id)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users by Role - Responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Users by Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {analyticsData.usersByRole.map((item, index) => (
              <div
                key={item.role}
                className="p-4 rounded-xl bg-muted/50 text-center hover:bg-muted/70 transition-colors"
              >
                <p className="text-2xl md:text-3xl font-bold" style={{ color: COLORS[index] }}>
                  {item.count}
                </p>
                <p className="text-sm text-muted-foreground">{item.role}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
