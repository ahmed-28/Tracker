import { AppState } from '../types';
import { addWorkoutEntry } from './workoutService';
import { addBodyWeightEntry } from './bodyWeightService';
import { addExerciseToLibrary } from './exerciseService';
import { getCurrentUser } from './supabase';

const STORAGE_KEY = 'workout-tracker-data';
const MIGRATION_KEY = 'workout-tracker-migrated';

export interface MigrationResult {
  success: boolean;
  workoutsMigrated: number;
  bodyWeightsMigrated: number;
  exercisesMigrated: number;
  errors: string[];
}

export const checkIfMigrationNeeded = (): boolean => {
  // Check if user has already migrated
  const migrated = localStorage.getItem(MIGRATION_KEY);
  if (migrated) {
    return false;
  }

  // Check if there's localStorage data to migrate
  const stored = localStorage.getItem(STORAGE_KEY);
  return !!stored;
};

export const getLocalStorageData = (): AppState | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading localStorage data:', error);
  }
  
  return null;
};

export const migrateLocalStorageData = async (): Promise<MigrationResult> => {
  const result: MigrationResult = {
    success: false,
    workoutsMigrated: 0,
    bodyWeightsMigrated: 0,
    exercisesMigrated: 0,
    errors: []
  };

  try {
    // Check if user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to migrate data');
    }

    const localData = getLocalStorageData();
    if (!localData) {
      throw new Error('No localStorage data found to migrate');
    }

    console.log('Starting migration for user:', user.email);
    console.log('Local data found:', {
      workouts: localData.workouts?.length || 0,
      bodyWeights: localData.bodyWeights?.length || 0,
      exercises: localData.exerciseLibrary?.length || 0
    });

    // Migrate exercises first (needed for workouts)
    if (localData.exerciseLibrary && localData.exerciseLibrary.length > 0) {
      for (const exerciseName of localData.exerciseLibrary) {
        try {
          await addExerciseToLibrary(exerciseName);
          result.exercisesMigrated++;
        } catch (error) {
          console.error(`Error migrating exercise "${exerciseName}":`, error);
          result.errors.push(`Failed to migrate exercise: ${exerciseName}`);
        }
      }
    }

    // Migrate workouts
    if (localData.workouts && localData.workouts.length > 0) {
      for (const workout of localData.workouts) {
        try {
          await addWorkoutEntry({
            exerciseName: workout.exerciseName,
            reps: workout.reps,
            weight: workout.weight,
            date: workout.date
          });
          result.workoutsMigrated++;
        } catch (error) {
          console.error('Error migrating workout:', workout, error);
          result.errors.push(`Failed to migrate workout: ${workout.exerciseName} on ${workout.date}`);
        }
      }
    }

    // Migrate body weights
    if (localData.bodyWeights && localData.bodyWeights.length > 0) {
      for (const bodyWeight of localData.bodyWeights) {
        try {
          await addBodyWeightEntry({
            weight: bodyWeight.weight,
            date: bodyWeight.date
          });
          result.bodyWeightsMigrated++;
        } catch (error) {
          console.error('Error migrating body weight:', bodyWeight, error);
          result.errors.push(`Failed to migrate body weight: ${bodyWeight.weight}kg on ${bodyWeight.date}`);
        }
      }
    }

    // Mark migration as completed
    localStorage.setItem(MIGRATION_KEY, JSON.stringify({
      migratedAt: new Date().toISOString(),
      userId: user.id,
      dataMovedToSupabase: true
    }));

    result.success = true;
    console.log('Migration completed successfully:', result);

  } catch (error) {
    console.error('Migration failed:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown migration error');
  }

  return result;
};

export const clearLocalStorageAfterMigration = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('localStorage data cleared after successful migration');
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

export const resetMigrationFlag = (): void => {
  try {
    localStorage.removeItem(MIGRATION_KEY);
    console.log('Migration flag reset');
  } catch (error) {
    console.error('Error resetting migration flag:', error);
  }
};

// Get migration status for UI display
export const getMigrationStatus = () => {
  const migrated = localStorage.getItem(MIGRATION_KEY);
  if (migrated) {
    try {
      return JSON.parse(migrated);
    } catch {
      return { migratedAt: 'unknown', dataMovedToSupabase: true };
    }
  }
  return null;
};

// Auto-migration helper for seamless UX
export const performAutoMigrationIfNeeded = async (): Promise<MigrationResult | null> => {
  if (!checkIfMigrationNeeded()) {
    return null;
  }

  console.log('Auto-migration needed, starting...');
  const result = await migrateLocalStorageData();
  
  if (result.success && result.errors.length === 0) {
    // Only clear localStorage if migration was completely successful
    clearLocalStorageAfterMigration();
    console.log('Auto-migration completed successfully and localStorage cleared');
  }

  return result;
};