import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/admin/Dashboard";
import UsersPage from "./pages/admin/UsersPage";
import PostsPage from "./pages/admin/PostsPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import TagsPage from "./pages/admin/TagsPage";
import CommentsPage from "./pages/admin/CommentsPage";
import LikesPage from "./pages/admin/LikesPage";
import BookmarksPage from "./pages/admin/BookmarksPage";
import FollowersPage from "./pages/admin/FollowersPage";
import NotificationsPage from "./pages/admin/NotificationsPage";
import RolesPage from "./pages/admin/RolesPage";
import UserRolesPage from "./pages/admin/UserRolesPage";
import RoleAuditPage from "./pages/admin/RoleAuditPage";
import PostImagesPage from "./pages/admin/PostImagesPage";
import CommentLikesPage from "./pages/admin/CommentLikesPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="posts" element={<PostsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="tags" element={<TagsPage />} />
              <Route path="comments" element={<CommentsPage />} />
              <Route path="likes" element={<LikesPage />} />
              <Route path="comment-likes" element={<CommentLikesPage />} />
              <Route path="bookmarks" element={<BookmarksPage />} />
              <Route path="followers" element={<FollowersPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="roles" element={<RolesPage />} />
              <Route path="user-roles" element={<UserRolesPage />} />
              <Route path="role-audit" element={<RoleAuditPage />} />
              <Route path="post-images" element={<PostImagesPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
