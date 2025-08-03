-- Workout Tracker Database Schema for Supabase
-- Run these SQL commands in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Exercises table (global exercise library)
CREATE TABLE public.exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on exercises (read-only for all authenticated users)
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view exercises" ON public.exercises
  FOR SELECT TO authenticated USING (true);

-- User exercises table (user-specific exercise preferences)
CREATE TABLE public.user_exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  custom_name TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

-- Enable RLS on user_exercises
ALTER TABLE public.user_exercises ENABLE ROW LEVEL SECURITY;

-- User exercises policies
CREATE POLICY "Users can manage own exercise preferences" ON public.user_exercises
  FOR ALL USING (auth.uid() = user_id);

-- Workouts table
CREATE TABLE public.workouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  reps INTEGER NOT NULL CHECK (reps > 0),
  weight DECIMAL(5,2) NOT NULL CHECK (weight > 0),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on workouts
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Workouts policies
CREATE POLICY "Users can view own workouts" ON public.workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts" ON public.workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts" ON public.workouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts" ON public.workouts
  FOR DELETE USING (auth.uid() = user_id);

-- Body weights table
CREATE TABLE public.body_weights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weight DECIMAL(5,2) NOT NULL CHECK (weight > 0),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date) -- Only one weight entry per user per day
);

-- Enable RLS on body_weights
ALTER TABLE public.body_weights ENABLE ROW LEVEL SECURITY;

-- Body weights policies
CREATE POLICY "Users can view own body weights" ON public.body_weights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own body weights" ON public.body_weights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own body weights" ON public.body_weights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own body weights" ON public.body_weights
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX idx_workouts_date ON public.workouts(date DESC);
CREATE INDEX idx_workouts_exercise_name ON public.workouts(exercise_name);
CREATE INDEX idx_body_weights_user_id ON public.body_weights(user_id);
CREATE INDEX idx_body_weights_date ON public.body_weights(date DESC);
CREATE INDEX idx_user_exercises_user_id ON public.user_exercises(user_id);

-- Function to handle user creation (creates profile when user signs up)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_exercises
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.body_weights
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert some common exercises into the global library
INSERT INTO public.exercises (name, category) VALUES
  ('Push-ups', 'Bodyweight'),
  ('Pull-ups', 'Bodyweight'),
  ('Squats', 'Legs'),
  ('Deadlifts', 'Back'),
  ('Bench Press', 'Chest'),
  ('Overhead Press', 'Shoulders'),
  ('Barbell Rows', 'Back'),
  ('Dips', 'Chest'),
  ('Lunges', 'Legs'),
  ('Planks', 'Core'),
  ('Burpees', 'Full Body'),
  ('Mountain Climbers', 'Core'),
  ('Jumping Jacks', 'Cardio'),
  ('Russian Twists', 'Core'),
  ('Wall Sits', 'Legs')
ON CONFLICT (name) DO NOTHING;