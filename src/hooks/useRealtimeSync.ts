import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

interface RealtimeSyncHookParams {
  onWorkoutsChange?: () => void;
  onBodyWeightsChange?: () => void;
  onExercisesChange?: () => void;
  onProfileChange?: () => void;
}

export const useRealtimeSync = ({
  onWorkoutsChange,
  onBodyWeightsChange,
  onExercisesChange,
  onProfileChange,
}: RealtimeSyncHookParams = {}) => {
  const { user } = useAuth();
  const channelsRef = useRef<RealtimeChannel[]>([]);

  useEffect(() => {
    if (!user) {
      // Clean up existing subscriptions when user logs out
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
      return;
    }

    // Subscribe to workouts changes
    if (onWorkoutsChange) {
      const workoutsChannel = supabase
        .channel(`workouts-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'workouts',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Workouts change detected:', payload);
            onWorkoutsChange();
          }
        )
        .subscribe();

      channelsRef.current.push(workoutsChannel);
    }

    // Subscribe to body weights changes
    if (onBodyWeightsChange) {
      const bodyWeightsChannel = supabase
        .channel(`body-weights-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'body_weights',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Body weights change detected:', payload);
            onBodyWeightsChange();
          }
        )
        .subscribe();

      channelsRef.current.push(bodyWeightsChannel);
    }

    // Subscribe to user exercises changes
    if (onExercisesChange) {
      const exercisesChannel = supabase
        .channel(`user-exercises-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_exercises',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('User exercises change detected:', payload);
            onExercisesChange();
          }
        )
        .subscribe();

      channelsRef.current.push(exercisesChannel);
    }

    // Subscribe to profile changes
    if (onProfileChange) {
      const profileChannel = supabase
        .channel(`profile-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          (payload) => {
            console.log('Profile change detected:', payload);
            onProfileChange();
          }
        )
        .subscribe();

      channelsRef.current.push(profileChannel);
    }

    // Cleanup function
    return () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [user, onWorkoutsChange, onBodyWeightsChange, onExercisesChange, onProfileChange]);

  // Return cleanup function for manual cleanup if needed
  const cleanup = () => {
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];
  };

  return { cleanup };
};