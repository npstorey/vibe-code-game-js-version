/**
 * File: src/components/layout/TopBar.tsx
 * Project: Vibe Coding Simulator (MVP)
 * Description: Displays the main top navigation bar with game resources (GPU status) and potentially time/credits later.
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import React, { useContext } from 'react';
import { GameContext } from '../../contexts/GameContext';
import { ProjectState } from '../../logic/projectLogic';

interface TopBarProps {
  isRunning: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ isRunning }) => {
  const context = useContext(GameContext);
  
  if (!context) {
    return <div>Loading...</div>;
  }
  
  const { gameState } = context;
  const { blockProgress } = gameState;
  const activeGpus = gameState.activeProjects.filter((p: ProjectState) => p.status === 'running').length;
  const totalGpus = gameState.availableGpus;

  // Debug log to track TopBar render cycles and values
  console.log(`[TopBar Render] isRunning: ${isRunning}, blockProgress: ${blockProgress?.toFixed(2)}, gameState.timeBlocks: ${context?.gameState.timeBlocks}`);

  // Determine health status indicator
  const getHealthStatus = () => {
    const health = gameState.health || 100;
    if (health > 80) return { label: "Relaxed", color: "green" };
    if (health > 50) return { label: "Good", color: "green" };
    if (health > 30) return { label: "Tired", color: "yellow" };
    if (health > 10) return { label: "Exhausted", color: "orange" };
    return { label: "Burnt Out", color: "red" };
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="bg-gray-800 text-white p-4 flex justify-between items-center border-b border-gray-700">
      <h1 className="text-xl font-bold">VIBE CODING SIMULATOR</h1>
      <div className="flex items-center space-x-4">
        <span>GPU RESOURCES ({activeGpus}/{totalGpus} active)</span>
        <span>DAY {gameState.day}</span>
        <span className="relative">
          <span 
            data-testid="time-blocks"
            style={{ fontFamily: 'monospace' }} // Use monospace font to ensure decimal places are visible
          >
            {(() => {
              const timeBlocks = gameState.timeBlocks;
              const remainingFraction = 1.0 - blockProgress;
              // Show full block number if paused OR if progress is exactly 0 (start of block)
              const displayValue = (!isRunning || blockProgress === 0)
                                 ? timeBlocks.toFixed(2)
                                 : (timeBlocks - 1 + remainingFraction).toFixed(2);
              // Handle case where calculation might dip below zero if timeBlocks is already 0
              const finalDisplay = timeBlocks <= 0 && blockProgress > 0 ? "0.00" : displayValue;
              return `TIME BLOCKS: ${finalDisplay}`;
            })()}
          </span>
          {isRunning && (
            <div className="absolute -bottom-1 left-0 w-full h-1 bg-gray-600">
              <div 
                className="bg-blue-500 h-full transition-all" 
                style={{ width: `${(1-blockProgress) * 100}%` }}
              ></div>
            </div>
          )}
        </span>
        <span>CREDITS: ₡{gameState.credits}</span>
        <span className="text-yellow-400">⭐ REPUTATION: {gameState.reputation || 0}</span>
        
        {/* Health display with hardcoded color classes */}
        <span className={healthStatus.color === 'green' ? 'text-green-400 flex items-center' : 
                         healthStatus.color === 'yellow' ? 'text-yellow-400 flex items-center' : 
                         healthStatus.color === 'orange' ? 'text-orange-400 flex items-center' : 
                         'text-red-400 flex items-center'}>
          <span>❤️ HEALTH: {gameState.health || 100}</span>
          <span className={`ml-2 w-2 h-2 ${healthStatus.color === 'green' ? 'bg-green-500' : 
                                           healthStatus.color === 'yellow' ? 'bg-yellow-500' : 
                                           healthStatus.color === 'orange' ? 'bg-orange-500' : 
                                           'bg-red-500'} rounded-full mr-1`}></span>
          <span className="text-xs">{healthStatus.label}</span>
        </span>
      </div>
    </div>
  );
};

export default TopBar; 