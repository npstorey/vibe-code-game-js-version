/**
 * File: src/contexts/GameContext.tsx
 * Project: Vibe Coding Simulator (MVP)
 * Description: Provides global game state management (resources, projects, time, etc.) via React Context.
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useCsvLoader } from '../hooks/useCsvLoader';
import { ExtendedGameState } from '../logic/gameEngine';
import { ProjectState } from '../logic/projectLogic';
import * as ProjectLogic from '../logic/projectLogic';
import { advanceTimeBlock } from '../logic/gameEngine';
import { purchaseItem, calculateCombinedModifiers } from '../logic/resourceManager';

interface GameContextType {
  gameState: ExtendedGameState;
  setGameState: React.Dispatch<React.SetStateAction<ExtendedGameState>>;
  csvLoading: boolean;
  csvError: any;
  actions: {
    advanceTime: (blocks?: number) => void;
    assignProjectToGpu: (projectId: string, gpuId: number) => void;
    purchaseItem: (itemId: string, itemType: 'hardware' | 'aiModel' | 'prompt') => void;
    // Add more actions: handleIntervention, completeProject, updateFeed etc.
  };
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  // Use the hook to load data
  const { data: csvData, loading: csvLoading, error: csvError } = useCsvLoader({
    aiModels: '/data/ai_models.csv',
    projects: '/data/projects.csv',
    prompts: '/data/prompts.csv',
    hardware: '/data/hardware.csv',
    messages: '/data/messages.csv',
  });

  const [gameState, setGameState] = useState<ExtendedGameState>({
    // Core Resources
    day: 1,
    timeBlocks: 8, // Start of day
    credits: 1000, // Initial credits from screenshots
    // Health/Reputation might be added later per TID if needed for MVP display
    // reputation: 0,
    // health: 100,

    // CSV Data Stores (initially empty, filled by useCsvLoader)
    aiModels: [],
    availableProjects: [], // From projects.csv, filtered for availability
    prompts: [],
    hardware: [], // All available hardware
    messageTemplates: [], // Parsed from messages.csv

    // Active Game State
    activeProjects: [
      // Example structure: { projectId: 'proj_001', assignedGpu: 1, progress: 0, timeRemaining: 120, errors: [], status: 'running' }
    ],
    ownedHardware: ['hw_001'], // Start with basic hardware (assuming hw_001 is basic)
    ownedAiModels: [],
    ownedPrompts: [],
    activeFeedMessages: [], // Current messages shown in the feed
    archivedFeedMessages: [],
    availableGpus: 4, // Total number of GPU slots
  });

  useEffect(() => {
    if (!csvLoading && csvData) {
      setGameState(prevState => ({
        ...prevState,
        aiModels: csvData.aiModels || [],
        // Filter initial available projects (example logic, needs refinement)
        availableProjects: (csvData.projects || []).filter((p: any) => 
          !prevState.activeProjects.some(ap => ap.projectId === p.Project_ID)
        ),
        prompts: csvData.prompts || [],
        hardware: csvData.hardware || [],
        messageTemplates: csvData.messages || [],
        // Set initial owned hardware based on parsed data if needed
        // ownedHardware: csvData.hardware.find(h => h.Hardware_ID === 'hw_001') ? ['hw_001'] : []
      }));
      // TODO: Initialize feed messages based on templates
    }
  }, [csvData, csvLoading]);

  // --- Game Logic Actions ---

  const advanceTime = (blocks = 1) => {
    for (let i = 0; i < blocks; i++) {
      setGameState(prevState => advanceTimeBlock(prevState));
    }
    // Additional logic could be added here after state updates if needed
  };

  const assignProjectToGpu = (projectId: string, gpuId: number) => {
    setGameState(prevState => {
      // Find the project in available projects
      const projectToAssign = prevState.availableProjects.find(p => p.Project_ID === projectId);
      
      if (!projectToAssign) {
        console.error(`Project ${projectId} not found in available projects`);
        return prevState;
      }
      
      // Check if the GPU is available
      const isGpuInUse = prevState.activeProjects.some(p => p.assignedGpu === gpuId);
      if (isGpuInUse) {
        console.error(`GPU ${gpuId} is already in use`);
        return prevState;
      }
      
      // Create active project entry
      const newActiveProject: ProjectState = {
        projectId: projectToAssign.Project_ID,
        assignedGpu: gpuId,
        progress: 0,
        timeRemaining: projectToAssign.Baseline_Time * 2, // Simple conversion (adjust as needed)
        errors: [],
        status: 'running',
        baseErrorRate: projectToAssign.Error_Rate,
        yoloSuccessRate: projectToAssign.YOLO_Success
      };
      
      // Remove from available projects and add to active projects
      return {
        ...prevState,
        activeProjects: [...prevState.activeProjects, newActiveProject],
        availableProjects: prevState.availableProjects.filter(p => p.Project_ID !== projectId)
      };
    });
  };

  const handlePurchaseItem = (itemId: string, itemType: 'hardware' | 'aiModel' | 'prompt') => {
    setGameState(prevState => purchaseItem(prevState, itemId, itemType));
  };

  // --- End Game Logic Actions ---

  // Provide state and actions
  const contextValue: GameContextType = {
    gameState,
    setGameState, // Use sparingly, prefer specific action functions
    csvLoading,
    csvError,
    actions: { // Group actions for clarity
      advanceTime,
      assignProjectToGpu,
      purchaseItem: handlePurchaseItem,
      // Add more actions: handleIntervention, completeProject, updateFeed etc.
    }
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}; 