import { supabase, getCurrentUser } from './supabase';
import { clearAllData as clearLocalStorage } from '../utils/storage';

export const clearAllUserData = async (): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to clear data');
  }

  try {
    // Clear all workout data
    const { error: workoutsError } = await supabase
      .from('workouts')
      .delete()
      .eq('user_id', user.id);

    if (workoutsError) {
      throw new Error(`Failed to clear workout data: ${workoutsError.message}`);
    }

    // Clear all body weight data
    const { error: bodyWeightsError } = await supabase
      .from('body_weights')
      .delete()
      .eq('user_id', user.id);

    if (bodyWeightsError) {
      throw new Error(`Failed to clear body weight data: ${bodyWeightsError.message}`);
    }

    // Clear all user exercise library data
    const { error: exercisesError } = await supabase
      .from('user_exercises')
      .delete()
      .eq('user_id', user.id);

    if (exercisesError) {
      throw new Error(`Failed to clear exercise data: ${exercisesError.message}`);
    }

    // Clear all profile data (keep the user record but clear custom fields)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        full_name: null,
        avatar_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (profileError) {
      throw new Error(`Failed to clear profile data: ${profileError.message}`);
    }

    // Clear local storage as well
    clearLocalStorage();

    console.log('All user data cleared successfully');
  } catch (error) {
    console.error('Error clearing user data:', error);
    throw error;
  }
};