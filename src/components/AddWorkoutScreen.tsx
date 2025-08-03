import { useState, useEffect } from 'react';
import { addWorkoutEntry } from '../services/workoutService';
import { addBodyWeightEntry } from '../services/bodyWeightService';
import { getExerciseLibrary } from '../services/exerciseService';

export default function AddWorkoutScreen() {
  const [mode, setMode] = useState<'exercise' | 'weight'>('exercise');
  const [exerciseName, setExerciseName] = useState('');
  const [reps, setReps] = useState(8);
  const [weight, setWeight] = useState(20);
  const [bodyWeight, setBodyWeight] = useState(70);
  const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [weightDate, setWeightDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [exerciseLibrary, setExerciseLibrary] = useState<string[]>([]);

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const library = await getExerciseLibrary();
        setExerciseLibrary(library);
      } catch (error) {
        console.error('Error loading exercise library:', error);
      }
    };
    
    loadExercises();
  }, []);

  const validateExerciseForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!exerciseName) {
      newErrors.exerciseName = 'Please select an exercise';
    }
    
    if (reps < 1 || reps > 100) {
      newErrors.reps = 'Reps must be between 1 and 100';
    }
    
    if (weight < 0.5 || weight > 500) {
      newErrors.weight = 'Weight must be between 0.5 and 500 kg';
    }

    if (!workoutDate) {
      newErrors.workoutDate = 'Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateWeightForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (bodyWeight < 30 || bodyWeight > 300) {
      newErrors.bodyWeight = 'Weight must be between 30 and 300 kg';
    }

    if (!weightDate) {
      newErrors.weightDate = 'Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleExerciseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateExerciseForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await addWorkoutEntry({
        exerciseName: exerciseName,
        reps,
        weight,
        date: workoutDate
      });
      
      setShowSuccess(true);
      setExerciseName('');
      setReps(8);
      setWeight(20);
      
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving workout:', error);
      setErrors({ general: 'Failed to save workout. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateWeightForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await addBodyWeightEntry({
        weight: bodyWeight,
        date: weightDate
      });
      
      setShowSuccess(true);
      
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving body weight:', error);
      setErrors({ general: 'Failed to save body weight. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="screen">
      <div className="container">
        <div className="screen-header">
          <h1 className="screen-title">Add Entry</h1>
          <p className="screen-subtitle">Log your workout or update your weight</p>
        </div>

        <div className="screen-content">
          {/* Mode Toggle */}
          <div className="card mb-6">
            <div className="card-body">
              <div className="grid grid-cols-2 gap-4">
                <button
                  className={`btn ${mode === 'exercise' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMode('exercise')}
                >
                  💪 Exercise
                </button>
                <button
                  className={`btn ${mode === 'weight' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMode('weight')}
                >
                  ⚖️ Body Weight
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errors.general && (
            <div className="card mb-6" style={{ backgroundColor: 'var(--red-50)', borderColor: 'var(--red-200)' }}>
              <div className="card-body text-center">
                <div style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>❌</div>
                <div className="font-semibold text-red-600">
                  {errors.general}
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {showSuccess && (
            <div className="card mb-6" style={{ backgroundColor: 'var(--success-50)', borderColor: 'var(--success-200)' }}>
              <div className="card-body text-center">
                <div style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>✅</div>
                <div className="font-semibold text-success-600">
                  {mode === 'exercise' ? 'Exercise logged successfully!' : 'Weight updated successfully!'}
                </div>
              </div>
            </div>
          )}

          {/* Exercise Form */}
          {mode === 'exercise' && (
            <form onSubmit={handleExerciseSubmit}>
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold">Log Exercise</h2>
                </div>
                <div className="card-body space-y-6">
                  {/* Date */}
                  <div className="form-group">
                    <label htmlFor="workoutDate" className="form-label">
                      Date
                    </label>
                    <input
                      type="date"
                      id="workoutDate"
                      className={`form-input ${errors.workoutDate ? 'error' : ''}`}
                      value={workoutDate}
                      onChange={(e) => setWorkoutDate(e.target.value)}
                      disabled={isSubmitting}
                    />
                    {errors.workoutDate && (
                      <div className="form-error">{errors.workoutDate}</div>
                    )}
                  </div>

                  {/* Exercise Name */}
                  <div className="form-group">
                    <label htmlFor="exerciseName" className="form-label">
                      Exercise Name
                    </label>
                    {exerciseLibrary.length > 0 ? (
                      <select
                        id="exerciseName"
                        className={`form-input ${errors.exerciseName ? 'error' : ''}`}
                        value={exerciseName}
                        onChange={(e) => setExerciseName(e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Select an exercise...</option>
                        {exerciseLibrary.map((exercise) => (
                          <option key={exercise} value={exercise}>
                            {exercise}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-center py-4">
                        <div className="text-gray-500 mb-2">
                          No exercises in your library yet!
                        </div>
                        <div className="text-sm text-gray-600">
                          Go to Profile → Exercise Library to add some exercises first.
                        </div>
                      </div>
                    )}
                    {errors.exerciseName && (
                      <div className="form-error">{errors.exerciseName}</div>
                    )}
                  </div>

                  {/* Reps */}
                  <div className="form-group">
                    <label htmlFor="reps" className="form-label">
                      Reps
                    </label>
                    <input
                      type="number"
                      id="reps"
                      className={`form-input ${errors.reps ? 'error' : ''}`}
                      value={reps}
                      onChange={(e) => setReps(parseInt(e.target.value) || 0)}
                      min={1}
                      max={100}
                      placeholder="8"
                      disabled={isSubmitting}
                    />
                    {errors.reps && (
                      <div className="form-error">{errors.reps}</div>
                    )}
                  </div>

                  {/* Weight */}
                  <div className="form-group">
                    <label htmlFor="weight" className="form-label">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      id="weight"
                      className={`form-input ${errors.weight ? 'error' : ''}`}
                      value={weight}
                      onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                      min={0.5}
                      max={500}
                      step={0.5}
                      placeholder="20.0"
                      disabled={isSubmitting}
                    />
                    {errors.weight && (
                      <div className="form-error">{errors.weight}</div>
                    )}
                  </div>

                  {/* Performance Preview */}
                  <div className="card" style={{ backgroundColor: 'var(--gray-50)' }}>
                    <div className="card-body text-center">
                      <div className="text-gray-600 mb-2">Total Volume</div>
                      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', color: 'var(--primary-600)' }}>
                        {(reps * weight).toFixed(1)} kg
                      </div>
                      <div className="text-gray-500 text-sm mt-1">
                        {reps} reps × {weight} kg on {new Date(workoutDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <button
                    type="submit"
                    className="btn btn-primary btn-large btn-full"
                    disabled={isSubmitting || exerciseLibrary.length === 0}
                  >
                    {isSubmitting ? 'Saving...' : 'Log Exercise'}
                  </button>
                  {exerciseLibrary.length === 0 && (
                    <div className="text-center text-sm text-gray-600 mt-2">
                      Add exercises to your library first
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* Body Weight Form */}
          {mode === 'weight' && (
            <form onSubmit={handleWeightSubmit}>
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold">Update Body Weight</h2>
                </div>
                <div className="card-body space-y-6">
                  {/* Date */}
                  <div className="form-group">
                    <label htmlFor="weightDate" className="form-label">
                      Date
                    </label>
                    <input
                      type="date"
                      id="weightDate"
                      className={`form-input ${errors.weightDate ? 'error' : ''}`}
                      value={weightDate}
                      onChange={(e) => setWeightDate(e.target.value)}
                      disabled={isSubmitting}
                    />
                    {errors.weightDate && (
                      <div className="form-error">{errors.weightDate}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="bodyWeight" className="form-label">
                      Current Weight (kg)
                    </label>
                    <input
                      type="number"
                      id="bodyWeight"
                      className={`form-input ${errors.bodyWeight ? 'error' : ''}`}
                      value={bodyWeight}
                      onChange={(e) => setBodyWeight(parseFloat(e.target.value) || 0)}
                      min={30}
                      max={300}
                      step={0.1}
                      placeholder="70.0"
                      disabled={isSubmitting}
                    />
                    {errors.bodyWeight && (
                      <div className="form-error">{errors.bodyWeight}</div>
                    )}
                  </div>

                  <div className="card" style={{ backgroundColor: 'var(--gray-50)' }}>
                    <div className="card-body text-center">
                      <div className="text-gray-600 mb-2">Weight Entry</div>
                      <div style={{ fontSize: 'var(--text-3xl)', fontWeight: '700', color: 'var(--success-600)' }}>
                        {bodyWeight} kg
                      </div>
                      <div className="text-gray-500 text-sm mt-1">
                        on {new Date(weightDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <button
                    type="submit"
                    className="btn btn-success btn-large btn-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Update Weight'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}