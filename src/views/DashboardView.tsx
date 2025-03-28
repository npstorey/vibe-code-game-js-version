/**
 * File: src/views/DashboardView.tsx
 * Project: Vibe Coding Simulator (MVP)
 * Description: Main dashboard showing GPU resources and available projects.
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import React, { useContext, useState } from 'react';
import GpuGrid from '../components/gpu/GpuGrid';
import FeedContainer from '../components/feed/FeedContainer';
import ProjectCard from '../components/projects/ProjectCard';
import Modal from '../components/common/Modal';
import { ProjectState } from '../logic/projectLogic';
import { GameContext } from '../contexts/GameContext';
import { useGameLoop } from '../hooks/useGameLoop';

const DashboardView: React.FC = () => {
  const context = useContext(GameContext);
  const { isRunning, speed, toggleGameLoop, changeSpeed } = useGameLoop();
  const [interventionModalOpen, setInterventionModalOpen] = useState(false);
  const [selectedErroredProject, setSelectedErroredProject] = useState<ProjectState | null>(null);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  
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

  // Handle GPU slot click
  const handleGpuSlotClick = (gpuId: number) => {
    const project = gameState.activeProjects.find(p => p.assignedGpu === gpuId);
    if (project && project.status === 'error') {
      setSelectedErroredProject(project);
      setInterventionModalOpen(true);
    }
  };

  // Handle YOLO attempt
  const handleYolo = () => {
    if (selectedErroredProject) {
      actions.handleYoloAttempt(selectedErroredProject.projectId);
      setInterventionModalOpen(false);
    }
  };

  // Handle Intervention attempt
  const handleIntervention = () => {
    if (selectedErroredProject && selectedPromptId) {
      actions.handleInterventionAttempt(selectedErroredProject.projectId, selectedPromptId);
      setInterventionModalOpen(false);
    }
  };

  // Get project name from ID
  const getProjectName = (projectId: string) => {
    const project = gameState.availableProjects.find(p => p.Project_ID === projectId) || 
                    gameState.activeProjects.find(p => p.projectId === projectId);
    return project ? project.Name || "Unknown Project" : "Unknown Project";
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
            <GpuGrid onGpuClick={handleGpuSlotClick} />
          </section>
          
          <section>
            <h3 className="text-xl font-semibold mb-4">Available Projects</h3>
            {gameState.availableProjects.length === 0 ? (
              <p className="text-gray-400">No projects available. Check the feed for new opportunities.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gameState.availableProjects.map((project) => (
                  <ProjectCard
                    key={project.Project_ID}
                    project={project}
                    onAssign={(projectId) => {
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
                  />
                ))}
              </div>
            )}
          </section>
        </div>
        
        <div className="lg:col-span-1">
          <FeedContainer />
        </div>
      </div>

      {/* Intervention Modal */}
      <Modal 
        isOpen={interventionModalOpen} 
        onClose={() => setInterventionModalOpen(false)}
        title="Project Error"
      >
        {selectedErroredProject && (
          <div className="text-white">
            <div className="bg-red-800 p-4 rounded mb-4">
              <p className="font-bold">
                Error detected in project: {getProjectName(selectedErroredProject.projectId)}
              </p>
              <p className="text-sm mt-2">
                Current progress: {Math.round(selectedErroredProject.progress * 100)}%
              </p>
            </div>
            
            <p className="mb-4">How would you like to handle this error?</p>
            
            <div className="space-y-4">
              <div>
                <button 
                  onClick={handleYolo}
                  className="w-full bg-orange-600 hover:bg-orange-700 py-2 px-4 rounded mb-2"
                >
                  Attempt YOLO Fix
                </button>
                <p className="text-xs text-gray-400">
                  Quick fix with {Math.round(selectedErroredProject.yoloSuccessRate * 100)}% success rate. 
                  No time cost, but project fails if unsuccessful.
                </p>
              </div>
              
              <div>
                <p className="font-semibold mb-2">Intervene with a Prompt:</p>
                <div className="bg-gray-700 p-3 rounded mb-2">
                  <select 
                    className="w-full bg-gray-800 p-2 rounded"
                    value={selectedPromptId || ""}
                    onChange={(e) => setSelectedPromptId(e.target.value)}
                  >
                    <option value="">Select a prompt...</option>
                    {gameState.ownedPrompts.map(promptId => {
                      const prompt = gameState.prompts.find(p => p.Prompt_ID === promptId);
                      return prompt ? (
                        <option key={promptId} value={promptId}>
                          {prompt.Name} (Quality: {(
                            (parseFloat(prompt.Clarity || 0) + 
                             parseFloat(prompt.Specificity || 0) + 
                             parseFloat(prompt.Adaptability || 0)) / 3
                          ).toFixed(1)}/5)
                        </option>
                      ) : null;
                    })}
                  </select>
                </div>
                
                <button 
                  onClick={handleIntervention}
                  disabled={!selectedPromptId}
                  className={`w-full py-2 px-4 rounded ${
                    selectedPromptId 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-gray-600 cursor-not-allowed'
                  }`}
                >
                  Confirm Intervention
                </button>
                <p className="text-xs text-gray-400 mt-1">
                  Uses a time block but has a high success rate based on prompt quality.
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DashboardView; 