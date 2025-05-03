import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getSupabaseClient() {
  return supabase;
}

// --- SEARCH_HISTORY HELPERS ---
export async function insertSearchHistory(data: any) {
  return await supabase.from('search_history').insert(data).select().maybeSingle();
}

export async function updateSearchHistoryById(id: string, data: any) {
  // Utiliser upsert au lieu de update pour éviter les erreurs de clé dupliquée
  const dataWithId = { ...data, id };
  return await upsertSearchHistory(dataWithId);
}

export async function upsertSearchHistory(data: any) {
  return await supabase
    .from('search_history')
    .upsert(data, {
      onConflict: 'id',
      ignoreDuplicates: false
    })
    .select()
    .maybeSingle();
}

export async function selectSearchHistoryByUser(user_id: string) {
  return await supabase
    .from('search_history')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });
}

export async function deleteSearchHistoryById(id: string) {
  return await supabase.from('search_history').delete().eq('id', id);
}

// --- DAILY_REQUESTS HELPERS ---
export async function insertDailyRequest(data: any) {
  return await supabase.from('daily_requests').insert(data).select().maybeSingle();
}

export async function updateDailyRequestById(id: string, data: any) {
  return await supabase.from('daily_requests').update(data).eq('id', id).select().maybeSingle();
}

export async function selectDailyRequestByUserAndDate(user_id: string, request_date: string) {
  return await supabase
    .from('daily_requests')
    .select('*')
    .eq('user_id', user_id)
    .eq('request_date', request_date)
    .maybeSingle();
}

export async function deleteDailyRequestById(id: string) {
  return await supabase.from('daily_requests').delete().eq('id', id);
} 