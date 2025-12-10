import { lazy } from 'react';

// Lazy load admin pages to reduce initial bundle size
export const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
export const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
export const PostsPage = lazy(() => import('@/pages/admin/PostsPage'));
export const CategoriesPage = lazy(() => import('@/pages/admin/CategoriesPage'));
export const TagsPage = lazy(() => import('@/pages/admin/TagsPage'));
export const CommentsPage = lazy(() => import('@/pages/admin/CommentsPage'));
export const LikesPage = lazy(() => import('@/pages/admin/LikesPage'));
export const BookmarksPage = lazy(() => import('@/pages/admin/BookmarksPage'));
export const FollowersPage = lazy(() => import('@/pages/admin/FollowersPage'));
export const NotificationsPage = lazy(() => import('@/pages/admin/NotificationsPage'));
export const RolesPage = lazy(() => import('@/pages/admin/RolesPage'));
export const UserRolesPage = lazy(() => import('@/pages/admin/UserRolesPage'));
export const RoleAuditPage = lazy(() => import('@/pages/admin/RoleAuditPage'));
export const PostImagesPage = lazy(() => import('@/pages/admin/PostImagesPage'));
export const CommentLikesPage = lazy(() => import('@/pages/admin/CommentLikesPage'));
export const AnalyticsPage = lazy(() => import('@/pages/admin/AnalyticsPage'));
