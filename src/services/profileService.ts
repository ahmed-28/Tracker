import { supabase, getCurrentUser } from './supabase';
import { Database } from '../types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// Convert database row to UserProfile
const dbRowToProfile = (row: ProfileRow): UserProfile => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name,
  avatarUrl: row.avatar_url,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Get current user's profile
export const getUserProfile = async (): Promise<UserProfile | null> => {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Profile doesn't exist, create it
      return await createUserProfile(user.id, user.email || '');
    }
    console.error('Error fetching user profile:', error);
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return dbRowToProfile(data);
};

// Create user profile (called automatically when user signs up)
export const createUserProfile = async (userId: string, email: string, fullName?: string): Promise<UserProfile> => {
  const insertData: ProfileInsert = {
    id: userId,
    email,
    full_name: fullName || null,
  };

  const { data, error } = await supabase
    .from('profiles')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating user profile:', error);
    throw new Error(`Failed to create profile: ${error.message}`);
  }

  return dbRowToProfile(data);
};

// Update user profile
export const updateUserProfile = async (updates: {
  fullName?: string;
  avatarUrl?: string;
}): Promise<UserProfile> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to update profile');
  }

  const updateData: ProfileUpdate = {};
  if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
  if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return dbRowToProfile(data);
};

// Upload and update avatar
export const uploadAvatar = async (file: File): Promise<string> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to upload avatar');
  }

  // Create a unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Math.random()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError);
    throw new Error(`Failed to upload avatar: ${uploadError.message}`);
  }

  // Get public URL
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  const avatarUrl = data.publicUrl;

  // Update profile with new avatar URL
  await updateUserProfile({ avatarUrl });

  return avatarUrl;
};

// Delete avatar
export const deleteAvatar = async (): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to delete avatar');
  }

  const profile = await getUserProfile();
  if (!profile?.avatarUrl) {
    return; // No avatar to delete
  }

  // Extract file path from URL
  const url = new URL(profile.avatarUrl);
  const filePath = url.pathname.split('/').slice(-2).join('/'); // Get "avatars/filename"

  // Delete file from storage
  const { error: deleteError } = await supabase.storage
    .from('avatars')
    .remove([filePath]);

  if (deleteError) {
    console.error('Error deleting avatar from storage:', deleteError);
    // Continue anyway to clear the URL from profile
  }

  // Clear avatar URL from profile
  await updateUserProfile({ avatarUrl: null });
};

// Get user statistics and summary data
export const getUserStats = async () => {
  const user = await getCurrentUser();
  if (!user) {
    return {
      totalWorkouts: 0,
      totalVolume: 0,
      uniqueExercises: 0,
      memberSince: new Date(),
      currentStreak: 0,
      bodyWeightEntries: 0
    };
  }

  // Get workout stats
  const { data: workouts, error: workoutError } = await supabase
    .from('workouts')
    .select('exercise_name, reps, weight, date')
    .eq('user_id', user.id);

  if (workoutError) {
    console.error('Error fetching workout stats:', workoutError);
  }

  // Get body weight stats
  const { data: bodyWeights, error: bodyWeightError } = await supabase
    .from('body_weights')
    .select('date')
    .eq('user_id', user.id);

  if (bodyWeightError) {
    console.error('Error fetching body weight stats:', bodyWeightError);
  }

  // Get profile creation date
  const profile = await getUserProfile();

  const workoutData = workouts || [];
  const bodyWeightData = bodyWeights || [];

  const totalWorkouts = workoutData.length;
  const totalVolume = workoutData.reduce((sum, w) => sum + (w.reps * Number(w.weight)), 0);
  const uniqueExercises = new Set(workoutData.map(w => w.exercise_name)).size;
  const memberSince = profile ? new Date(profile.createdAt) : new Date();
  const bodyWeightEntries = bodyWeightData.length;

  // Calculate current streak (consecutive days with workouts)
  const workoutDates = [...new Set(workoutData.map(w => w.date))].sort().reverse();
  let currentStreak = 0;
  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  for (const dateStr of workoutDates) {
    const workoutDate = new Date(dateStr);
    workoutDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((checkDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === currentStreak) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (diffDays === currentStreak + 1 && currentStreak === 0) {
      // Allow for today not having a workout yet
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    totalWorkouts,
    totalVolume,
    uniqueExercises,
    memberSince,
    currentStreak,
    bodyWeightEntries
  };
};

// Delete user account and all associated data
export const deleteUserAccount = async (): Promise<void> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to delete account');
  }

  // Delete in order due to foreign key constraints
  const tables = ['user_exercises', 'body_weights', 'workouts', 'profiles'];
  
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('user_id', user.id);

    if (error && table !== 'profiles') {
      console.error(`Error deleting ${table}:`, error);
      throw new Error(`Failed to delete ${table}: ${error.message}`);
    }
  }

  // Delete profile separately (different column name)
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id);

  if (profileError) {
    console.error('Error deleting profile:', profileError);
    throw new Error(`Failed to delete profile: ${profileError.message}`);
  }

  // Delete avatar if exists
  try {
    await deleteAvatar();
  } catch (error) {
    // Avatar deletion is not critical
    console.warn('Could not delete avatar:', error);
  }

  // Finally delete the auth user
  const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
  
  if (authError) {
    console.error('Error deleting auth user:', authError);
    // This might fail if we don't have admin privileges, which is normal for client-side
    console.warn('Could not delete auth user from client side - this is normal');
  }
};

// Export user data
export const exportUserData = async () => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to export data');
  }

  // Get all user data
  const [profile, workouts, bodyWeights, userExercises] = await Promise.all([
    getUserProfile(),
    supabase.from('workouts').select('*').eq('user_id', user.id),
    supabase.from('body_weights').select('*').eq('user_id', user.id),
    supabase.from('user_exercises').select('*, exercise:exercises(*)').eq('user_id', user.id)
  ]);

  const exportData = {
    profile,
    workouts: workouts.data || [],
    bodyWeights: bodyWeights.data || [],
    userExercises: userExercises.data || [],
    exportedAt: new Date().toISOString(),
    exportVersion: '1.0'
  };

  return exportData;
};

// Subscribe to profile changes
export const subscribeToProfile = (callback: (profile: UserProfile | null) => void) => {
  return supabase
    .channel('profile-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles'
      },
      async () => {
        try {
          const profile = await getUserProfile();
          callback(profile);
        } catch (error) {
          console.error('Error refetching profile after change:', error);
        }
      }
    )
    .subscribe();
};