import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Heart,
  Bookmark,
  Tag,
  Folder,
  Bell,
  Image,
  UserCheck,
  Shield,
  History,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
  { title: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { 
    title: 'Users', 
    icon: Users,
    children: [
      { title: 'All Users', path: '/admin/users' },
      { title: 'User Roles', path: '/admin/user-roles' },
      { title: 'Roles', path: '/admin/roles' },
      { title: 'Role Audit', path: '/admin/role-audit' },
    ]
  },
  { 
    title: 'Content', 
    icon: FileText,
    children: [
      { title: 'Posts', path: '/admin/posts' },
      { title: 'Categories', path: '/admin/categories' },
      { title: 'Tags', path: '/admin/tags' },
      { title: 'Post Images', path: '/admin/post-images' },
    ]
  },
  { 
    title: 'Engagement', 
    icon: Heart,
    children: [
      { title: 'Comments', path: '/admin/comments' },
      { title: 'Likes', path: '/admin/likes' },
      { title: 'Comment Likes', path: '/admin/comment-likes' },
      { title: 'Bookmarks', path: '/admin/bookmarks' },
      { title: 'Followers', path: '/admin/followers' },
    ]
  },
  { title: 'Notifications', path: '/admin/notifications', icon: Bell },
];

export function AdminSidebar() {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Users', 'Content', 'Engagement']);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleExpand = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const isActive = (path: string) => location.pathname === path;
  const isChildActive = (children?: { path: string }[]) =>
    children?.some(child => location.pathname === child.path);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-accent-foreground">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Manage everything</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Menu
        </p>
        {menuItems.map((item) => (
          <div key={item.title}>
            {item.children ? (
              <>
                <button
                  onClick={() => toggleExpand(item.title)}
                  className={cn(
                    'sidebar-item w-full justify-between',
                    isChildActive(item.children) && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.title}
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform duration-200',
                      expandedItems.includes(item.title) && 'rotate-180'
                    )}
                  />
                </button>
                {expandedItems.includes(item.title) && (
                  <div className="ml-5 pl-4 border-l border-sidebar-border space-y-1 mt-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          'sidebar-item text-sm',
                          isActive(child.path) && 'sidebar-item-active'
                        )}
                      >
                        {child.title}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink
                to={item.path!}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'sidebar-item',
                  isActive(item.path!) && 'sidebar-item-active'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.title}
              </NavLink>
            )}
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border z-40 transition-transform duration-300 lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
