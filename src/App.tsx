import { useState } from 'react';
import { TabType } from './types';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import BottomNavigation from './components/BottomNavigation';
import HomeScreen from './components/HomeScreen';
import AddWorkoutScreen from './components/AddWorkoutScreen';
import ProgressScreen from './components/ProgressScreen';
import ProfileScreen from './components/ProfileScreen';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen onNavigate={setActiveTab} />;
      case 'add-workout':
        return <AddWorkoutScreen />;
      case 'progress':
        return <ProgressScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen onNavigate={setActiveTab} />;
    }
  };

  return (
    <AuthProvider>
      <div className="app">
        <ProtectedRoute>
          <main className="app-main">
            {renderScreen()}
          </main>
          <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </ProtectedRoute>
      </div>
    </AuthProvider>
  );
}

export default App;