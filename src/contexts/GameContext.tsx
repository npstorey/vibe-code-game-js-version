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
import { handleFeedAction as processFeedAction, FeedMessage } from '../logic/feedLogic';
import { generateNewMessages } from '../logic/feedLogic';

interface GameContextType {
  gameState: ExtendedGameState;
  setGameState: React.Dispatch<React.SetStateAction<ExtendedGameState>>;
  csvLoading: boolean;
  csvError: any;
  actions: {
    advanceTime: (blocks?: number) => void;
    assignProjectToGpu: (projectId: string, gpuId: number) => void;
    purchaseItem: (itemId: string, itemType: 'hardware' | 'aiModel' | 'prompt') => void;
    handleYoloAttempt: (projectId: string) => void;
    handleInterventionAttempt: (projectId: string, promptId: string) => void;
    handleFeedMessageAction: (messageId: string, actionType: 'accept' | 'dismiss' | 'archive') => void;
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
    reputation: 0, // Added reputation for project completion rewards
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
    ownedPrompts: ['pr_001'], // Start with one basic prompt for error resolution
    activeFeedMessages: [], // Current messages shown in the feed
    archivedFeedMessages: [],
    availableGpus: 4, // Total number of GPU slots
    completedProjects: [], // Added to track completed projects
  });

  useEffect(() => {
    if (!csvLoading && csvData) {
      setGameState(prevState => {
        // First update the state with CSV data
        const updatedState = {
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
        };
        
        // Then generate initial feed messages
        const { activeFeedMessages, archivedFeedMessages } = generateNewMessages(updatedState);
        
        return {
          ...updatedState,
          activeFeedMessages,
          archivedFeedMessages
        };
      });
    }
  }, [csvData, csvLoading]);

  // --- Game Logic Actions ---

  const advanceTime = (blocks = 1) => {
    for (let i = 0; i < blocks; i++) {
      setGameState(prevState => {
        const newState = advanceTimeBlock(prevState);
        return handleCompletedProjects(newState);
      });
    }
    // Additional logic could be added here after state updates if needed
  };

  // Helper function to handle completed projects
  const handleCompletedProjects = (state: ExtendedGameState): ExtendedGameState => {
    const completedProjects = state.activeProjects.filter(project => project.status === 'completed');
    
    if (completedProjects.length === 0) {
      return state; // No completed projects to process
    }
    
    let newState = { ...state };
    let creditsAdded = 0;
    let reputationAdded = 0;
    
    // Process each completed project
    for (const project of completedProjects) {
      // Find the original project data to get rewards
      const originalProject = state.availableProjects.find((p: any) => p.Project_ID === project.projectId) || 
                             csvData?.projects?.find((p: any) => p.Project_ID === project.projectId);
      
      if (originalProject) {
        // Add rewards
        creditsAdded += originalProject.Reward || 0;
        reputationAdded += originalProject.Reputation_Reward || 0;
        
        // Add project to completed list
        newState.completedProjects = [...newState.completedProjects, project.projectId];
        
        // UI Feedback for completion
        console.log(`Project ${project.projectId} completed! +${originalProject.Reward} Credits, +${originalProject.Reputation_Reward} Reputation.`);
        // Temporary visual feedback
        if (typeof window !== 'undefined') {
          const projectName = originalProject.Name || project.projectId;
          alert(`🎉 Project ${projectName} completed!\n+${originalProject.Reward} Credits\n+${originalProject.Reputation_Reward} Reputation`);
        }
      }
    }
    
    // Update state with rewards and remove completed projects
    return {
      ...newState,
      credits: newState.credits + creditsAdded,
      reputation: (newState.reputation || 0) + reputationAdded,
      activeProjects: newState.activeProjects.filter(p => p.status !== 'completed')
    };
  };

  const assignProjectToGpu = (projectId: string, gpuId: number) => {
    setGameState(prevState => {
      // Find the project in available projects
      const projectToAssign = prevState.availableProjects.find((p: any) => p.Project_ID === projectId);
      
      if (!projectToAssign) {
        console.error(`Project ${projectId} not found in available projects`);
        return prevState;
      }
      
      // Check if the GPU is available
      const isGpuInUse = prevState.activeProjects.some((p: ProjectState) => p.assignedGpu === gpuId);
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
        yoloSuccessRate: projectToAssign.YOLO_Success,
        baselineTime: projectToAssign.Baseline_Time // Store for progress calculation
      };
      
      // Remove from available projects and add to active projects
      return {
        ...prevState,
        activeProjects: [...prevState.activeProjects, newActiveProject],
        availableProjects: prevState.availableProjects.filter((p: any) => p.Project_ID !== projectId)
      };
    });
  };

  const handlePurchaseItem = (itemId: string, itemType: 'hardware' | 'aiModel' | 'prompt') => {
    setGameState(prevState => purchaseItem(prevState, itemId, itemType));
  };

  const handleYoloAttempt = (projectId: string) => {
    setGameState(prevState => {
      // Find the project in active projects
      const projectIndex = prevState.activeProjects.findIndex((p: ProjectState) => p.projectId === projectId);
      if (projectIndex === -1) {
        console.error(`Project ${projectId} not found in active projects`);
        return prevState;
      }
      
      // Get the project and calculate modifiers
      const project = prevState.activeProjects[projectIndex];
      const modifiers = calculateCombinedModifiers(
        prevState.ownedHardware, 
        prevState.ownedAiModels, 
        prevState.hardware, 
        prevState.aiModels
      );
      
      // Update the project with YOLO result
      const updatedProject = ProjectLogic.resolveYolo(project, modifiers);
      
      // Create new active projects array with the updated project
      const newActiveProjects = [...prevState.activeProjects];
      newActiveProjects[projectIndex] = updatedProject;
      
      // Return updated state
      let newState = {
        ...prevState,
        activeProjects: newActiveProjects
      };
      
      // Handle project failure (apply penalties)
      if (updatedProject.status === 'failed') {
        // For MVP, just deduct some reputation
        newState.reputation = Math.max(0, (newState.reputation || 0) - 10);
        
        // Remove failed project
        newState.activeProjects = newState.activeProjects.filter((p: ProjectState) => p.projectId !== projectId);
        
        // UI Feedback for failure
        console.log(`Project ${projectId} YOLO attempt failed! Project lost. -10 Reputation.`);
        if (typeof window !== 'undefined') {
          const projectData = prevState.availableProjects.find((p: any) => p.Project_ID === projectId) || 
                             csvData?.projects?.find((p: any) => p.Project_ID === projectId);
          const projectName = projectData?.Name || projectId;
          alert(`❌ YOLO attempt failed!\nProject ${projectName} lost.\n-10 Reputation`);
        }
      } else {
        // UI Feedback for success
        console.log(`Project ${projectId} YOLO attempt succeeded! Project resumed.`);
        if (typeof window !== 'undefined') {
          const projectData = prevState.availableProjects.find((p: any) => p.Project_ID === projectId) || 
                             csvData?.projects?.find((p: any) => p.Project_ID === projectId);
          const projectName = projectData?.Name || projectId;
          alert(`✅ YOLO attempt succeeded!\nProject ${projectName} resumed.`);
        }
      }
      
      return newState;
    });
  };

  const handleInterventionAttempt = (projectId: string, promptId: string) => {
    setGameState(prevState => {
      // Find the project in active projects
      const projectIndex = prevState.activeProjects.findIndex((p: ProjectState) => p.projectId === projectId);
      if (projectIndex === -1) {
        console.error(`Project ${projectId} not found in active projects`);
        return prevState;
      }
      
      // Get the project and calculate modifiers
      const project = prevState.activeProjects[projectIndex];
      const modifiers = calculateCombinedModifiers(
        prevState.ownedHardware, 
        prevState.ownedAiModels, 
        prevState.hardware, 
        prevState.aiModels
      );
      
      // Update the project with intervention result
      const updatedProject = ProjectLogic.resolveIntervention(
        project, 
        promptId, 
        prevState.prompts, 
        modifiers
      );
      
      // Create new active projects array with the updated project
      const newActiveProjects = [...prevState.activeProjects];
      newActiveProjects[projectIndex] = updatedProject;
      
      // Check if intervention was successful (status changed from 'error' to 'running')
      const wasSuccessful = project.status === 'error' && updatedProject.status === 'running';
      
      // UI Feedback for intervention
      if (wasSuccessful) {
        console.log(`Project ${projectId} intervention succeeded! -1 Time Block.`);
        
        if (typeof window !== 'undefined') {
          const projectData = prevState.availableProjects.find((p: any) => p.Project_ID === projectId) || 
                             csvData?.projects?.find((p: any) => p.Project_ID === projectId);
          const promptData = prevState.prompts.find((p: any) => p.Prompt_ID === promptId);
          const projectName = projectData?.Name || projectId;
          const promptName = promptData?.Name || promptId;
          alert(`✅ Intervention with "${promptName}" succeeded!\nProject ${projectName} resumed.\n-1 Time Block`);
        }
      } else {
        console.log(`Project ${projectId} intervention failed to resolve the error.`);
        
        if (typeof window !== 'undefined') {
          alert(`⚠️ Intervention failed to resolve the error. Project remains in error state.`);
        }
      }
      
      // Return updated state
      // On success, deduct 1 time block for the intervention
      return {
        ...prevState,
        activeProjects: newActiveProjects,
        timeBlocks: wasSuccessful ? Math.max(1, prevState.timeBlocks - 1) : prevState.timeBlocks
      };
    });
  };

  /**
   * Handles user interaction with feed messages.
   * @param {string} messageId - ID of the message being actioned
   * @param {string} actionType - Type of action ('accept', 'dismiss', 'archive')
   */
  const handleFeedMessageAction = (messageId: string, actionType: 'accept' | 'dismiss' | 'archive') => {
    setGameState(prevState => {
      // Find the message
      const message = prevState.activeFeedMessages.find(m => m.id === messageId);
      if (!message) {
        console.error(`Message ${messageId} not found`);
        return prevState;
      }
      
      // Process feed action
      // processFeedAction only updates feedMessage-related properties, so we need to preserve the rest
      const feedUpdatedState = processFeedAction(prevState, messageId, actionType);
      
      // Create an updated state with extended properties preserved
      const updatedState: ExtendedGameState = {
        ...prevState,
        activeFeedMessages: feedUpdatedState.activeFeedMessages,
        archivedFeedMessages: feedUpdatedState.archivedFeedMessages
      };
      
      // If message has a projectId and action is 'accept', try to assign to GPU
      if (actionType === 'accept' && message.projectId) {
        // Find first available GPU
        const availableGpuId = Array.from(
          { length: updatedState.availableGpus }, 
          (_, i) => i + 1
        ).find(id => 
          !updatedState.activeProjects.some((p: ProjectState) => p.assignedGpu === id)
        );
        
        if (availableGpuId) {
          // Find the project in available projects
          const projectToAssign = updatedState.availableProjects.find((p: any) => p.Project_ID === message.projectId);
          if (projectToAssign) {
            // Assign project to GPU
            const newActiveProject: ProjectState = {
              projectId: projectToAssign.Project_ID,
              assignedGpu: availableGpuId,
              progress: 0,
              timeRemaining: projectToAssign.Baseline_Time * 2,
              errors: [],
              status: 'running',
              baseErrorRate: projectToAssign.Error_Rate,
              yoloSuccessRate: projectToAssign.YOLO_Success,
              baselineTime: projectToAssign.Baseline_Time
            };
            
            // UI feedback for project assignment
            console.log(`Project ${projectToAssign.Project_ID} accepted and assigned to GPU ${availableGpuId}.`);
            
            return {
              ...updatedState,
              activeProjects: [...updatedState.activeProjects, newActiveProject],
              availableProjects: updatedState.availableProjects.filter((p: any) => p.Project_ID !== message.projectId)
            };
          }
        } else {
          // UI feedback for no available GPU
          console.warn(`No available GPU to assign project ${message.projectId}.`);
          if (typeof window !== 'undefined') {
            alert(`⚠️ No available GPU to assign the project.\nComplete or cancel an active project first.`);
          }
        }
      } else if (actionType === 'dismiss') {
        console.log(`Message "${message.title}" dismissed.`);
      } else if (actionType === 'archive') {
        console.log(`Message "${message.title}" archived for reference.`);
      }
      
      return updatedState;
    });
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
      handleYoloAttempt,
      handleInterventionAttempt,
      handleFeedMessageAction
    }
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}; 