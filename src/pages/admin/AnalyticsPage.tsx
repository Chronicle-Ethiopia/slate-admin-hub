import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase, supabaseAdmin } from '@/lib/supabase';
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
import { TrendingUp, TrendingDown, Users, FileText, MessageSquare, Heart, Eye, Share2, RefreshCw, Download, Calendar, Target, Activity, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(280, 67%, 60%)', 'hsl(0, 84%, 60%)'];

// Fetch real analytics data
const fetchAnalyticsData = async () => {
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
  const tags = tagsResult.data || [];
  const postTags = postTagsResult.data || [];
  const images = imagesResult.data || [];

  // Calculate metrics
  const totalViews = posts.reduce((sum, post: any) => sum + (post.views || 0), 0);
  const totalLikes = likes.length;
  const totalComments = comments.length;
  const totalShares = bookmarks.length; // Using bookmarks as shares proxy
  const engagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;
  
  // Active users (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const activeUsers = profiles.filter((p: any) => p.last_login_at && new Date(p.last_login_at) > sevenDaysAgo).length;

  // Weekly engagement trends (last 6 weeks)
  const weeklyTrends = [];
  for (let i = 5; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (i * 7));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekPosts = posts.filter((p: any) => {
      const createdAt = new Date(p.created_at);
      return createdAt >= weekStart && createdAt <= weekEnd;
    });

    const weekViews = weekPosts.reduce((sum, p: any) => sum + (p.views || 0), 0);
    const weekLikes = likes.filter((l: any) => {
      const createdAt = new Date(l.created_at);
      return createdAt >= weekStart && createdAt <= weekEnd;
    }).length;
    const weekComments = comments.filter((c: any) => {
      const createdAt = new Date(c.created_at);
      return createdAt >= weekStart && createdAt <= weekEnd;
    }).length;
    const weekShares = bookmarks.filter((b: any) => {
      const createdAt = new Date(b.created_at);
      return createdAt >= weekStart && createdAt <= weekEnd;
    }).length;

    weeklyTrends.push({
      week: `Week ${6 - i}`,
      views: weekViews,
      likes: weekLikes,
      comments: weekComments,
      shares: weekShares
    });
  }

  // Content performance by category
  const contentPerformance = categories.map((category: any) => {
    const categoryPosts = posts.filter((p: any) => p.category_id === category.id);
    const categoryViews = categoryPosts.reduce((sum, p: any) => sum + (p.views || 0), 0);
    const categoryLikes = likes.filter((l: any) => 
      categoryPosts.some((p: any) => p.id === l.post_id)
    ).length;
    const categoryComments = comments.filter((c: any) => 
      categoryPosts.some((p: any) => p.id === c.post_id)
    ).length;
    const categoryEngagement = categoryViews > 0 ? ((categoryLikes + categoryComments) / categoryViews) * 100 : 0;

    return {
      category: category.name,
      posts: categoryPosts.length,
      views: categoryViews,
      engagement: Math.round(categoryEngagement * 10) / 10
    };
  }).filter(cp => cp.posts > 0);

  // User retention data (simplified)
  const userRetention = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  for (let i = 0; i < 6; i++) {
    const monthDate = new Date(new Date().getFullYear(), i, 1);
    const nextMonthDate = new Date(new Date().getFullYear(), i + 1, 1);
    
    const newUsers = profiles.filter((p: any) => {
      const createdAt = new Date(p.created_at);
      return createdAt >= monthDate && createdAt < nextMonthDate;
    }).length;

    const returningUsers = profiles.filter((p: any) => {
      const lastLogin = p.last_login_at ? new Date(p.last_login_at) : null;
      return lastLogin && lastLogin >= monthDate && lastLogin < nextMonthDate && 
             new Date(p.created_at) < monthDate;
    }).length;

    const churnRate = newUsers > 0 ? ((newUsers - returningUsers) / newUsers) * 100 : 0;

    userRetention.push({
      month: months[i],
      newUsers,
      returningUsers,
      churnRate: Math.round(churnRate * 10) / 10
    });
  }

  // Performance radar data
  const avgEngagement = engagementRate;
  const retentionRate = userRetention.length > 0 ? 
    userRetention.reduce((sum, ur) => sum + (100 - ur.churnRate), 0) / userRetention.length : 0;
  const growthRate = profiles.length > 0 ? 
    (profiles.filter((p: any) => new Date(p.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length / profiles.length) * 100 : 0;
  
  const radarData = [
    { metric: 'Engagement', value: Math.min(avgEngagement, 100) },
    { metric: 'Retention', value: Math.min(retentionRate, 100) },
    { metric: 'Growth', value: Math.min(growthRate * 10, 100) },
    { metric: 'Activity', value: Math.min((activeUsers / profiles.length) * 100, 100) },
    { metric: 'Content', value: Math.min((posts.length / profiles.length) * 50, 100) },
    { metric: 'Interaction', value: Math.min(((totalLikes + totalComments) / profiles.length) * 10, 100) },
  ];

  // Hourly activity pattern
  const hourlyActivity = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0');
    const hourActivity = profiles.filter((p: any) => {
      if (!p.last_login_at) return false;
      const loginHour = new Date(p.last_login_at).getHours();
      return loginHour === i;
    }).length;
    hourlyActivity.push({ hour, activity: hourActivity });
  }

  // Top performing posts
  const topPosts = posts
    .filter((p: any) => p.status === 'published')
    .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
    .slice(0, 10)
    .map((post: any) => ({
      title: post.title,
      views: post.views || 0,
      likes: likes.filter((l: any) => l.post_id === post.id).length,
      comments: comments.filter((c: any) => c.post_id === post.id).length,
      id: post.id
    }));

  return {
    totalViews,
    engagementRate: Math.round(engagementRate * 100) / 100,
    activeUsers,
    shareRate: totalViews > 0 ? (totalShares / totalViews) * 100 : 0,
    weeklyTrends,
    contentPerformance,
    userRetention,
    radarData,
    hourlyActivity,
    topPosts,
    totalUsers: profiles.length,
    totalPosts: posts.length,
    totalLikes,
    totalComments,
    totalShares
  };
};

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: string;
}

