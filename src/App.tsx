/**
 * File: src/App.tsx
 * Project: Vibe Coding Simulator (MVP)
 * Description: Main application component. Handles view switching and context providers.
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import React, { useState } from 'react';
import { GameProvider } from './contexts/GameContext';
import MainLayout from './components/layout/MainLayout';
import DashboardView from './views/DashboardView';
import StoreView from './views/StoreView';
import MyResourcesView from './views/MyResourcesView';
import { useGameLoop } from './hooks/useGameLoop';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  
  // Render the current view based on the state
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'resources':
        return <MyResourcesView />;
      case 'store':
        return <StoreView />;
      case 'codesprint':
        return <div className="p-4">Code Sprint View (Coming Soon)</div>;
      default:
        return <DashboardView />;
    }
  };

  // Handler for bottom navigation view changes
  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  return (
    <GameProvider>
      <GameLoopController>
        {({ isRunning }) => (
          <MainLayout 
            currentView={currentView} 
            onViewChange={handleViewChange} 
            isRunning={isRunning}
          >
            {renderView()}
          </MainLayout>
        )}
      </GameLoopController>
    </GameProvider>
  );
};

// Separate component to handle game loop and provide it through render props
// This isolates the loop to its own component to prevent unneeded rerenders
const GameLoopController: React.FC<{children: (props: {isRunning: boolean}) => React.ReactNode}> = ({ children }) => {
  const { isRunning, toggleGameLoop, changeSpeed } = useGameLoop();
  
  // Expose game controls to global window for development access
  if (typeof window !== 'undefined') {
    (window as any).__gameControls = {
      toggleGameLoop,
      changeSpeed,
      isRunning
    };
  }
  
  return <>{children({ isRunning })}</>;
};

export default App;
