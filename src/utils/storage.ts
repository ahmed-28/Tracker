import { AppState, WorkoutEntry, BodyWeightEntry } from '../types';

const STORAGE_KEY = 'workout-tracker-data';

export const loadAppState = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading app state:', error);
  }
  
  return {
    workouts: [],
    bodyWeights: [],
    exerciseLibrary: []
  };
};

export const saveAppState = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving app state:', error);
  }
};

export const normalizeExerciseName = (name: string): string => {
  return name.trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const addWorkoutEntry = (entry: Omit<WorkoutEntry, 'id' | 'createdAt'>): WorkoutEntry => {
  const newEntry: WorkoutEntry = {
    ...entry,
    exerciseName: normalizeExerciseName(entry.exerciseName),
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };

  const state = loadAppState();
  state.workouts.push(newEntry);
  saveAppState(state);
  
  return newEntry;
};

export const addBodyWeightEntry = (entry: Omit<BodyWeightEntry, 'id' | 'createdAt'>): BodyWeightEntry => {
  const newEntry: BodyWeightEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };

  const state = loadAppState();
  state.bodyWeights.push(newEntry);
  saveAppState(state);
  
  return newEntry;
};

export const getRecentWorkouts = (limit: number = 10): WorkoutEntry[] => {
  const state = loadAppState();
  return state.workouts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
};

export const getProgressData = (exerciseName?: string): Array<{date: string, value: number}> => {
  const state = loadAppState();
  let workouts = state.workouts;
  
  if (exerciseName) {
    workouts = workouts.filter(w => w.exerciseName.toLowerCase() === exerciseName.toLowerCase());
  }
  
  return workouts
    .map(w => ({
      date: w.date,
      value: w.reps * w.weight
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const getUniqueExerciseNames = (): string[] => {
  const state = loadAppState();
  return state.exerciseLibrary || [];
};

export const getExerciseSuggestions = (input: string): string[] => {
  const uniqueExercises = getUniqueExerciseNames();
  if (!input.trim()) return uniqueExercises.slice(0, 10); // Show first 10 if no input
  
  const normalizedInput = input.toLowerCase();
  return uniqueExercises
    .filter(exercise => exercise.toLowerCase().includes(normalizedInput))
    .slice(0, 10); // Limit to 10 suggestions
};

// Exercise Library Management
export const getExerciseLibrary = (): string[] => {
  const state = loadAppState();
  return state.exerciseLibrary || [];
};

export const addExerciseToLibrary = (exerciseName: string): void => {
  const state = loadAppState();
  const normalizedName = normalizeExerciseName(exerciseName);
  
  if (normalizedName.trim() && !state.exerciseLibrary.includes(normalizedName)) {
    state.exerciseLibrary.push(normalizedName);
    state.exerciseLibrary.sort();
    saveAppState(state);
  }
};

export const removeExerciseFromLibrary = (exerciseName: string): boolean => {
  const state = loadAppState();
  const index = state.exerciseLibrary.indexOf(exerciseName);
  
  if (index > -1) {
    // Check if this exercise is used in any workouts
    const isUsed = state.workouts.some(w => w.exerciseName === exerciseName);
    if (isUsed) {
      return false; // Cannot delete exercise that's in use
    }
    
    state.exerciseLibrary.splice(index, 1);
    saveAppState(state);
    return true;
  }
  return false;
};

export const migrateExerciseNames = (): void => {
  const state = loadAppState();
  let hasChanges = false;
  
  // Normalize all existing workout exercise names
  state.workouts = state.workouts.map(workout => {
    const normalizedName = normalizeExerciseName(workout.exerciseName);
    if (normalizedName !== workout.exerciseName) {
      hasChanges = true;
      return { ...workout, exerciseName: normalizedName };
    }
    return workout;
  });
  
  // Populate exercise library with existing exercises if it's empty
  if (!state.exerciseLibrary || state.exerciseLibrary.length === 0) {
    const uniqueExercises = [...new Set(state.workouts.map(w => w.exerciseName))].sort();
    state.exerciseLibrary = uniqueExercises;
    hasChanges = true;
    console.log('Exercise library populated with existing exercises');
  }
  
  if (hasChanges) {
    saveAppState(state);
    console.log('Exercise names have been normalized');
  }
};

export const clearAllData = (): void => {
  localStorage.removeItem('workout-tracker-data');
  console.log('All data cleared');
};