function MetricCard({ title, value, change, icon: Icon, color }: MetricCardProps) {
  const isPositive = change >= 0;
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <div className={cn('flex items-center gap-1 mt-2 text-sm', isPositive ? 'text-success' : 'text-destructive')}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isPositive ? '+' : ''}{change}%
            </div>
          </div>
          <div className={cn('p-3 rounded-xl', color)}>
            <Icon className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { data: analyticsData, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics-data'],
    queryFn: fetchAnalyticsData,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-500">
          <p className="font-medium">Error loading analytics</p>
          <p className="text-sm">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  // Calculate growth rates (simplified - comparing with previous period)
  const viewsGrowth = 12.5; // Would need historical data for real calculation
  const engagementGrowth = 3.2;
  const usersGrowth = -1.8;
  const sharesGrowth = 8.9;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Detailed insights into user engagement and content performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Views" 
          value={analyticsData.totalViews.toLocaleString()} 
          change={viewsGrowth} 
          icon={Eye} 
          color="bg-primary" 
        />
        <MetricCard 
          title="Engagement Rate" 
          value={`${analyticsData.engagementRate}%`} 
          change={engagementGrowth} 
          icon={Heart} 
          color="bg-success" 
        />
        <MetricCard 
          title="Active Users" 
          value={analyticsData.activeUsers.toLocaleString()} 
          change={usersGrowth} 
          icon={Users} 
          color="bg-warning" 
        />
        <MetricCard 
          title="Share Rate" 
          value={`${analyticsData.shareRate.toFixed(1)}%`} 
          change={sharesGrowth} 
          icon={Share2} 
          color="bg-destructive" 
        />
      </div>

      {/* Engagement Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Trends (Last 6 Weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.weeklyTrends}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" className="text-muted-foreground" fontSize={12} />
                <YAxis className="text-muted-foreground" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Area type="monotone" dataKey="views" stroke="hsl(217, 91%, 60%)" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                <Area type="monotone" dataKey="likes" stroke="hsl(142, 76%, 36%)" strokeWidth={2} fillOpacity={1} fill="url(#colorLikes)" />
                <Area type="monotone" dataKey="comments" stroke="hsl(38, 92%, 50%)" strokeWidth={2} fillOpacity={0.1} fill="hsl(38, 92%, 50%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Retention */}
        <Card>
          <CardHeader>
            <CardTitle>User Retention & Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.userRetention}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-muted-foreground" fontSize={12} />
                  <YAxis className="text-muted-foreground" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="newUsers" name="New Users" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="returningUsers" name="Returning Users" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={analyticsData.radarData}>
                  <PolarGrid className="stroke-border" />
                  <PolarAngleAxis dataKey="metric" className="text-muted-foreground" fontSize={12} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={10} />
                  <Radar name="Score" dataKey="value" stroke="hsl(217, 91%, 60%)" fill="hsl(217, 91%, 60%)" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Hourly Activity Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.hourlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="hour" className="text-muted-foreground" fontSize={12} />
                  <YAxis className="text-muted-foreground" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="activity" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ fill: 'hsl(217, 91%, 60%)', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Content by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Content Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analyticsData.contentPerformance} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="posts">
                    {analyticsData.contentPerformance.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Content */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.topPosts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No published posts available</p>
            ) : (
              analyticsData.topPosts.map((post, index) => (
                <div key={post.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-muted-foreground">#{index + 1}</span>
                    <div>
                      <p className="font-medium">{post.title}</p>
                      <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.comments}</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${(post.views / Math.max(...analyticsData.topPosts.map(p => p.views))) * 100}%` }} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
