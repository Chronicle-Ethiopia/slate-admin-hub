import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SupabaseProvider } from "@/components/auth/SupabaseProvider";
import { ProtectedRoute, AdminRoute, ModeratorRoute, EditorRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import {
  Dashboard,
  UsersPage,
  PostsPage,
  CategoriesPage,
  TagsPage,
  CommentsPage,
  LikesPage,
  BookmarksPage,
  FollowersPage,
  NotificationsPage,
  RolesPage,
  UserRolesPage,
  RoleAuditPage,
  PostImagesPage,
  CommentLikesPage,
  AnalyticsPage,
} from '@/utils/lazyLoad';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SupabaseProvider>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Index />} />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <Dashboard />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="users" element={
                  <AdminRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <UsersPage />
                    </Suspense>
                  </AdminRoute>
                } />
                <Route path="posts" element={
                  <EditorRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <PostsPage />
                    </Suspense>
                  </EditorRoute>
                } />
                <Route path="categories" element={
                  <ModeratorRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <CategoriesPage />
                    </Suspense>
                  </ModeratorRoute>
                } />
                <Route path="tags" element={
                  <ModeratorRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <TagsPage />
                    </Suspense>
                  </ModeratorRoute>
                } />
                <Route path="comments" element={
                  <ModeratorRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <CommentsPage />
                    </Suspense>
                  </ModeratorRoute>
                } />
                <Route path="likes" element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <LikesPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="comment-likes" element={
                  <ModeratorRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <CommentLikesPage />
                    </Suspense>
                  </ModeratorRoute>
                } />
                <Route path="bookmarks" element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <BookmarksPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="followers" element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <FollowersPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="notifications" element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <NotificationsPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="roles" element={
                  <AdminRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <RolesPage />
                    </Suspense>
                  </AdminRoute>
                } />
                <Route path="user-roles" element={
                  <AdminRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <UserRolesPage />
                    </Suspense>
                  </AdminRoute>
                } />
                <Route path="role-audit" element={
                  <AdminRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <RoleAuditPage />
                    </Suspense>
                  </AdminRoute>
                } />
                <Route path="post-images" element={
                  <EditorRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <PostImagesPage />
                    </Suspense>
                  </EditorRoute>
                } />
                <Route path="analytics" element={
                  <ModeratorRoute>
                    <Suspense fallback={<LoadingSpinner />}>
                      <AnalyticsPage />
                    </Suspense>
                  </ModeratorRoute>
                } />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </SupabaseProvider>
</QueryClientProvider>
);

export default App;
