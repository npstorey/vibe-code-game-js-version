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

const TopBar = () => {
  const context = useContext(GameContext);
  
  if (!context) {
    // Handle the case where the context is undefined
    return <div>Loading...</div>;
  }
  
  const { gameState } = context;
  const activeGpus = gameState.activeProjects.filter((p: ProjectState) => p.status === 'running').length;
  const totalGpus = gameState.availableGpus;

  return (
    <div className="bg-gray-800 text-white p-4 flex justify-between items-center border-b border-gray-700">
      <h1 className="text-xl font-bold">VIBE CODING SIMULATOR</h1>
      <div className="flex items-center space-x-4">
        <span>GPU RESOURCES ({activeGpus}/{totalGpus} active)</span>
        <span>DAY {gameState.day}</span>
        <span>TIME BLOCKS: {gameState.timeBlocks}</span>
        <span>CREDITS: {gameState.credits}</span>
        <span className="text-xs text-green-400 flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
          Relaxed {/* Placeholder status */}
        </span>
      </div>
    </div>
  );
};

export default TopBar; 