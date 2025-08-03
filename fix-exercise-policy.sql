-- Fix RLS policy to allow users to create new exercises
-- Run this in your Supabase SQL Editor

-- Add INSERT policy for exercises table
CREATE POLICY "Authenticated users can create exercises" ON public.exercises
  FOR INSERT TO authenticated WITH CHECK (true);

-- Add UPDATE policy for exercises (in case needed later)
CREATE POLICY "Authenticated users can update exercises" ON public.exercises
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);