import { useState, useEffect, useCallback } from 'react';
import { User, Award, TrendingUp, Activity, Dumbbell, Weight, Calendar, Info, LogOut, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserStats, getUserProfile } from '../services/profileService';
import { getLatestBodyWeight } from '../services/bodyWeightService';
import { clearAllUserData } from '../services/dataService';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [uniqueExercises, setUniqueExercises] = useState(0);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [workoutStreak, setWorkoutStreak] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clearingData, setClearingData] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load user stats
      const stats = await getUserStats();
      setTotalWorkouts(stats.totalWorkouts);
      setTotalVolume(stats.totalVolume);
      setUniqueExercises(stats.uniqueExercises);
      setWorkoutStreak(stats.currentStreak);
      
      // Load user profile
      const profile = await getUserProfile();
      setUserProfile(profile);
      
      // Load latest body weight
      const latestBodyWeight = await getLatestBodyWeight();
      setLatestWeight(latestBodyWeight?.weight || null);
      
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set up real-time subscriptions
  useRealtimeSync({
    onWorkoutsChange: loadData,
    onBodyWeightsChange: loadData,
    onProfileChange: loadData,
  });

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('Are you sure you want to clear all your data? This action cannot be undone and will delete all your workouts, body weight entries, and exercise data.')) {
      return;
    }

    try {
      setClearingData(true);
      await clearAllUserData();
      // Reload data to reflect the cleared state
      await loadData();
      alert('All data has been cleared successfully.');
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Failed to clear data. Please try again.');
    } finally {
      setClearingData(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 pb-20">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center min-h-96">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
                  <div className="text-lg font-semibold text-slate-700">Loading profile...</div>
                  <p className="text-sm text-slate-500 mt-2">Fetching your fitness journey data</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 pb-20">
      <div className="container mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <User className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Profile
            </h1>
          </div>
          <p className="text-xl text-slate-600">
            {userProfile?.fullName || user?.email || 'Your fitness journey overview'}
          </p>
        </div>

        {/* Profile Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="p-3 bg-blue-600 rounded-full w-fit mx-auto mb-3">
                  <Dumbbell className="h-6 w-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-blue-700 mb-1">{totalWorkouts}</p>
                <p className="text-sm font-medium text-blue-600">Total Workouts</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="p-3 bg-green-600 rounded-full w-fit mx-auto mb-3">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-green-700 mb-1">{uniqueExercises}</p>
                <p className="text-sm font-medium text-green-600">Unique Exercises</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="p-3 bg-orange-600 rounded-full w-fit mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-orange-700 mb-1">{totalVolume.toLocaleString()}</p>
                <p className="text-sm font-medium text-orange-600">Total Volume (kg)</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="p-3 bg-purple-600 rounded-full w-fit mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <p className="text-2xl font-bold text-purple-700 mb-1">{workoutStreak}</p>
                <p className="text-sm font-medium text-purple-600">Day Streak</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Stats */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <TrendingUp className="h-5 w-5" />
              Current Stats
            </CardTitle>
            <CardDescription>
              Your latest fitness metrics and progress
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Weight className="h-5 w-5 text-slate-600" />
                  <span className="text-slate-700 font-medium">Latest Body Weight</span>
                </div>
                <Badge variant={latestWeight ? "default" : "secondary"} className="font-semibold">
                  {latestWeight ? `${latestWeight} kg` : 'Not recorded'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-slate-600" />
                  <span className="text-slate-700 font-medium">Average Volume per Workout</span>
                </div>
                <Badge variant="outline" className="font-semibold">
                  {totalWorkouts > 0 ? Math.round(totalVolume / totalWorkouts) : 0} kg
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-slate-600" />
                  <span className="text-slate-700 font-medium">Current Streak</span>
                </div>
                <Badge variant="outline" className="font-semibold">
                  {workoutStreak} {workoutStreak === 1 ? 'day' : 'days'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* App Info */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <Info className="h-5 w-5" />
              About
            </CardTitle>
            <CardDescription>
              Application information and version details
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Version</span>
                <Badge variant="outline">v2.0</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Built with</span>
                <span className="text-sm font-medium text-slate-700">React + Vite + Supabase</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Data sync</span>
                <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">Signed in as</span>
                <span className="text-sm font-medium text-slate-700">{user?.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Management */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <LogOut className="h-5 w-5" />
              Account Management
            </CardTitle>
            <CardDescription>
              Manage your account settings and sign out
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-slate-600">
                Sign out of your account. Your data will remain safely stored and synced across devices.
              </p>
              <Separator />
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
                <Button
                  onClick={handleClearAllData}
                  disabled={clearingData}
                  variant="outline"
                  className="border-red-300 text-red-800 hover:bg-red-100 hover:text-red-900 hover:border-red-400"
                >
                  {clearingData ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {clearingData ? 'Clearing...' : 'Clear All Data'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}