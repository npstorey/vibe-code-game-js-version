/**
 * File: src/logic/gameEngine.ts
 * Project: Vibe Coding Simulator (MVP)
 * Description: Core game loop, time progression, and high-level state changes.
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import { TIME_BLOCKS_PER_DAY } from './constants';
import * as ProjectLogic from './projectLogic';
import { generateNewMessages, GameState } from './feedLogic';
import { calculateCombinedModifiers } from './resourceManager';

export interface ExtendedGameState extends GameState {
  day: number;
  timeBlocks: number;
  credits: number;
  reputation: number;
  health: number;
  blockProgress: number; // Progress within the current time block (0 to 1)
  activeProjects: ProjectLogic.ProjectState[];
  availableProjects: any[];
  hardware: any[];
  aiModels: any[];
  prompts: any[];
  ownedHardware: string[];
  ownedAiModels: string[];
  ownedPrompts: string[];
  availableGpus: number;
  completedProjects: string[];
  // Other game state properties will be added as needed
}

/**
 * Advances game time by one block, updating projects and potentially day.
 * @param {ExtendedGameState} gameState - Current game state.
 * @returns {ExtendedGameState} - The updated game state.
 */
export const advanceTimeBlock = (gameState: ExtendedGameState): ExtendedGameState => {
  let newState = { ...gameState };

  // 1. Update Time Blocks and Day
  let newTimeBlocks = newState.timeBlocks - 1;
  let newDay = newState.day;
  let isNewDay = false;
  if (newTimeBlocks <= 0) {
    newDay += 1;
    newTimeBlocks = TIME_BLOCKS_PER_DAY; // Reset for the new day
    isNewDay = true;
    console.log(`Day ${newDay} begins. ${TIME_BLOCKS_PER_DAY} time blocks available.`);
    
    // Apply daily health cost when a new day starts
    const dailyHealthCost = 5;
    newState.health = Math.max(0, newState.health - dailyHealthCost);
    console.log(`Health decreased by ${dailyHealthCost} (Daily Mental Fatigue). Current: ${newState.health}%.`);
  }
  newState = { ...newState, day: newDay, timeBlocks: newTimeBlocks };

  // 2. Update Active Projects Progress
  // Calculate combined modifiers from owned hardware and AI models
  const modifiers = calculateCombinedModifiers(newState);

  // Track project status changes
  let projectsCompleted = false;
  let projectsErrored = false;

  newState.activeProjects = newState.activeProjects.map(proj => {
    if (proj.status === 'running') {
      const updatedProj = ProjectLogic.updateProjectProgress(proj, 1, modifiers); // Advance by 1 time unit
      
      // Track status changes for logging
      if (updatedProj.status === 'completed') {
        projectsCompleted = true;
      }
      if (updatedProj.status === 'error') {
        projectsErrored = true;
      }
      
      return updatedProj;
    }
    return proj; // Return unchanged if not running
  });

  // Log the results
  if (projectsCompleted) {
    console.log("One or more projects completed this time block!");
  }
  if (projectsErrored) {
    console.log("One or more projects encountered errors this time block!");
  }

  // 3. Handle completed projects (move reward, update available projects list)
  // This is now handled in GameContext.handleCompletedProjects

  // 4. Generate new feed messages (especially if it's a new day)
  if (isNewDay) {
    // Using the newState as is (it's already ExtendedGameState which extends GameState)
    const feedUpdatedState = generateNewMessages(newState);
    // Merge back only the feed-related properties
    newState = {
      ...newState,
      activeFeedMessages: feedUpdatedState.activeFeedMessages,
      archivedFeedMessages: feedUpdatedState.archivedFeedMessages
    };
    
    console.log(`Generated ${feedUpdatedState.activeFeedMessages.length - newState.activeFeedMessages.length} new feed messages for day ${newDay}.`);
  }

  // 5. Check for endgame condition (e.g., Day 92)
  // TODO

  return newState;
}; 