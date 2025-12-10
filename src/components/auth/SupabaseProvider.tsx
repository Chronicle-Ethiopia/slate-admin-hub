import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface SupabaseContextType {
  client: typeof supabase
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => supabase)

  return (
    <SupabaseContext.Provider value={{ client }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context.client
}
