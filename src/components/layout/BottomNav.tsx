/**
 * File: src/components/layout/BottomNav.tsx
 * Project: Vibe Coding Simulator (MVP)
 * Description: Bottom navigation bar for switching between main views.
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import React from 'react';

// This would typically use a router, but for MVP we can simulate with state
interface BottomNavProps {
  currentView?: string;
  onViewChange?: (view: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView = 'dashboard', onViewChange }) => {
  // For MVP, these functions would typically navigate to different routes
  const handleNavClick = (view: string) => {
    if (onViewChange) {
      onViewChange(view);
    }
    console.log(`Navigating to ${view} view`);
  };

  return (
    <div className="bg-gray-800 border-t border-gray-700 p-2">
      <div className="flex justify-around items-center">
        <button 
          className={`px-4 py-2 rounded ${currentView === 'dashboard' ? 'bg-blue-700' : 'hover:bg-gray-700'}`}
          onClick={() => handleNavClick('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`px-4 py-2 rounded ${currentView === 'resources' ? 'bg-blue-700' : 'hover:bg-gray-700'}`}
          onClick={() => handleNavClick('resources')}
        >
          Resources
        </button>
        <button 
          className={`px-4 py-2 rounded ${currentView === 'store' ? 'bg-blue-700' : 'hover:bg-gray-700'}`}
          onClick={() => handleNavClick('store')}
        >
          Store
        </button>
        <button 
          className={`px-4 py-2 rounded ${currentView === 'codesprint' ? 'bg-blue-700' : 'hover:bg-gray-700'}`}
          onClick={() => handleNavClick('codesprint')}
        >
          Code Sprint
        </button>
      </div>
    </div>
  );
};

export default BottomNav; 