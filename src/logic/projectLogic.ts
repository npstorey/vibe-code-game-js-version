/**
 * File: src/logic/projectLogic.ts
 * Project: Vibe Coding Simulator (MVP)
 * Description: Handles project progress, error checking, and intervention/YOLO logic.
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import { PROJECT_ERROR_THRESHOLDS } from './constants';

export interface ProjectState {
  projectId: string;
  assignedGpu: number;
  progress: number;
  timeRemaining: number;
  errors: { type: string; threshold: number }[];
  status: 'running' | 'error' | 'completed' | 'failed';
  baseErrorRate: number;
  yoloSuccessRate: number;
  baselineTime: number; // Store Baseline_Time for progress calculations
}

interface Modifiers {
  speedMultiplier?: number;
  errorMultiplier?: number;
  yoloMultiplier?: number;
}

/**
 * Updates the progress of a single project.
 * @param {ProjectState} projectState - The current state of the active project.
 * @param {number} timeUnits - The amount of time units passed (e.g., 1 time block).
 * @param {Modifiers} modifiers - Modifiers from hardware, AI models, etc. (e.g., { speedMultiplier: 1.2 })
 * @returns {ProjectState} - The updated project state.
 */
export const updateProjectProgress = (
  projectState: ProjectState, 
  timeUnits: number, 
  modifiers: Modifiers
): ProjectState => {
  let updatedProj = { ...projectState };

  // Calculate progress based on baselineTime
  const baseTimeBlocks = projectState.baselineTime || 1;
  const timeUnitsPerBlock = 1; // Assuming 1 call = 1 time block passed
  const effectiveSpeedMultiplier = modifiers.speedMultiplier || 1.0;

  // Calculate progress added in this block
  // If Baseline_Time is 4 blocks, each block adds 1/4 = 0.25 progress, modified by speed
  const progressIncrement = (timeUnitsPerBlock / baseTimeBlocks) * effectiveSpeedMultiplier;

  // Ensure progress doesn't exceed 1
  updatedProj.progress = Math.min(1, updatedProj.progress + progressIncrement);
  // Update timeRemaining based on progress
  updatedProj.timeRemaining = Math.max(0, baseTimeBlocks * (1 - updatedProj.progress));

  // Check for error threshold triggers
  const previousProgress = projectState.progress;
  for (const threshold of PROJECT_ERROR_THRESHOLDS) {
    if (previousProgress < threshold && updatedProj.progress >= threshold) {
      const errorOccurred = checkErrorProbability(updatedProj, modifiers);
      if (errorOccurred) {
        updatedProj.status = 'error'; // Halt progress
        updatedProj.errors = [...updatedProj.errors, { type: 'standard', threshold }];
        console.log(`Project ${updatedProj.projectId} hit error at ${threshold * 100}%`);
        // Player interaction needed now (handled via UI state change)
        break; // Only trigger one error per update cycle
      } else {
        console.log(`Project ${updatedProj.projectId} passed error check at ${threshold * 100}%`);
      }
    }
  }

  // Check for completion
  if (updatedProj.progress >= 1) {
    updatedProj.status = 'completed';
    console.log(`Project ${updatedProj.projectId} completed!`);
  }

  return updatedProj;
};

/**
 * Calculates if an error occurs based on project, AI, hardware, etc.
 * @param {ProjectState} projectState - The current state of the active project.
 * @param {Modifiers} modifiers - Modifiers affecting error rate.
 * @returns {boolean} - True if an error occurred, false otherwise.
 */
export const checkErrorProbability = (
  projectState: ProjectState, 
  modifiers: Modifiers
): boolean => {
  // Get base error rate from project data
  const baseErrorRate = projectState.baseErrorRate;
  // Apply modifiers from hardware, AI models
  const errorMultiplier = modifiers.errorMultiplier || 1.0;
  
  // Effective rate is base rate adjusted by modifiers
  const effectiveErrorRate = baseErrorRate * errorMultiplier;
  
  // Ensure rate is within reasonable bounds (0% to 100%)
  const clampedErrorRate = Math.max(0, Math.min(1, effectiveErrorRate));
  
  // Random check against the effective error rate
  return Math.random() < clampedErrorRate;
};

/**
 * Handles the result of player choosing YOLO.
 * @param {ProjectState} projectState - The project state currently in error.
 * @param {Modifiers} modifiers - Modifiers influencing YOLO success.
 * @returns {ProjectState} - Updated project state ('running' or 'failed').
 */
export const resolveYolo = (
  projectState: ProjectState, 
  modifiers: Modifiers
): ProjectState => {
  let updatedProj = { ...projectState };
  const yoloSuccessRate = projectState.yoloSuccessRate;
  const effectiveSuccessRate = yoloSuccessRate * (modifiers.yoloMultiplier || 1);
  
  // Check if YOLO attempt succeeds
  if (Math.random() < effectiveSuccessRate) {
    updatedProj.status = 'running'; // Error cleared, project resumes
    updatedProj.errors = updatedProj.errors.slice(0, -1); // Remove last error
    console.log(`Project ${updatedProj.projectId} YOLO succeeded!`);
  } else {
    updatedProj.status = 'failed'; // Project failed
    console.log(`Project ${updatedProj.projectId} YOLO failed!`);
    // Penalty will be applied in the GameContext
  }
  
  return updatedProj;
};

/**
 * Handles the result of player choosing an intervention.
 * @param {ProjectState} projectState - The project state currently in error.
 * @param {string} promptId - The ID of the prompt used for intervention.
 * @param {Object[]} promptsData - All available prompt data.
 * @param {Modifiers} modifiers - Other modifiers.
 * @returns {ProjectState} - Updated project state ('running').
 */
export const resolveIntervention = (
  projectState: ProjectState, 
  promptId: string, 
  promptsData: any[], 
  modifiers: Modifiers
): ProjectState => {
  let updatedProj = { ...projectState };
  const promptUsed = promptsData.find(p => p.Prompt_ID === promptId);

  if (!promptUsed) {
    console.error(`Intervention failed: Prompt ${promptId} not found.`);
    return updatedProj; // No change if prompt is invalid
  }

  // For MVP Phase 1, use a high base success rate (90%)
  // In future phases, calculate based on prompt stats and AI model
  const baseSuccessRate = 0.9;
  const promptQuality = (
    parseFloat(promptUsed.Clarity || "0") + 
    parseFloat(promptUsed.Specificity || "0") + 
    parseFloat(promptUsed.Adaptability || "0")
  ) / 3; // Average of prompt stats
  
  const successRate = baseSuccessRate * (promptQuality / 5); // Assuming prompt stats are 0-5
  
  if (Math.random() < successRate) {
    updatedProj.status = 'running';
    updatedProj.errors = updatedProj.errors.slice(0, -1); // Remove last error
    console.log(`Project ${updatedProj.projectId} intervention with ${promptUsed.Name} succeeded!`);
  } else {
    // In MVP, intervention rarely fails, but we should handle this case
    console.log(`Project ${updatedProj.projectId} intervention with ${promptUsed.Name} failed!`);
    // Keep the error state
  }

  return updatedProj;
}; 