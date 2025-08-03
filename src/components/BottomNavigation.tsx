import { TabType } from '../types';
import './BottomNavigation.css';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  {
    id: 'home' as TabType,
    label: 'Home',
    icon: '🏠'
  },
  {
    id: 'add-workout' as TabType,
    label: 'Add Workout',
    icon: '➕'
  },
  {
    id: 'progress' as TabType,
    label: 'Progress',
    icon: '📊'
  },
  {
    id: 'profile' as TabType,
    label: 'Profile',
    icon: '👤'
  }
];

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-container">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`bottom-nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
          >
            <span className="bottom-nav-icon">{tab.icon}</span>
            <span className="bottom-nav-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}