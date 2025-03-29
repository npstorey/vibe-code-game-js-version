/**
 * File: src/components/layout/MainLayout.tsx
 * Project: Vibe Coding Simulator (MVP)
 * Description: Main layout component for the application.
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import React, { ReactNode } from 'react';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

interface MainLayoutProps {
  children: ReactNode;
  currentView?: string;
  onViewChange?: (view: string) => void;
  isRunning: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, currentView, onViewChange, isRunning }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <TopBar isRunning={isRunning} />
      <main className="flex-grow overflow-auto">
        {children}
      </main>
      <BottomNav currentView={currentView} onViewChange={onViewChange} />
    </div>
  );
};

export default MainLayout; 