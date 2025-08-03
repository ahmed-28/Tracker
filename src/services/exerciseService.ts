import { supabase, getCurrentUser } from './supabase';
import { Database } from '../types/database';

type ExerciseRow = Database['public']['Tables']['exercises']['Row'];
type UserExerciseInsert = Database['public']['Tables']['user_exercises']['Insert'];

export interface Exercise {
  id: string;
  name: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserExercise {
  id: string;
  userId: string;
  exerciseId: string;
  exercise: Exercise;
  customName: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

// Convert database row to Exercise
const dbRowToExercise = (row: ExerciseRow): Exercise => ({
  id: row.id,
  name: row.name,
  category: row.category,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Get all global exercises
export const getAllExercises = async (): Promise<Exercise[]> => {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching exercises:', error);
    throw new Error(`Failed to fetch exercises: ${error.message}`);
  }

  return (data || []).map(dbRowToExercise);
};

// Get exercises by category
export const getExercisesByCategory = async (category: string): Promise<Exercise[]> => {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .ilike('category', `%${category}%`)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching exercises by category:', error);
    throw new Error(`Failed to fetch exercises: ${error.message}`);
  }

  return (data || []).map(dbRowToExercise);
};

// Search exercises by name
export const searchExercises = async (searchTerm: string): Promise<Exercise[]> => {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .ilike('name', `%${searchTerm}%`)
    .order('name', { ascending: true })
    .limit(20);

  if (error) {
    console.error('Error searching exercises:', error);
    throw new Error(`Failed to search exercises: ${error.message}`);
  }

  return (data || []).map(dbRowToExercise);
};

// Add an exercise to user's library
export const addExerciseToUserLibrary = async (exerciseId: string, customName?: string): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to add exercises to library');
  }

  const insertData: UserExerciseInsert = {
    user_id: user.id,
    exercise_id: exerciseId,
    custom_name: customName || null,
    is_favorite: false,
  };

  const { error } = await supabase
    .from('user_exercises')
    .upsert(insertData, {
      onConflict: 'user_id,exercise_id'
    });

  if (error) {
    console.error('Error adding exercise to user library:', error);
    throw new Error(`Failed to add exercise to library: ${error.message}`);
  }
};

// Remove an exercise from user's library
export const removeExerciseFromUserLibrary = async (exerciseId: string): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to remove exercises from library');
  }

  // Check if this exercise is used in any workouts
  const { data: workouts, error: workoutError } = await supabase
    .from('workouts')
    .select('id, exercise_name')
    .eq('user_id', user.id);

  if (workoutError) {
    console.error('Error checking workout usage:', workoutError);
    throw new Error('Failed to check if exercise is in use');
  }

  // Get the exercise name to check against workout entries
  const { data: exercise, error: exerciseError } = await supabase
    .from('exercises')
    .select('name')
    .eq('id', exerciseId)
    .single();

  if (exerciseError) {
    console.error('Error fetching exercise:', exerciseError);
    throw new Error('Failed to fetch exercise details');
  }

  const isUsed = (workouts || []).some(w => 
    w.exercise_name.toLowerCase() === exercise.name.toLowerCase()
  );

  if (isUsed) {
    throw new Error('Cannot remove exercise that is used in workout entries');
  }

  const { error } = await supabase
    .from('user_exercises')
    .delete()
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId);

  if (error) {
    console.error('Error removing exercise from user library:', error);
    throw new Error(`Failed to remove exercise from library: ${error.message}`);
  }
};

