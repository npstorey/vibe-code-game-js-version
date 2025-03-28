/**
 * File: src/components/gpu/GpuGrid.tsx
 * Project: Vibe Coding Simulator (MVP)
 * Description: Container for displaying the status of all available GPU slots.
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import React, { useContext } from 'react';
import GpuSlot from './GpuSlot';
import { GameContext } from '../../contexts/GameContext';
import { ProjectState } from '../../logic/projectLogic';

const GpuGrid: React.FC = () => {
  const context = useContext(GameContext);
  
  if (!context) {
    // Handle the case where the context is undefined
    return <div>Loading GPU Resources...</div>;
  }
  
  const { gameState } = context;
  const { activeProjects, availableGpus } = gameState;
  
  // Create an array of slots based on the availableGpus count
  const gpuSlots = Array.from({ length: availableGpus }, (_, index) => {
    const gpuId = index + 1;
    const assignedProject = activeProjects.find((project: ProjectState) => project.assignedGpu === gpuId);
    
    return {
      id: gpuId,
      project: assignedProject ? assignedProject.projectId : null,
      status: assignedProject ? assignedProject.status : 'idle' as const,
      progress: assignedProject ? assignedProject.progress : 0,
    };
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      {gpuSlots.map((slot) => (
        <GpuSlot 
          key={slot.id} 
          gpuId={slot.id} 
          project={slot.project} 
          status={slot.status} 
          progress={slot.progress}
        />
      ))}
    </div>
  );
};

export default GpuGrid; 