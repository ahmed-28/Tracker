import { supabase, getCurrentUser } from './supabase';
import { WorkoutEntry } from '../types';
import { Database } from '../types/database';

type WorkoutRow = Database['public']['Tables']['workouts']['Row'];
type WorkoutInsert = Database['public']['Tables']['workouts']['Insert'];
type WorkoutUpdate = Database['public']['Tables']['workouts']['Update'];

// Convert database row to WorkoutEntry
const dbRowToWorkoutEntry = (row: WorkoutRow): WorkoutEntry => ({
  id: row.id,
  exerciseName: row.exercise_name,
  reps: row.reps,
  weight: Number(row.weight),
  date: row.date,
  createdAt: row.created_at,
});

// Convert WorkoutEntry to database insert
const workoutEntryToDbInsert = (
  entry: Omit<WorkoutEntry, 'id' | 'createdAt'>,
  userId: string
): WorkoutInsert => ({
  user_id: userId,
  exercise_name: entry.exerciseName,
  reps: entry.reps,
  weight: entry.weight,
  date: entry.date,
});

export const addWorkoutEntry = async (
  entry: Omit<WorkoutEntry, 'id' | 'createdAt'>
): Promise<WorkoutEntry> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to add workout entries');
  }

  const insertData = workoutEntryToDbInsert(entry, user.id);

  const { data, error } = await supabase
    .from('workouts')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error adding workout entry:', error);
    throw new Error(`Failed to save workout: ${error.message}`);
  }

  return dbRowToWorkoutEntry(data);
};

export const getRecentWorkouts = async (limit: number = 10): Promise<WorkoutEntry[]> => {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent workouts:', error);
    throw new Error(`Failed to fetch workouts: ${error.message}`);
  }

  return (data || []).map(dbRowToWorkoutEntry);
};

export const getAllWorkouts = async (): Promise<WorkoutEntry[]> => {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching all workouts:', error);
    throw new Error(`Failed to fetch workouts: ${error.message}`);
  }

  return (data || []).map(dbRowToWorkoutEntry);
};

export const getWorkoutsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<WorkoutEntry[]> => {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching workouts by date range:', error);
    throw new Error(`Failed to fetch workouts: ${error.message}`);
  }

  return (data || []).map(dbRowToWorkoutEntry);
};

export const getWorkoutsByExercise = async (exerciseName: string): Promise<WorkoutEntry[]> => {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', user.id)
    .ilike('exercise_name', `%${exerciseName}%`)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching workouts by exercise:', error);
    throw new Error(`Failed to fetch workouts: ${error.message}`);
  }

  return (data || []).map(dbRowToWorkoutEntry);
};

export const getProgressData = async (exerciseName?: string): Promise<Array<{date: string, value: number}>> => {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  let query = supabase
    .from('workouts')
    .select('exercise_name, reps, weight, date')
    .eq('user_id', user.id);

  if (exerciseName) {
    query = query.ilike('exercise_name', `%${exerciseName}%`);
  }

  const { data, error } = await query.order('date', { ascending: true });

  if (error) {
    console.error('Error fetching progress data:', error);
    throw new Error(`Failed to fetch progress data: ${error.message}`);
  }

  return (data || []).map(row => ({
    date: row.date,
    value: row.reps * Number(row.weight)
  }));
};

export const updateWorkoutEntry = async (
  id: string,
  updates: Partial<Omit<WorkoutEntry, 'id' | 'createdAt'>>
): Promise<WorkoutEntry> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to update workout entries');
  }

  const updateData: WorkoutUpdate = {};
  if (updates.exerciseName) updateData.exercise_name = updates.exerciseName;
  if (updates.reps !== undefined) updateData.reps = updates.reps;
  if (updates.weight !== undefined) updateData.weight = updates.weight;
  if (updates.date) updateData.date = updates.date;

  const { data, error } = await supabase
    .from('workouts')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating workout entry:', error);
    throw new Error(`Failed to update workout: ${error.message}`);
  }

  return dbRowToWorkoutEntry(data);
};

export const deleteWorkoutEntry = async (id: string): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to delete workout entries');
  }

  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting workout entry:', error);
    throw new Error(`Failed to delete workout: ${error.message}`);
  }
};

// Get workout stats for the current user
export const getWorkoutStats = async () => {
  const user = await getCurrentUser();
  if (!user) {
    return {
      totalWorkouts: 0,
      totalVolume: 0,
      uniqueExercises: 0,
      averageVolume: 0
    };
  }

  const { data, error } = await supabase
    .from('workouts')
    .select('exercise_name, reps, weight')
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching workout stats:', error);
    return {
      totalWorkouts: 0,
      totalVolume: 0,
      uniqueExercises: 0,
      averageVolume: 0
    };
  }

  const workouts = data || [];
  const totalWorkouts = workouts.length;
  const totalVolume = workouts.reduce((sum, w) => sum + (w.reps * Number(w.weight)), 0);
  const uniqueExercises = new Set(workouts.map(w => w.exercise_name)).size;
  const averageVolume = totalWorkouts > 0 ? totalVolume / totalWorkouts : 0;

  return {
    totalWorkouts,
    totalVolume,
    uniqueExercises,
    averageVolume
  };
};

// Subscribe to workout changes for real-time updates
export const subscribeToWorkouts = (callback: (workouts: WorkoutEntry[]) => void) => {
  return supabase
    .channel('workouts-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'workouts'
      },
      async () => {
        // Refetch workouts when any change occurs
        try {
          const workouts = await getRecentWorkouts();
          callback(workouts);
        } catch (error) {
          console.error('Error refetching workouts after change:', error);
        }
      }
    )
    .subscribe();
};