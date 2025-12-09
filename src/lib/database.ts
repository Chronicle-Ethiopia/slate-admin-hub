import { supabase, supabaseAdmin } from './supabase';
import type { Database } from './supabase';

// Generic fetch function
export const fetchTableData = async <T extends keyof Database['public']['Tables']>(
  table: T,
  select: string = '*',
  orderBy?: { column: keyof Database['public']['Tables'][T]['Row']; ascending?: boolean }
) => {
  let query = supabase.from(table).select(select);
  
  if (orderBy) {
    query = query.order(orderBy.column as string, { ascending: orderBy.ascending ?? true });
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
};

// Generic delete function
export const deleteRecord = async <T extends keyof Database['public']['Tables']>(
  table: T,
  id: string
) => {
  const { error } = await supabaseAdmin
    .from(table)
    .delete()
    .eq('id', id as any);
  
  if (error) throw error;
  return true;
};

// Generic update function
export const updateRecord = async <T extends keyof Database['public']['Tables']>(
  table: T,
  id: string,
  data: Partial<Database['public']['Tables'][T]['Update']>
) => {
  const { data: result, error } = await supabaseAdmin
    .from(table)
    .update(data as any)
    .eq('id', id as any)
    .select()
    .single();
    
  if (error) throw error;
  return result;
};

// Generic insert function
export const insertRecord = async <T extends keyof Database['public']['Tables']>(
  table: T,
  data: Database['public']['Tables'][T]['Insert']
) => {
  const { data: result, error } = await supabaseAdmin
    .from(table)
    .insert(data as any)
    .select()
    .single();
    
  if (error) throw error;
  return result;
};
