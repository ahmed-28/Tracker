import { supabase, getCurrentUser } from './supabase';
import { BodyWeightEntry } from '../types';
import { Database } from '../types/database';

type BodyWeightRow = Database['public']['Tables']['body_weights']['Row'];
type BodyWeightInsert = Database['public']['Tables']['body_weights']['Insert'];
type BodyWeightUpdate = Database['public']['Tables']['body_weights']['Update'];

// Convert database row to BodyWeightEntry
const dbRowToBodyWeightEntry = (row: BodyWeightRow): BodyWeightEntry => ({
  id: row.id,
  weight: Number(row.weight),
  date: row.date,
  createdAt: row.created_at,
});

// Convert BodyWeightEntry to database insert
const bodyWeightEntryToDbInsert = (
  entry: Omit<BodyWeightEntry, 'id' | 'createdAt'>,
  userId: string
): BodyWeightInsert => ({
  user_id: userId,
  weight: entry.weight,
  date: entry.date,
});

export const addBodyWeightEntry = async (
  entry: Omit<BodyWeightEntry, 'id' | 'createdAt'>
): Promise<BodyWeightEntry> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to add body weight entries');
  }

  const insertData = bodyWeightEntryToDbInsert(entry, user.id);

  // Use upsert to handle the unique constraint on user_id + date
  const { data, error } = await supabase
    .from('body_weights')
    .upsert(insertData, {
      onConflict: 'user_id,date'
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding body weight entry:', error);
    throw new Error(`Failed to save body weight: ${error.message}`);
  }

  return dbRowToBodyWeightEntry(data);
};

export const getBodyWeightEntries = async (limit?: number): Promise<BodyWeightEntry[]> => {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  let query = supabase
    .from('body_weights')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching body weight entries:', error);
    throw new Error(`Failed to fetch body weights: ${error.message}`);
  }

  return (data || []).map(dbRowToBodyWeightEntry);
};

export const getBodyWeightsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<BodyWeightEntry[]> => {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('body_weights')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching body weights by date range:', error);
    throw new Error(`Failed to fetch body weights: ${error.message}`);
  }

  return (data || []).map(dbRowToBodyWeightEntry);
};

export const getLatestBodyWeight = async (): Promise<BodyWeightEntry | null> => {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('body_weights')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No data found
      return null;
    }
    console.error('Error fetching latest body weight:', error);
    throw new Error(`Failed to fetch latest body weight: ${error.message}`);
  }

  return dbRowToBodyWeightEntry(data);
};

export const getBodyWeightProgressData = async (): Promise<Array<{date: string, value: number}>> => {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('body_weights')
    .select('weight, date')
    .eq('user_id', user.id)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching body weight progress data:', error);
    throw new Error(`Failed to fetch body weight progress: ${error.message}`);
  }

  return (data || []).map(row => ({
    date: row.date,
    value: Number(row.weight)
  }));
};

export const updateBodyWeightEntry = async (
  id: string,
  updates: Partial<Omit<BodyWeightEntry, 'id' | 'createdAt'>>
): Promise<BodyWeightEntry> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to update body weight entries');
  }

  const updateData: BodyWeightUpdate = {};
  if (updates.weight !== undefined) updateData.weight = updates.weight;
  if (updates.date) updateData.date = updates.date;

  const { data, error } = await supabase
    .from('body_weights')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating body weight entry:', error);
    throw new Error(`Failed to update body weight: ${error.message}`);
  }

  return dbRowToBodyWeightEntry(data);
};

export const deleteBodyWeightEntry = async (id: string): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to delete body weight entries');
  }

  const { error } = await supabase
    .from('body_weights')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting body weight entry:', error);
    throw new Error(`Failed to delete body weight: ${error.message}`);
  }
};

// Get body weight statistics
export const getBodyWeightStats = async () => {
  const user = await getCurrentUser();
  if (!user) {
    return {
      currentWeight: 0,
      initialWeight: 0,
      weightChange: 0,
      totalEntries: 0,
      averageWeight: 0
    };
  }

  const { data, error } = await supabase
    .from('body_weights')
    .select('weight, date')
    .eq('user_id', user.id)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching body weight stats:', error);
    return {
      currentWeight: 0,
      initialWeight: 0,
      weightChange: 0,
      totalEntries: 0,
      averageWeight: 0
    };
  }

  const entries = data || [];
  const totalEntries = entries.length;

  if (totalEntries === 0) {
    return {
      currentWeight: 0,
      initialWeight: 0,
      weightChange: 0,
      totalEntries: 0,
      averageWeight: 0
    };
  }

  const weights = entries.map(e => Number(e.weight));
  const initialWeight = weights[0];
  const currentWeight = weights[weights.length - 1];
  const weightChange = currentWeight - initialWeight;
  const averageWeight = weights.reduce((sum, w) => sum + w, 0) / totalEntries;

  return {
    currentWeight,
    initialWeight,
    weightChange,
    totalEntries,
    averageWeight
  };
};

// Subscribe to body weight changes for real-time updates
export const subscribeToBodyWeights = (callback: (bodyWeights: BodyWeightEntry[]) => void) => {
  return supabase
    .channel('body-weights-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'body_weights'
      },
      async () => {
        // Refetch body weights when any change occurs
        try {
          const bodyWeights = await getBodyWeightEntries();
          callback(bodyWeights);
        } catch (error) {
          console.error('Error refetching body weights after change:', error);
        }
      }
    )
    .subscribe();
};