// Get user's exercise library with details
export const getUserExerciseLibrary = async (): Promise<UserExercise[]> => {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('user_exercises')
    .select(`
      *,
      exercise:exercises(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user exercise library:', error);
    throw new Error(`Failed to fetch exercise library: ${error.message}`);
  }

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    exerciseId: row.exercise_id,
    exercise: dbRowToExercise(row.exercise),
    customName: row.custom_name,
    isFavorite: row.is_favorite,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

// Get user's exercise names (for compatibility with existing localStorage interface)
export const getExerciseLibrary = async (): Promise<string[]> => {
  const userExercises = await getUserExerciseLibrary();
  return userExercises.map(ue => ue.customName || ue.exercise.name);
};

// Get exercise suggestions based on input (combines user library and global exercises)
export const getExerciseSuggestions = async (input: string): Promise<string[]> => {
  if (!input.trim()) {
    // Return user's library first, then some popular exercises
    const userLibrary = await getExerciseLibrary();
    return userLibrary.slice(0, 10);
  }

  // Search both user library and global exercises
  const [userExercises, globalExercises] = await Promise.all([
    getUserExerciseLibrary(),
    searchExercises(input)
  ]);

  // Combine results, prioritizing user library
  const userLibraryNames = userExercises
    .filter(ue => {
      const name = ue.customName || ue.exercise.name;
      return name.toLowerCase().includes(input.toLowerCase());
    })
    .map(ue => ue.customName || ue.exercise.name);

  const globalExerciseNames = globalExercises
    .map(e => e.name)
    .filter(name => !userLibraryNames.includes(name)); // Avoid duplicates

  return [...userLibraryNames, ...globalExerciseNames].slice(0, 10);
};

// Add exercise to library by name (creates global exercise if doesn't exist)
export const addExerciseToLibrary = async (exerciseName: string): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to add exercises to library');
  }

  const normalizedName = normalizeExerciseName(exerciseName);
  
  if (!normalizedName.trim()) {
    throw new Error('Exercise name cannot be empty');
  }

  // Check if exercise already exists globally
  let { data: existingExercise, error: searchError } = await supabase
    .from('exercises')
    .select('id')
    .ilike('name', normalizedName)
    .single();

  if (searchError && searchError.code !== 'PGRST116') {
    console.error('Error searching for exercise:', searchError);
    throw new Error('Failed to search for exercise');
  }

  let exerciseId: string;

  if (existingExercise) {
    exerciseId = existingExercise.id;
  } else {
    // Create new global exercise
    const { data: newExercise, error: createError } = await supabase
      .from('exercises')
      .insert({
        name: normalizedName,
        category: null // Could be enhanced to categorize automatically
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating exercise:', createError);
      throw new Error(`Failed to create exercise: ${createError.message}`);
    }

    exerciseId = newExercise.id;
  }

  // Add to user's library
  await addExerciseToUserLibrary(exerciseId);
};

// Remove exercise from library by name
export const removeExerciseFromLibrary = async (exerciseName: string): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) {
    return false;
  }

  // Find the exercise in user's library
  const userExercises = await getUserExerciseLibrary();
  const userExercise = userExercises.find(ue => 
    (ue.customName || ue.exercise.name) === exerciseName
  );

  if (!userExercise) {
    return false;
  }

  try {
    await removeExerciseFromUserLibrary(userExercise.exerciseId);
    return true;
  } catch (error) {
    console.error('Error removing exercise from library:', error);
    return false;
  }
};

// Toggle favorite status for an exercise
export const toggleExerciseFavorite = async (exerciseId: string): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to modify exercise preferences');
  }

  const { data: userExercise, error: fetchError } = await supabase
    .from('user_exercises')
    .select('is_favorite')
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId)
    .single();

  if (fetchError) {
    console.error('Error fetching user exercise:', fetchError);
    throw new Error('Failed to fetch exercise preferences');
  }

  const { error: updateError } = await supabase
    .from('user_exercises')
    .update({ is_favorite: !userExercise.is_favorite })
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId);

  if (updateError) {
    console.error('Error updating exercise favorite status:', updateError);
    throw new Error('Failed to update exercise preferences');
  }
};

// Update custom name for an exercise
export const updateExerciseCustomName = async (exerciseId: string, customName: string | null): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to modify exercise preferences');
  }

  const { error } = await supabase
    .from('user_exercises')
    .update({ custom_name: customName })
    .eq('user_id', user.id)
    .eq('exercise_id', exerciseId);

  if (error) {
    console.error('Error updating exercise custom name:', error);
    throw new Error('Failed to update exercise name');
  }
};

// Utility function to normalize exercise names (same as localStorage version)
export const normalizeExerciseName = (name: string): string => {
  return name.trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Get unique exercise names from user's workouts (for migration compatibility)
export const getUniqueExerciseNames = async (): Promise<string[]> => {
  return await getExerciseLibrary();
};

// Subscribe to user exercise library changes
export const subscribeToUserExercises = (callback: (exercises: string[]) => void) => {
  return supabase
    .channel('user-exercises-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_exercises'
      },
      async () => {
        try {
          const exercises = await getExerciseLibrary();
          callback(exercises);
        } catch (error) {
          console.error('Error refetching exercises after change:', error);
        }
      }
    )
    .subscribe();
};