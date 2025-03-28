/**
 * File: src/views/DashboardView.tsx
 * Project: Vibe Coding Simulator (MVP)
 * Description: Main dashboard showing GPU resources and available projects.
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import React, { useContext } from 'react';
import GpuGrid from '../components/gpu/GpuGrid';
import FeedContainer from '../components/feed/FeedContainer';
import { GameContext } from '../contexts/GameContext';
import { useGameLoop } from '../hooks/useGameLoop';

const DashboardView: React.FC = () => {
  const context = useContext(GameContext);
  const { isRunning, speed, toggleGameLoop, changeSpeed } = useGameLoop();
  
  if (!context) {
    return <div className="p-4">Loading dashboard data...</div>;
  }
  
  const { gameState, actions } = context;
  
  // Handler for advancing time manually
  const handleAdvanceTime = () => {
    actions.advanceTime(1);
  };

  // Handler for changing game speed
  const handleSpeedChange = (newSpeed: 'slow' | 'medium' | 'fast') => {
    changeSpeed(newSpeed);
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleGameLoop}
            className={`font-bold py-2 px-4 rounded ${isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isRunning ? 'Pause' : 'Auto-Advance'}
          </button>
          
          {isRunning && (
            <div className="flex space-x-1">
              <button 
                onClick={() => handleSpeedChange('slow')}
                className={`px-2 py-1 rounded ${speed === 'slow' ? 'bg-blue-700' : 'bg-gray-700'}`}
              >
                Slow
              </button>
              <button 
                onClick={() => handleSpeedChange('medium')}
                className={`px-2 py-1 rounded ${speed === 'medium' ? 'bg-blue-700' : 'bg-gray-700'}`}
              >
                Medium
              </button>
              <button 
                onClick={() => handleSpeedChange('fast')}
                className={`px-2 py-1 rounded ${speed === 'fast' ? 'bg-blue-700' : 'bg-gray-700'}`}
              >
                Fast
              </button>
            </div>
          )}
          
          {!isRunning && (
            <button 
              onClick={handleAdvanceTime}
              className="bg-blue-600 hover:bg-blue-700 font-bold py-2 px-4 rounded"
            >
              Advance Time (1 Block)
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">GPU Resources</h3>
            <GpuGrid />
          </section>
          
          <section>
            <h3 className="text-xl font-semibold mb-4">Available Projects</h3>
            {gameState.availableProjects.length === 0 ? (
              <p className="text-gray-400">No projects available. Check the feed for new opportunities.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gameState.availableProjects.map((project) => (
                  <div 
                    key={project.Project_ID} 
                    className="bg-gray-800 border border-gray-700 rounded p-4 hover:bg-gray-750 cursor-pointer"
                  >
                    <h4 className="font-bold text-lg">{project.Name}</h4>
                    <div className="text-xs text-gray-400 mb-2">Domain: {project.Domain}</div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Complexity: {project.Complexity}</span>
                      <span>Reward: {project.Reward} Credits</span>
                    </div>
                    <div className="flex justify-between text-sm mb-4">
                      <span>Est. Time: {project.Baseline_Time} blocks</span>
                      <span>Error Rate: {project.Error_Rate * 100}%</span>
                    </div>
                    <button 
                      onClick={() => {
                        // Find first available GPU
                        const availableGpuId = Array.from(
                          { length: gameState.availableGpus }, 
                          (_, i) => i + 1
                        ).find(id => 
                          !gameState.activeProjects.some(p => p.assignedGpu === id)
                        );
                        
                        if (availableGpuId) {
                          actions.assignProjectToGpu(project.Project_ID, availableGpuId);
                        } else {
                          alert("No available GPUs. Complete or cancel a project first.");
                        }
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-sm"
                    >
                      Assign to GPU
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        
        <div className="lg:col-span-1">
          <FeedContainer />
        </div>
      </div>
    </div>
  );
};

export default DashboardView; 