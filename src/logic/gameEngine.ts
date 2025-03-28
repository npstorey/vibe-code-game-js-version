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

export interface ExtendedGameState extends GameState {
  day: number;
  timeBlocks: number;
  credits: number;
  activeProjects: ProjectLogic.ProjectState[];
  availableProjects: any[];
  hardware: any[];
  aiModels: any[];
  prompts: any[];
  ownedHardware: string[];
  ownedAiModels: string[];
  ownedPrompts: string[];
  availableGpus: number;
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
    // TODO: Add daily events logic here (e.g., generate new messages, deduct costs)
  }
  newState = { ...newState, day: newDay, timeBlocks: newTimeBlocks };

  // 2. Update Active Projects Progress
  newState.activeProjects = newState.activeProjects.map(proj => {
    if (proj.status === 'running') {
      // Pass relevant parts of gameState (like owned hardware/AI mods)
      const modifiers = { /* calculate modifiers based on ownedHardware, ownedAiModels etc. */ };
      return ProjectLogic.updateProjectProgress(proj, 1, modifiers); // Advance by 1 time unit
    }
    return proj; // Return unchanged if not running
  });

  // 3. Handle completed projects (move reward, update available projects list)
  // TODO

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
  }

  // 5. Check for endgame condition (e.g., Day 92)
  // TODO

  return newState;
}; 