import { supabase } from '@/integrations/supabase/client';
import { requestQueue } from './requestQueue';

/**
 * Wrapper around Supabase client that automatically queues requests when offline
 * Use this instead of direct supabase calls for mutations
 */
export const offlineSupabase = {
  /**
   * Insert with offline support
   */
  async insert<T = any>(table: string, data: any) {
    if (!navigator.onLine) {
      requestQueue.add('insert', table, data);
      return { data: null, error: null }; // Optimistic response
    }

    try {
      const result = await (supabase.from as any)(table).insert(data);
      
      // If request failed due to network, queue it
      if (result.error?.message.includes('Failed to fetch')) {
        requestQueue.add('insert', table, data);
        return { data: null, error: null };
      }
      
      return result;
    } catch (error: any) {
      // Network error - queue the request
      if (error.message?.includes('fetch') || !navigator.onLine) {
        requestQueue.add('insert', table, data);
        return { data: null, error: null };
      }
      throw error;
    }
  },

  /**
   * Update with offline support
   */
  async update<T = any>(table: string, data: any, id: string) {
    if (!navigator.onLine) {
      requestQueue.add('update', table, { id, ...data });
      return { data: null, error: null };
    }

    try {
      const result = await (supabase.from as any)(table).update(data).eq('id', id);
      
      if (result.error?.message.includes('Failed to fetch')) {
        requestQueue.add('update', table, { id, ...data });
        return { data: null, error: null };
      }
      
      return result;
    } catch (error: any) {
      if (error.message?.includes('fetch') || !navigator.onLine) {
        requestQueue.add('update', table, { id, ...data });
        return { data: null, error: null };
      }
      throw error;
    }
  },

  /**
   * Delete with offline support
   */
  async delete<T = any>(table: string, id: string) {
    if (!navigator.onLine) {
      requestQueue.add('delete', table, { id });
      return { data: null, error: null };
    }

    try {
      const result = await (supabase.from as any)(table).delete().eq('id', id);
      
      if (result.error?.message.includes('Failed to fetch')) {
        requestQueue.add('delete', table, { id });
        return { data: null, error: null };
      }
      
      return result;
    } catch (error: any) {
      if (error.message?.includes('fetch') || !navigator.onLine) {
        requestQueue.add('delete', table, { id });
        return { data: null, error: null };
      }
      throw error;
    }
  }
};
