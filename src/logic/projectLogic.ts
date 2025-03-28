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

  // Simple progress example (needs actual calculation based on Baseline_Time, modifiers)
  // Assume Baseline_Time is in minutes, timeUnits is blocks (e.g., 1 block = 15 mins?)
  // This needs refinement based on game balance. Let's use a simple percentage for now.
  const progressIncrement = 0.05 * timeUnits * (modifiers.speedMultiplier || 1); // Example: 5% per block base speed

  updatedProj.progress = Math.min(1, updatedProj.progress + progressIncrement);
  updatedProj.timeRemaining = Math.max(0, updatedProj.timeRemaining - timeUnits); // Or recalculate based on progress

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
  // Placeholder logic - Needs actual formula from TID/PRD
  // Example: Base Error Rate * (1 - AI Accuracy) * (1 - Hardware Modifier) ...
  const baseErrorRate = projectState.baseErrorRate || 0.1; // Get from project data
  const effectiveErrorRate = baseErrorRate * (modifiers.errorMultiplier || 1); // Apply modifiers
  return Math.random() < effectiveErrorRate;
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
  const yoloSuccessRate = projectState.yoloSuccessRate || 0.7; // Get from project data
  const effectiveSuccessRate = yoloSuccessRate * (modifiers.yoloMultiplier || 1); // Apply modifiers

  if (Math.random() < effectiveSuccessRate) {
    updatedProj.status = 'running'; // Error cleared, project resumes
    updatedProj.errors = updatedProj.errors.slice(0, -1); // Remove last error
    console.log(`Project ${updatedProj.projectId} YOLO succeeded!`);
  } else {
    updatedProj.status = 'failed'; // Project failed
    console.log(`Project ${updatedProj.projectId} YOLO failed!`);
    // TODO: Apply penalties (reputation loss, etc.)
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

  // Placeholder logic: Intervention always succeeds for MVP?
  // Or calculate success based on prompt stats (Clarity, Specificity etc.)?
  // Let's assume it always clears the error for now.
  updatedProj.status = 'running';
  updatedProj.errors = updatedProj.errors.slice(0, -1); // Remove last error
  console.log(`Project ${updatedProj.projectId} intervention with ${promptUsed.Name} succeeded!`);

  // TODO: Consume resources (time block? prompt usage limit?)

  return updatedProj;
}; 