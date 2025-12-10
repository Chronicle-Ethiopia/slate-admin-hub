import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Remove debug logging in production
if (import.meta.env.DEV) {
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Key:', supabaseAnonKey ? 'Present' : 'Missing')
}

// Handle missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_PUBLISHABLE_KEY:', supabaseAnonKey ? 'Set' : 'Not set')
  throw new Error('Missing Supabase environment variables. Please check your .env file and restart the development server.')
}

// For admin operations that require elevated permissions
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (import.meta.env.DEV) {
  console.log('Service Role Key:', serviceRoleKey ? 'Present' : 'Missing')
}

// Create single instances with global caching to prevent recreation during hot reload
declare global {
  interface Window {
    __SUPABASE_CLIENT__?: ReturnType<typeof createClient<Database>>
    __SUPABASE_ADMIN_CLIENT__?: ReturnType<typeof createClient<Database>>
  }
}

export const supabase = (() => {
  if (typeof window !== 'undefined' && window.__SUPABASE_CLIENT__) {
    return window.__SUPABASE_CLIENT__
  }
  
  const client = createClient<Database>(supabaseUrl, supabaseAnonKey)
  
  if (typeof window !== 'undefined') {
    window.__SUPABASE_CLIENT__ = client
  }
  
  return client
})()

export const supabaseAdmin = (() => {
  if (typeof window !== 'undefined' && window.__SUPABASE_ADMIN_CLIENT__) {
    return window.__SUPABASE_ADMIN_CLIENT__
  }
  
  let client: ReturnType<typeof createClient<Database>>
  
  if (serviceRoleKey) {
    client = createClient<Database>(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  } else {
    // Use the same client instance to avoid multiple auth clients
    client = supabase
  }
  
  if (typeof window !== 'undefined') {
    window.__SUPABASE_ADMIN_CLIENT__ = client
  }
  
  return client
})()

// Database types based on the schema
export interface Database {
  public: {
    Tables: {
      bookmarks: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
        }
      }
      comment_likes: {
        Row: {
          id: string
          user_id: string
          comment_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          comment_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          comment_id?: string
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          parent_comment_id: string | null
          content_markdown: string
          created_at: string
          updated_at: string
          approved: boolean
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          parent_comment_id?: string | null
          content_markdown: string
          created_at?: string
          updated_at?: string
          approved?: boolean
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          parent_comment_id?: string | null
          content_markdown?: string
          created_at?: string
          updated_at?: string
          approved?: boolean
        }
      }
      followers: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string | null
          post_id: string | null
          from_user_id: string | null
          read: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message?: string | null
          post_id?: string | null
          from_user_id?: string | null
          read?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string | null
          post_id?: string | null
          from_user_id?: string | null
          read?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      post_images: {
        Row: {
          id: string
          post_id: string
          url: string
          alt_text: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          url: string
          alt_text?: string | null
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          url?: string
          alt_text?: string | null
          order_index?: number
          created_at?: string
        }
      }
      post_tags: {
        Row: {
          id: string
          post_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          author_id: string
          title: string
          slug: string
          content_markdown: string
          excerpt: string | null
          status: 'draft' | 'published' | 'archived'
          created_at: string
          updated_at: string
          views: number
          read_time: number
          featured_image: string | null
          category_id: string | null
          allow_comments: boolean | null
          comments_enabled: boolean
          is_published: boolean | null
          views_count: number | null
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          slug: string
          content_markdown: string
          excerpt?: string | null
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
          views?: number
          read_time?: number
          featured_image?: string | null
          category_id?: string | null
          allow_comments?: boolean | null
          comments_enabled?: boolean
          is_published?: boolean | null
          views_count?: number | null
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          slug?: string
          content_markdown?: string
          excerpt?: string | null
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
          views?: number
          read_time?: number
          featured_image?: string | null
          category_id?: string | null
          allow_comments?: boolean | null
          comments_enabled?: boolean
          is_published?: boolean | null
          views_count?: number | null
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          age: number | null
          gender: string | null
          phone: string | null
          bio: string | null
          profile_image_url: string | null
          created_at: string
          updated_at: string
          badge: string | null
          twitter: string | null
          facebook: string | null
          linkedin: string | null
          instagram: string | null
          github: string | null
          youtube: string | null
          website: string | null
          show_phone: boolean | null
          background_image_url: string | null
          blocked: boolean | null
          role: 'user' | 'admin' | 'moderator' | 'editor'
          is_active: boolean | null
          last_login_at: string | null
          login_count: number | null
          permissions: Record<string, any> | null
          role_assigned_at: string | null
          role_assigned_by: string | null
        }
        Insert: {
          id: string
          full_name: string
          age?: number | null
          gender?: string | null
          phone?: string | null
          bio?: string | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
          badge?: string | null
          twitter?: string | null
          facebook?: string | null
          linkedin?: string | null
          instagram?: string | null
          github?: string | null
          youtube?: string | null
          website?: string | null
          show_phone?: boolean | null
          background_image_url?: string | null
          blocked?: boolean | null
          role?: 'user' | 'admin' | 'moderator' | 'editor'
          is_active?: boolean | null
          last_login_at?: string | null
          login_count?: number | null
          permissions?: Record<string, any> | null
          role_assigned_at?: string | null
          role_assigned_by?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          age?: number | null
          gender?: string | null
          phone?: string | null
          bio?: string | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
          badge?: string | null
          twitter?: string | null
          facebook?: string | null
          linkedin?: string | null
          instagram?: string | null
          github?: string | null
          youtube?: string | null
          website?: string | null
          show_phone?: boolean | null
          background_image_url?: string | null
          blocked?: boolean | null
          role?: 'user' | 'admin' | 'moderator' | 'editor'
          is_active?: boolean | null
          last_login_at?: string | null
          login_count?: number | null
          permissions?: Record<string, any> | null
          role_assigned_at?: string | null
          role_assigned_by?: string | null
        }
      }
      role_audit_log: {
        Row: {
          id: string
          user_id: string
          old_role: string | null
          new_role: string
          changed_by: string | null
          changed_at: string | null
          reason: string | null
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          user_id: string
          old_role?: string | null
          new_role: string
          changed_by?: string | null
          changed_at?: string | null
          reason?: string | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          old_role?: string | null
          new_role?: string
          changed_by?: string | null
          changed_at?: string | null
          reason?: string | null
          ip_address?: string | null
          user_agent?: string | null
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string | null
          permissions: Record<string, any>
          is_system_role: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          description?: string | null
          permissions?: Record<string, any>
          is_system_role?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          description?: string | null
          permissions?: Record<string, any>
          is_system_role?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          color: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          color?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
          color?: string | null
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role_id: string
          assigned_by: string | null
          assigned_at: string | null
          expires_at: string | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          role_id: string
          assigned_by?: string | null
          assigned_at?: string | null
          expires_at?: string | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string
          role_id?: string
          assigned_by?: string | null
          assigned_at?: string | null
          expires_at?: string | null
          is_active?: boolean | null
        }
      }
    }
  }
}
