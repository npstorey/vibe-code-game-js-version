/**
 * File: src/contexts/GameContext.tsx
 * Project: Vibe Coding Simulator (MVP)
 * Description: Provides global game state management (resources, projects, time, etc.) via React Context.
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
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
    setBlockProgressValue: (progress: number) => void;
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
    health: 100,  // Initialize health at 100%
    blockProgress: 0, // Track progress within current time block (0 to 1)

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

  // Helper function to handle completed projects
  const handleCompletedProjects = useCallback((state: ExtendedGameState): ExtendedGameState => {
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
        
        // Add reputation and log change
        const projectRepReward = originalProject.Reputation_Reward || 0;
        reputationAdded += projectRepReward;
        if (projectRepReward > 0) {
          console.log(`Reputation increased by ${projectRepReward} (Project Completion). Current: ${(newState.reputation || 0) + reputationAdded}`);
        }
        
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
  }, [csvData]);

  const advanceTime = useCallback((blocks = 1) => {
    for (let i = 0; i < blocks; i++) {
      setGameState(prevState => {
        const newState = advanceTimeBlock(prevState);
        return handleCompletedProjects(newState);
      });
    }
    // Additional logic could be added here after state updates if needed
  }, [handleCompletedProjects]);

  const assignProjectToGpu = useCallback((projectId: string, gpuId: number) => {
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
      
      // Log successful assignment
      console.log(`Successfully assigned project ${projectToAssign.Project_ID} (${projectToAssign.Name}) to GPU ${gpuId}.`);
      
      // Remove from available projects and add to active projects
      return {
        ...prevState,
        activeProjects: [...prevState.activeProjects, newActiveProject],
        availableProjects: prevState.availableProjects.filter((p: any) => p.Project_ID !== projectId)
      };
    });
  }, []);

  const handlePurchaseItem = useCallback((itemId: string, itemType: 'hardware' | 'aiModel' | 'prompt') => {
    setGameState(prevState => purchaseItem(prevState, itemId, itemType));
  }, []);

  const handleYoloAttempt = useCallback((projectId: string) => {
    setGameState(prevState => {
      // Find the project in active projects
      const projectIndex = prevState.activeProjects.findIndex((p: ProjectState) => p.projectId === projectId);
      if (projectIndex === -1) {
        console.error(`Project ${projectId} not found in active projects`);
        return prevState;
      }
      
      // Get the project and calculate modifiers
      const project = prevState.activeProjects[projectIndex];
      const modifiers = calculateCombinedModifiers(prevState);
      
      // Update the project with YOLO result
      const updatedProject = ProjectLogic.resolveYolo(project, modifiers);
      
      // Create new active projects array with the updated project
      const newActiveProjects = [...prevState.activeProjects];
      newActiveProjects[projectIndex] = updatedProject;
      
      // Return updated state with initial changes
      let newState = {
        ...prevState,
        activeProjects: newActiveProjects
      };
      
      // Handle project failure (apply penalties)
      if (updatedProject.status === 'failed') {
        // Apply reputation penalty - YOLO failures cause significant reputation damage
        const reputationPenalty = 10;
        newState.reputation = Math.max(0, (newState.reputation || 0) - reputationPenalty);
        console.log(`Reputation decreased by ${reputationPenalty} (YOLO Failure). Current: ${newState.reputation}`);
        
        // Apply a small health penalty - stressful failures impact health
        const healthPenalty = 2;
        newState.health = Math.max(0, newState.health - healthPenalty);
        console.log(`Health decreased by ${healthPenalty} (YOLO Failure Stress). Current: ${newState.health}`);
        
        // Remove failed project
        newState.activeProjects = newState.activeProjects.filter((p: ProjectState) => p.projectId !== projectId);
        
        // UI Feedback for failure
        console.log(`Project ${projectId} YOLO attempt failed! Project lost. -${reputationPenalty} Reputation, -${healthPenalty} Health.`);
        if (typeof window !== 'undefined') {
          const projectData = prevState.availableProjects.find((p: any) => p.Project_ID === projectId) || 
                             csvData?.projects?.find((p: any) => p.Project_ID === projectId);
          const projectName = projectData?.Name || projectId;
          alert(`❌ YOLO attempt failed!\nProject ${projectName} lost.\n-${reputationPenalty} Reputation\n-${healthPenalty} Health`);
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
  }, [csvData]);

  const handleInterventionAttempt = useCallback((projectId: string, promptId: string) => {
    setGameState(prevState => {
      // Find the project in active projects
      const projectIndex = prevState.activeProjects.findIndex((p: ProjectState) => p.projectId === projectId);
      if (projectIndex === -1) {
        console.error(`Project ${projectId} not found in active projects`);
        return prevState;
      }
      
      // Get the project and calculate modifiers
      const project = prevState.activeProjects[projectIndex];
      const modifiers = calculateCombinedModifiers(prevState);
      
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
      
      // Small health cost for the mental effort of intervention (less than YOLO failures)
      const healthCost = 1;
      
      // Apply health cost and log
      const newHealth = Math.max(0, prevState.health - healthCost);
      console.log(`Health decreased by ${healthCost} (Intervention Mental Effort). Current: ${newHealth}`);
      
      // UI Feedback for intervention
      if (wasSuccessful) {
        console.log(`Project ${projectId} intervention succeeded! -1 Time Block, -${healthCost} Health.`);
        
        if (typeof window !== 'undefined') {
          const projectData = prevState.availableProjects.find((p: any) => p.Project_ID === projectId) || 
                             csvData?.projects?.find((p: any) => p.Project_ID === projectId);
          const promptData = prevState.prompts.find((p: any) => p.Prompt_ID === promptId);
          const projectName = projectData?.Name || projectId;
          const promptName = promptData?.Name || promptId;
          alert(`✅ Intervention with "${promptName}" succeeded!\nProject ${projectName} resumed.\n-1 Time Block\n-${healthCost} Health`);
        }
      } else {
        console.log(`Project ${projectId} intervention failed to resolve the error. -${healthCost} Health.`);
        
        if (typeof window !== 'undefined') {
          alert(`⚠️ Intervention failed to resolve the error. Project remains in error state.\n-${healthCost} Health`);
        }
      }
      
      // Return updated state
      // On success, deduct 1 time block for the intervention
      return {
        ...prevState,
        activeProjects: newActiveProjects,
        timeBlocks: wasSuccessful ? Math.max(1, prevState.timeBlocks - 1) : prevState.timeBlocks,
        health: newHealth // Always costs some health to attempt intervention
      };
    });
  }, [csvData]);

  /**
   * Handles user interaction with feed messages.
   * @param {string} messageId - ID of the message being actioned
   * @param {string} actionType - Type of action ('accept', 'dismiss', 'archive')
   */
  const handleFeedMessageAction = useCallback((messageId: string, actionType: 'accept' | 'dismiss' | 'archive') => {
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
      
      // If message has a projectId and action is 'accept', add to available projects
      if (actionType === 'accept' && message.projectId) {
        // Find the full project data
        const projectData = csvData?.projects?.find((p: any) => p.Project_ID === message.projectId);
        
        if (projectData) {
          // Check if this project is already in availableProjects
          const isDuplicate = updatedState.availableProjects.some(
            (p: any) => p.Project_ID === message.projectId
          );
          
          if (isDuplicate) {
            console.warn(`Project ${message.projectId} is already in available projects. Skipping duplicate.`);
            return updatedState;
          }
          
          // Add project to available projects (rather than directly assigning to GPU)
          console.log(`Project ${message.projectId} accepted from feed, now available to assign.`);
          return {
            ...updatedState,
            availableProjects: [...updatedState.availableProjects, projectData]
          };
        } else {
          console.error(`Project data for ${message.projectId} not found in CSV data`);
        }
      } else if (actionType === 'dismiss') {
        console.log(`Message "${message.title}" dismissed.`);
      } else if (actionType === 'archive') {
        console.log(`Message "${message.title}" archived for reference.`);
      }
      
      return updatedState;
    });
  }, [csvData]);

  // Set block progress value
  const setBlockProgressValue = useCallback((progress: number) => {
    setGameState(prevState => ({
      ...prevState,
      blockProgress: progress
    }));
  }, []);

  // --- End Game Logic Actions ---

  // Memoize the actions object to stabilize its reference
  const actions = useMemo(() => ({
    advanceTime,
    assignProjectToGpu,
    purchaseItem: handlePurchaseItem,
    handleYoloAttempt,
    handleInterventionAttempt,
    handleFeedMessageAction,
    setBlockProgressValue
  }), [
    advanceTime,
    assignProjectToGpu,
    handlePurchaseItem,
    handleYoloAttempt,
    handleInterventionAttempt,
    handleFeedMessageAction,
    setBlockProgressValue
  ]);

  // Memoize the entire context value
  const contextValue = useMemo(() => ({
    gameState,
    setGameState,
    csvLoading,
    csvError,
    actions
  }), [gameState, setGameState, csvLoading, csvError, actions]);

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}; 