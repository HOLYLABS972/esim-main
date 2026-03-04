import { supabase } from '../supabase/config';

export async function getAllApiClients() {
  try {
    const clients = [];

    // Try api_clients table
    try {
      const { data } = await supabase.from('api_clients').select('*').order('created_at', { ascending: false });
      if (data) clients.push(...data.map(d => ({ ...d, source: 'api_clients' })));
    } catch (e) { console.log('No api_clients table:', e.message); }

    // Try business_users table
    try {
      const { data } = await supabase.from('business_users').select('*').order('created_at', { ascending: false });
      if (data) clients.push(...data.map(d => ({ ...d, source: 'business_users' })));
    } catch (e) { console.log('No business_users table:', e.message); }

    return clients;
  } catch (error) {
    console.error('Error fetching API clients:', error);
    return [];
  }
}

export async function updateApiClient(id, updates, source = 'api_clients') {
  const table = source === 'business_users' ? 'business_users' : 'api_clients';
  const { error } = await supabase.from(table).update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function getBusinessUserTransactions(userId) {
  const { data, error } = await supabase
    .from('billing_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
