export interface WorkoutEntry {
  id: string;
  exerciseName: string;
  reps: number;
  weight: number;
  date: string; // ISO date string
  createdAt: string; // ISO timestamp
}

export interface BodyWeightEntry {
  id: string;
  weight: number;
  date: string; // ISO date string
  createdAt: string; // ISO timestamp
}

export interface ProgressDataPoint {
  date: string;
  value: number; // reps * weight
  exerciseName: string;
}

export interface AppState {
  workouts: WorkoutEntry[];
  bodyWeights: BodyWeightEntry[];
  exerciseLibrary: string[];
}

export type TabType = 'home' | 'add-workout' | 'progress' | 'profile';

export interface ExerciseStats {
  exerciseName: string;
  totalSessions: number;
  bestPerformance: number; // highest reps * weight
  averagePerformance: number;
  lastWorkout: string; // ISO date
}