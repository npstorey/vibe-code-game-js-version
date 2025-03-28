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

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  
  // Render the current view based on the state
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'resources':
        return <div className="p-4">Resources View (Coming Soon)</div>;
      case 'store':
        return <div className="p-4">Store View (Coming Soon)</div>;
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
      <MainLayout currentView={currentView} onViewChange={handleViewChange}>
        {renderView()}
      </MainLayout>
    </GameProvider>
  );
};

export default App;
