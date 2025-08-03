import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const { signIn, signUp, error, clearError } = useAuth();

  const validateForm = () => {
    setLocalError('');
    clearError();

    if (!email.trim()) {
      setLocalError('Email is required');
      return false;
    }

    if (!email.includes('@')) {
      setLocalError('Please enter a valid email');
      return false;
    }

    if (!password) {
      setLocalError('Password is required');
      return false;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setLocalError('');
    clearError();

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        setShowSuccess(true);
        // For signup, user is automatically signed in, no need to switch modes
      }
    } catch (err) {
      console.error('Auth error:', err);
      // Error is handled by the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setLocalError('');
    setShowSuccess(false);
    clearError();
    setEmail('');
    setPassword('');
  };

  const displayError = error || localError;

  return (
    <div className="screen">
      <div className="container">
        <div className="screen-header text-center">
          <h1 className="screen-title">💪 Workout Tracker</h1>
          <p className="screen-subtitle">
            {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <div className="screen-content max-w-md mx-auto">
          {/* Success Message for Signup */}
          {showSuccess && mode === 'signup' && (
            <div className="card mb-6" style={{ backgroundColor: 'var(--success-50)', borderColor: 'var(--success-200)' }}>
              <div className="card-body text-center">
                <div style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>✅</div>
                <div className="font-semibold text-success-600 mb-2">
                  Account created successfully!
                </div>
                <div className="text-sm text-success-700">
                  You're now signed in and ready to track workouts.
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {displayError && (
            <div className="card mb-6" style={{ backgroundColor: 'var(--red-50)', borderColor: 'var(--red-200)' }}>
              <div className="card-body text-center">
                <div style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>❌</div>
                <div className="font-semibold text-red-600">
                  {displayError}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </h2>
              </div>
              
              <div className="card-body space-y-6">
                {/* Email */}
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled={isSubmitting}
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                  <div className="text-sm text-gray-600 mt-1">
                    Minimum 6 characters
                  </div>
                </div>
              </div>

              <div className="card-footer">
                <button
                  type="submit"
                  className="btn btn-primary btn-large btn-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? (mode === 'signin' ? 'Signing In...' : 'Creating Account...') 
                    : (mode === 'signin' ? 'Sign In' : 'Create Account')
                  }
                </button>
              </div>
            </div>
          </form>

          {/* Mode Switch */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={switchMode}
              className="text-primary-600 hover:text-primary-700 underline"
              disabled={isSubmitting}
            >
              {mode === 'signin' 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>

          {/* Features Info */}
          <div className="card mt-6" style={{ backgroundColor: 'var(--gray-50)' }}>
            <div className="card-body text-center">
              <div className="text-sm text-gray-600">
                <div className="font-semibold mb-1">🔒 Simple & Secure</div>
                <div>No email verification required. Just sign up and start tracking!</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;