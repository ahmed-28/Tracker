import { useState, useEffect, useCallback } from 'react';
import { Plus, TrendingUp, Dumbbell, X, Activity, Calendar } from 'lucide-react';
import { WorkoutEntry, TabType } from '../types';
import { getRecentWorkouts } from '../services/workoutService';
import { getExerciseLibrary, addExerciseToLibrary, removeExerciseFromLibrary } from '../services/exerciseService';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface HomeScreenProps {
  onNavigate?: (tab: TabType) => void;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutEntry[]>([]);
  const [todaysWorkouts, setTodaysWorkouts] = useState<WorkoutEntry[]>([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [exerciseLibrary, setExerciseLibrary] = useState<string[]>([]);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [showExerciseError, setShowExerciseError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const recent = await getRecentWorkouts(5);
      const today = new Date().toISOString().split('T')[0];
      const todayWorkouts = recent.filter(w => w.date === today);
      const weeklyVolume = recent.reduce((sum, w) => sum + (w.reps * w.weight), 0);

      setRecentWorkouts(recent);
      setTodaysWorkouts(todayWorkouts);
      setTotalVolume(weeklyVolume);
      
      // Load exercise library
      const library = await getExerciseLibrary();
      setExerciseLibrary(library);
    } catch (error) {
      console.error('Error loading home screen data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set up real-time subscriptions
  useRealtimeSync({
    onWorkoutsChange: loadData,
    onExercisesChange: loadData,
  });

  const handleAddExercise = async () => {
    if (!newExerciseName.trim()) {
      setShowExerciseError('Exercise name is required');
      return;
    }
    
    if (exerciseLibrary.some(ex => ex.toLowerCase() === newExerciseName.trim().toLowerCase())) {
      setShowExerciseError('Exercise already exists');
      return;
    }
    
    try {
      await addExerciseToLibrary(newExerciseName.trim());
      const updatedLibrary = await getExerciseLibrary();
      setExerciseLibrary(updatedLibrary);
      setNewExerciseName('');
      setShowExerciseError('');
    } catch (error) {
      console.error('Error adding exercise:', error);
      setShowExerciseError('Failed to add exercise. Please try again.');
    }
  };

  const handleRemoveExercise = async (exerciseName: string) => {
    try {
      const success = await removeExerciseFromLibrary(exerciseName);
      if (success) {
        const updatedLibrary = await getExerciseLibrary();
        setExerciseLibrary(updatedLibrary);
      } else {
        alert('Cannot delete this exercise as it is used in your workout history.');
      }
    } catch (error) {
      console.error('Error removing exercise:', error);
      alert('Failed to remove exercise. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 pb-20">
      <div className="container mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Dumbbell className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Workout Tracker
            </h1>
          </div>
          <p className="text-xl text-slate-600">
            {todaysWorkouts.length > 0 
              ? `🎉 ${todaysWorkouts.length} exercises completed today!`
              : "Ready to crush your workout? 💪"
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-full">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{todaysWorkouts.length}</p>
                  <p className="text-sm font-medium text-blue-600">Today's Exercises</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-600 rounded-full">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{totalVolume.toLocaleString()}</p>
                  <p className="text-sm font-medium text-green-600">Weekly Volume</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="cursor-pointer group hover:shadow-lg transition-all border-0 shadow-md bg-gradient-to-r from-orange-50 to-red-50"
                onClick={() => onNavigate?.('add-workout')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-600 rounded-full group-hover:bg-orange-700 transition-colors">
                  <Dumbbell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-700 mb-1">Add Exercise</h3>
                  <p className="text-sm text-orange-600">Log your workout session</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer group hover:shadow-lg transition-all border-0 shadow-md bg-gradient-to-r from-purple-50 to-pink-50"
                onClick={() => onNavigate?.('add-workout')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-600 rounded-full group-hover:bg-purple-700 transition-colors">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-700 mb-1">Track Weight</h3>
                  <p className="text-sm text-purple-600">Update body weight</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exercise Library Management */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <Dumbbell className="h-5 w-5" />
              Exercise Library
            </CardTitle>
            <CardDescription>
              Manage your exercise collection
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Add New Exercise */}
              <div>
                <div className="flex gap-3">
                  <Input
                    type="text"
                    className={`flex-1 ${showExerciseError ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                    value={newExerciseName}
                    onChange={(e) => {
                      setNewExerciseName(e.target.value);
                      setShowExerciseError('');
                    }}
                    placeholder="Add new exercise (e.g. Bench Press)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddExercise();
                      }
                    }}
                  />
                  <Button onClick={handleAddExercise} className="px-6">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                {showExerciseError && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <X className="h-4 w-4" />
                    {showExerciseError}
                  </p>
                )}
              </div>

              <Separator />

              {/* Exercise List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-slate-700">Your Exercises</h3>
                  <Badge variant="secondary" className="text-xs">
                    {exerciseLibrary.length} total
                  </Badge>
                </div>
                
                {exerciseLibrary.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                      <Dumbbell className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="font-medium text-slate-700 mb-2">No exercises added yet</h3>
                    <p className="text-sm text-slate-500">Add some exercises to start logging workouts!</p>
                  </div>
                ) : (
                  <div className="grid gap-3 max-h-64 overflow-y-auto pr-2">
                    {exerciseLibrary.map((exercise) => (
                      <div
                        key={exercise}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors"
                      >
                        <span className="font-medium text-slate-700">{exercise}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveExercise(exercise)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Delete exercise"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <Calendar className="h-5 w-5" />
              Recent Workouts
            </CardTitle>
            <CardDescription>
              Your latest training sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {recentWorkouts.length > 0 ? (
              <div className="space-y-3">
                {recentWorkouts.map((workout) => (
                  <div key={workout.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Dumbbell className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">{workout.exerciseName}</p>
                        <p className="text-sm text-slate-500">
                          {workout.reps} reps × {workout.weight}kg • {formatDate(workout.date)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-semibold">
                      {(workout.reps * workout.weight).toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="font-medium text-slate-700 mb-2">No workouts yet</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Start by adding your first exercise to begin tracking your progress.
                </p>
                <Button onClick={() => onNavigate?.('add-workout')} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Workout
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}