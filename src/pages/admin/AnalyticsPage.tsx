import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { analyticsData } from '@/data/mockData';
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
} from 'recharts';
import { TrendingUp, TrendingDown, Users, FileText, MessageSquare, Heart, Eye, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(280, 67%, 60%)', 'hsl(0, 84%, 60%)'];

const engagementTrends = [
  { week: 'Week 1', views: 4200, likes: 890, comments: 234, shares: 120 },
  { week: 'Week 2', views: 5100, likes: 1020, comments: 287, shares: 156 },
  { week: 'Week 3', views: 4800, likes: 950, comments: 265, shares: 143 },
  { week: 'Week 4', views: 6200, likes: 1340, comments: 378, shares: 198 },
  { week: 'Week 5', views: 5800, likes: 1180, comments: 312, shares: 175 },
  { week: 'Week 6', views: 7100, likes: 1520, comments: 423, shares: 234 },
];

const contentPerformance = [
  { category: 'Technology', posts: 145, views: 45000, engagement: 8.5 },
  { category: 'Design', posts: 89, views: 32000, engagement: 9.2 },
  { category: 'Business', posts: 67, views: 28000, engagement: 7.8 },
  { category: 'Lifestyle', posts: 41, views: 18000, engagement: 10.1 },
];

const userRetention = [
  { month: 'Jan', newUsers: 120, returningUsers: 340, churnRate: 5.2 },
  { month: 'Feb', newUsers: 180, returningUsers: 420, churnRate: 4.8 },
  { month: 'Mar', newUsers: 250, returningUsers: 510, churnRate: 4.1 },
  { month: 'Apr', newUsers: 310, returningUsers: 620, churnRate: 3.9 },
  { month: 'May', newUsers: 420, returningUsers: 780, churnRate: 3.5 },
  { month: 'Jun', newUsers: 380, returningUsers: 850, churnRate: 3.2 },
];

const radarData = [
  { metric: 'Engagement', value: 85 },
  { metric: 'Retention', value: 72 },
  { metric: 'Growth', value: 88 },
  { metric: 'Satisfaction', value: 79 },
  { metric: 'Activity', value: 91 },
  { metric: 'Conversion', value: 68 },
];

const hourlyActivity = [
  { hour: '00', activity: 12 }, { hour: '02', activity: 8 }, { hour: '04', activity: 5 },
  { hour: '06', activity: 15 }, { hour: '08', activity: 45 }, { hour: '10', activity: 78 },
  { hour: '12', activity: 95 }, { hour: '14', activity: 88 }, { hour: '16', activity: 76 },
  { hour: '18', activity: 82 }, { hour: '20', activity: 68 }, { hour: '22', activity: 35 },
];

const topPosts = [
  { title: 'Getting Started with React', views: 12500, likes: 890, comments: 156 },
  { title: 'Advanced TypeScript Tips', views: 9800, likes: 720, comments: 134 },
  { title: 'Building Scalable APIs', views: 8900, likes: 650, comments: 98 },
  { title: 'Modern CSS Techniques', views: 7600, likes: 580, comments: 87 },
  { title: 'Design System Best Practices', views: 6800, likes: 520, comments: 76 },
];

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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
        <p className="text-muted-foreground">Detailed insights into user engagement and content performance.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Views" value="156.8K" change={12.5} icon={Eye} color="bg-primary" />
        <MetricCard title="Engagement Rate" value="8.7%" change={3.2} icon={Heart} color="bg-success" />
        <MetricCard title="Active Users" value="2,847" change={-1.8} icon={Users} color="bg-warning" />
        <MetricCard title="Share Rate" value="4.2%" change={8.9} icon={Share2} color="bg-destructive" />
      </div>

      {/* Engagement Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Trends (Last 6 Weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementTrends}>
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
                <BarChart data={userRetention}>
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
                <RadarChart data={radarData}>
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
                <LineChart data={hourlyActivity}>
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
                  <Pie data={contentPerformance} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="posts">
                    {contentPerformance.map((_, index) => (
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
            {topPosts.map((post, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
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
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(post.views / 12500) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
