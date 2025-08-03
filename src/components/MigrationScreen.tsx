import React, { useState, useEffect } from 'react';
import { 
  checkIfMigrationNeeded, 
  migrateLocalStorageData, 
  clearLocalStorageAfterMigration,
  getLocalStorageData,
  MigrationResult 
} from '../services/migrationService';

interface MigrationScreenProps {
  onComplete: () => void;
}

const MigrationScreen: React.FC<MigrationScreenProps> = ({ onComplete }) => {
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [localDataPreview, setLocalDataPreview] = useState<any>(null);

  useEffect(() => {
    const checkMigration = () => {
      const needed = checkIfMigrationNeeded();
      setMigrationNeeded(needed);
      
      if (needed) {
        const data = getLocalStorageData();
        setLocalDataPreview(data);
      }
      
      setIsLoading(false);
    };

    checkMigration();
  }, []);

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      const migrationResult = await migrateLocalStorageData();
      setResult(migrationResult);
      
      if (migrationResult.success && migrationResult.errors.length === 0) {
        clearLocalStorageAfterMigration();
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    } catch (error) {
      console.error('Migration error:', error);
      setResult({
        success: false,
        workoutsMigrated: 0,
        bodyWeightsMigrated: 0,
        exercisesMigrated: 0,
        errors: ['Migration failed: ' + (error instanceof Error ? error.message : 'Unknown error')]
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('workout-tracker-migrated', JSON.stringify({
      migratedAt: new Date().toISOString(),
      skipped: true,
      dataMovedToSupabase: false
    }));
    onComplete();
  };

  if (isLoading) {
    return (
      <div className="screen">
        <div className="container">
          <div className="screen-content flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="text-4xl mb-4">⏳</div>
              <div className="text-lg font-semibold">Checking for data migration...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!migrationNeeded) {
    onComplete();
    return null;
  }

  return (
    <div className="screen">
      <div className="container">
        <div className="screen-header text-center">
          <h1 className="screen-title">📦 Data Migration</h1>
          <p className="screen-subtitle">
            We found existing workout data on your device
          </p>
        </div>

        <div className="screen-content max-w-md mx-auto">
          {!result && (
            <>
              {/* Data Preview */}
              <div className="card mb-6">
                <div className="card-header">
                  <h2 className="text-lg font-semibold">Your Local Data</h2>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Workouts:</span>
                      <span className="font-semibold">{localDataPreview?.workouts?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Body Weight Entries:</span>
                      <span className="font-semibold">{localDataPreview?.bodyWeights?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Exercises:</span>
                      <span className="font-semibold">{localDataPreview?.exerciseLibrary?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Migration Options */}
              <div className="card mb-6">
                <div className="card-body text-center">
                  <div className="text-2xl mb-4">☁️ ➡️ 🔄</div>
                  <h3 className="font-semibold mb-2">Move to Cloud Storage</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Transfer your existing data to secure cloud storage for cross-device sync.
                    This process is safe and your local data will remain as backup.
                  </p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleMigrate}
                      className="btn btn-primary btn-large btn-full"
                      disabled={isMigrating}
                    >
                      {isMigrating ? 'Migrating Data...' : 'Migrate My Data'}
                    </button>
                    
                    <button
                      onClick={handleSkip}
                      className="btn btn-secondary btn-full"
                      disabled={isMigrating}
                    >
                      Skip (Start Fresh)
                    </button>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="card" style={{ backgroundColor: 'var(--gray-50)' }}>
                <div className="card-body text-center">
                  <div className="text-sm text-gray-600">
                    <div className="font-semibold mb-1">🔒 Safe & Secure</div>
                    <div>Your data is encrypted and only accessible by you.</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Migration Results */}
          {result && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">
                  {result.success ? '✅ Migration Complete' : '❌ Migration Failed'}
                </h2>
              </div>
              <div className="card-body">
                {result.success ? (
                  <div className="space-y-3">
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">🎉</div>
                      <div className="font-semibold text-success-600">
                        Successfully migrated your data!
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Workouts migrated:</span>
                        <span className="font-semibold">{result.workoutsMigrated}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Body weights migrated:</span>
                        <span className="font-semibold">{result.bodyWeightsMigrated}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Exercises migrated:</span>
                        <span className="font-semibold">{result.exercisesMigrated}</span>
                      </div>
                    </div>

                    {result.errors.length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm font-semibold text-orange-600 mb-2">
                          Some items had issues:
                        </div>
                        <div className="text-sm text-gray-600">
                          {result.errors.slice(0, 3).map((error, index) => (
                            <div key={index}>• {error}</div>
                          ))}
                          {result.errors.length > 3 && (
                            <div>• ...and {result.errors.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="text-center mt-4">
                      <div className="text-sm text-gray-600">
                        Redirecting to your workout tracker...
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center mb-4">
                      <div className="font-semibold text-red-600">
                        Migration encountered errors
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {result.errors.map((error, index) => (
                        <div key={index} className="mb-1">• {error}</div>
                      ))}
                    </div>

                    <button
                      onClick={handleSkip}
                      className="btn btn-secondary btn-full mt-4"
                    >
                      Continue Anyway
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MigrationScreen;