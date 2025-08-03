import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthScreen from './AuthScreen';
import MigrationScreen from './MigrationScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, needsMigration, completeMigration } = useAuth();

  if (loading) {
    return (
      <div className="screen">
        <div className="container">
          <div className="screen-content flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="text-4xl mb-4">⏳</div>
              <div className="text-lg font-semibold">Loading...</div>
              <div className="text-gray-600">Checking authentication</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (needsMigration) {
    return <MigrationScreen onComplete={completeMigration} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;