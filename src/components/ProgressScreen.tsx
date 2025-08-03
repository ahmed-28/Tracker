import { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, Calendar, Activity, Weight, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { WorkoutEntry } from '../types';
import { getAllWorkouts } from '../services/workoutService';
import { getUniqueExerciseNames } from '../services/exerciseService';
import { getBodyWeightProgressData, getBodyWeightStats } from '../services/bodyWeightService';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export default function ProgressScreen() {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('all');
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'all'>('month');
  const [exercises, setExercises] = useState<string[]>([]);
  const [filteredData, setFilteredData] = useState<Array<{date: string, value: number, exerciseName: string}>>([]);
  const [weightData, setWeightData] = useState<Array<{date: string, value: number}>>([]);
  const [weightStats, setWeightStats] = useState<{
    currentWeight: number;
    initialWeight: number;
    weightChange: number;
    totalEntries: number;
    averageWeight: number;
  }>({ currentWeight: 0, initialWeight: 0, weightChange: 0, totalEntries: 0, averageWeight: 0 });

  const loadData = useCallback(async () => {
    try {
      const workoutData = await getAllWorkouts();
      setWorkouts(workoutData);
      
      const uniqueExercises = await getUniqueExerciseNames();
      setExercises(uniqueExercises);
      
      const weightProgressData = await getBodyWeightProgressData();
      setWeightData(weightProgressData);
      
      const stats = await getBodyWeightStats();
      setWeightStats(stats);
    } catch (error) {
      console.error('Error loading progress data:', error);
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

  useEffect(() => {
    const data = getFilteredData();
    setFilteredData(data);
    console.log('Filtered data updated:', {
      selectedExercise,
      timeFrame,
      totalWorkouts: workouts.length,
      filteredCount: data.length,
      data: data.slice(0, 3) // Log first 3 items for debugging
    });
  }, [workouts, selectedExercise, timeFrame]);

  const getFilteredWeightData = () => {
    if (timeFrame === 'all') {
      return weightData;
    }

    let daysBack = 0;
    
    if (timeFrame === 'week') {
      daysBack = 7;
    } else if (timeFrame === 'month') {
      daysBack = 30;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    cutoffDate.setHours(0, 0, 0, 0); // Start of day
    
    return weightData.filter(w => {
      const weightDate = new Date(w.date);
      weightDate.setHours(0, 0, 0, 0); // Start of day for comparison
      return weightDate >= cutoffDate;
    });
  };

  const getFilteredData = () => {
    let data = workouts;
    
    if (selectedExercise !== 'all') {
      data = data.filter(w => w.exerciseName.toLowerCase() === selectedExercise.toLowerCase());
    }
    
    if (timeFrame !== 'all') {
      let daysBack = 0;
      
      if (timeFrame === 'week') {
        daysBack = 7;
      } else if (timeFrame === 'month') {
        daysBack = 30;
      }
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);
      cutoffDate.setHours(0, 0, 0, 0); // Start of day
      
      data = data.filter(w => {
        const workoutDate = new Date(w.date);
        workoutDate.setHours(0, 0, 0, 0); // Start of day for comparison
        return workoutDate >= cutoffDate;
      });
    }
    
    return data
      .map(w => ({
        date: w.date,
        value: w.reps * w.weight,
        exerciseName: w.exerciseName
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getStats = (data: typeof filteredData) => {
    if (data.length === 0) {
      return {
        totalSessions: 0,
        averageVolume: 0,
        bestPerformance: 0,
        totalVolume: 0
      };
    }
    
    const totalVolume = data.reduce((sum, d) => sum + d.value, 0);
    const averageVolume = totalVolume / data.length;
    const bestPerformance = Math.max(...data.map(d => d.value));
    
    return {
      totalSessions: data.length,
      averageVolume,
      bestPerformance,
      totalVolume
    };
  };

  const stats = getStats(filteredData);

  const chartConfig = {
    value: {
      label: selectedExercise !== 'all' ? `${selectedExercise} Volume` : 'Volume',
    },
  };

  const weightChartConfig = {
    value: {
      label: 'Weight (lbs)',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-4 pb-20">
      <div className="container mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <BarChart3 className="h-8 w-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Progress Tracking
            </h1>
          </div>
          <p className="text-xl text-slate-600">
            Track your performance and body weight over time
          </p>
        </div>

        {workouts.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12">
              <div className="text-center text-slate-500">
                <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-700 mb-3">No data yet</h3>
                <p className="text-lg text-slate-500 mb-6">
                  Start logging workouts to see your progress charts and statistics.
                </p>
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Activity className="h-4 w-4 mr-2" />
                  Log Your First Workout
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Filters Card */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader className="border-b bg-white/50">
                <CardTitle className="flex items-center gap-2 text-slate-700">
                  <Target className="h-5 w-5" />
                  Filters
                </CardTitle>
                <CardDescription>
                  Customize your view by exercise and time period
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Exercise Filter */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Exercise</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={selectedExercise}
                    onChange={(e) => setSelectedExercise(e.target.value)}
                  >
                    <option value="all">All Exercises</option>
                    {exercises.map(exercise => (
                      <option key={exercise} value={exercise}>{exercise}</option>
                    ))}
                  </select>
                </div>

                {/* Time Frame Filter */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-3 block">Time Frame</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['week', 'month', 'all'] as const).map(frame => (
                      <Button
                        key={frame}
                        variant={timeFrame === frame ? "default" : "outline"}
                        className={timeFrame === frame 
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" 
                          : "hover:bg-purple-50 hover:border-purple-200"
                        }
                        onClick={() => setTimeFrame(frame)}
                      >
                        {frame === 'week' ? '7 Days' : frame === 'month' ? '30 Days' : 'All Time'}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-blue-600 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-blue-700 mb-1">{stats.totalSessions}</div>
                  <div className="text-sm font-medium text-blue-600">Sessions</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-green-600 rounded-full flex items-center justify-center">
                    <Weight className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-green-700 mb-1">{stats.totalVolume.toLocaleString()}</div>
                  <div className="text-sm font-medium text-green-600">Total Volume</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-orange-600 rounded-full flex items-center justify-center">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-orange-700 mb-1">{Math.round(stats.averageVolume)}</div>
                  <div className="text-sm font-medium text-orange-600">Avg Volume</div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-purple-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-purple-700 mb-1">{stats.bestPerformance}</div>
                  <div className="text-sm font-medium text-purple-600">Best Performance</div>
                </CardContent>
              </Card>
            </div>

            {/* Workout Volume Chart */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-slate-50/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-700">
                  <TrendingUp className="h-5 w-5" />
                  Volume Over Time
                  {selectedExercise !== 'all' && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedExercise}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Track your workout volume progression
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {filteredData.length > 0 ? (
                  <ChartContainer
                    config={chartConfig}
                    className="h-80 w-full"
                  >
                    <LineChart data={filteredData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.15} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        axisLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                        tickLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                        tickLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                      />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={{ fill: "#6366f1", strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, stroke: "#6366f1", strokeWidth: 2, fill: "#ffffff" }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="font-medium text-slate-700 mb-2">No data for selected filters</h3>
                    <p className="text-sm text-slate-500">
                      Try adjusting your filters or add more workout data.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weight Tracking Chart */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b bg-slate-50/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-700">
                  <Weight className="h-5 w-5" />
                  Weight Over Time
                </CardTitle>
                <CardDescription>
                  Monitor your body weight progression
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {getFilteredWeightData().length > 0 ? (
                  <div className="space-y-6">
                    <ChartContainer
                      config={weightChartConfig}
                      className="h-80 w-full"
                    >
                      <LineChart data={getFilteredWeightData()} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.15} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          axisLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                          tickLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                          tickLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, stroke: "#10b981", strokeWidth: 2, fill: "#ffffff" }}
                          connectNulls={false}
                        />
                      </LineChart>
                    </ChartContainer>
                    
                    {/* Weight Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-700 mb-1">
                            {weightStats.currentWeight > 0 ? `${weightStats.currentWeight.toFixed(1)} lbs` : 'N/A'}
                          </div>
                          <div className="text-sm font-medium text-blue-600">Current Weight</div>
                        </CardContent>
                      </Card>
                      
                      <Card className={`border-0 shadow-md ${weightStats.weightChange >= 0 
                        ? 'bg-gradient-to-br from-green-50 to-green-100' 
                        : 'bg-gradient-to-br from-red-50 to-red-100'
                      }`}>
                        <CardContent className="p-4 text-center">
                          <div className={`text-2xl font-bold mb-1 ${
                            weightStats.weightChange >= 0 ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {weightStats.weightChange !== 0 ? 
                              `${weightStats.weightChange >= 0 ? '+' : ''}${weightStats.weightChange.toFixed(1)} lbs` : 
                              'N/A'
                            }
                          </div>
                          <div className={`text-sm font-medium ${
                            weightStats.weightChange >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            Weight Change
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                      <Weight className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="font-medium text-slate-700 mb-2">No weight data yet</h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Start tracking your weight in the Profile section to see your progress over time.
                    </p>
                    <Button variant="outline" className="hover:bg-purple-50 hover:border-purple-200">
                      <Weight className="h-4 w-4 mr-2" />
                      Track Weight
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}