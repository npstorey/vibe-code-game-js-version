/**
 * File: src/logic/resourceManager.ts
 * Project: Vibe Coding Simulator (MVP)
 * Description: Manages player resources like credits, hardware, AI models, and prompts. Handles purchasing.
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */

import { ExtendedGameState } from './gameEngine';

type ItemType = 'hardware' | 'aiModel' | 'prompt';

interface HardwareItem {
  Hardware_ID: string;
  Name: string;
  Processing_Power: number;
  Memory: number;
  Energy_Efficiency: number;
  Cost: number;
}

interface AiModelItem {
  Model_ID: string;
  Model_Name: string;
  Accuracy: number;
  Inference_Speed: number;
  Specialization: string;
  Cost: number;
}

interface PromptItem {
  Prompt_ID: string;
  Name: string;
  Clarity: number;
  Specificity: number;
  Structured_Format: number;
  Contextual_Info: number;
  Cost: number;
}

/**
 * Attempts to purchase an item (Hardware, AI Model, Prompt).
 * @param {ExtendedGameState} gameState - Current game state.
 * @param {string} itemId - ID of the item to purchase.
 * @param {'hardware' | 'aiModel' | 'prompt'} itemType - Type of item.
 * @returns {ExtendedGameState} - Updated gameState, or original state if purchase failed.
 */
export const purchaseItem = (
  gameState: ExtendedGameState, 
  itemId: string, 
  itemType: ItemType
): ExtendedGameState => {
  let newState = { ...gameState };
  let itemData;
  let itemCost;

  // Find item and cost
  switch (itemType) {
    case 'hardware':
      itemData = newState.hardware.find((h: HardwareItem) => h.Hardware_ID === itemId);
      itemCost = itemData?.Cost;
      break;
    case 'aiModel':
      itemData = newState.aiModels.find((m: AiModelItem) => m.Model_ID === itemId);
      itemCost = itemData?.Cost;
      break;
    case 'prompt':
      itemData = newState.prompts.find((p: PromptItem) => p.Prompt_ID === itemId);
      itemCost = itemData?.Cost;
      break;
    default:
      console.error(`Unknown item type for purchase: ${itemType}`);
      return gameState; // Return original state
  }

  if (!itemData) {
    console.error(`Item not found for purchase: ${itemType} ${itemId}`);
    return gameState;
  }

  if (itemCost === undefined || itemCost === null) {
    console.warn(`Item ${itemId} has no defined Cost. Assuming free or unavailable.`);
    itemCost = 0; // Or prevent purchase? For now, assume free if no cost defined.
  }

  // Check if already owned (for unique items like hardware/models)
  if (itemType === 'hardware' && newState.ownedHardware.includes(itemId)) {
    console.log(`Already own hardware: ${itemId}`);
    return gameState; // Prevent re-buying unique hardware
  }
  if (itemType === 'aiModel' && newState.ownedAiModels.includes(itemId)) {
    console.log(`Already own AI Model: ${itemId}`);
    return gameState;
  }
  // Prompts might be consumable or permanently unlocked - decide based on game design
  if (itemType === 'prompt' && newState.ownedPrompts.includes(itemId)) {
    console.log(`Already own Prompt: ${itemId}`);
    return gameState; // Assume permanent unlock for now
  }

  // Check credits
  if (newState.credits < itemCost) {
    console.log(`Insufficient credits to purchase ${itemId}. Need ${itemCost}, have ${newState.credits}.`);
    // TODO: Maybe trigger a feedback message to the player UI
    return gameState; // Not enough credits
  }

  // Deduct credits and add item
  newState.credits -= itemCost;

  switch (itemType) {
    case 'hardware':
      newState.ownedHardware = [...newState.ownedHardware, itemId];
      // Maybe only one hardware can be "active"? Need logic for that.
      break;
    case 'aiModel':
      newState.ownedAiModels = [...newState.ownedAiModels, itemId];
      break;
    case 'prompt':
      newState.ownedPrompts = [...newState.ownedPrompts, itemId];
      break;
  }

  console.log(`Successfully purchased ${itemType}: ${itemId} for ${itemCost} credits.`);
  return newState;
};

/**
 * Calculates combined modifiers based on owned items.
 * @param {string[]} ownedHardware - List of owned hardware IDs
 * @param {string[]} ownedAiModels - List of owned AI model IDs
 * @param {any[]} hardwareData - Full hardware data from CSV
 * @param {any[]} aiModelData - Full AI model data from CSV
 * @returns {object} - An object containing calculated modifiers (e.g., { speedMultiplier: 1.1, errorMultiplier: 0.9 }).
 */
export const calculateCombinedModifiers = (
  ownedHardware: string[],
  ownedAiModels: string[],
  hardwareData: any[],
  aiModelData: any[]
) => {
  const modifiers = {
    speedMultiplier: 1.0,
    errorMultiplier: 1.0,
    yoloMultiplier: 1.0,
    // Add more specific modifiers as needed
  };

  // Apply Hardware Modifiers (assuming only one active hardware matters, e.g., the best one?)
  // This needs clarification - using the *first* owned for now as a placeholder
  const activeHardwareId = ownedHardware[0]; // Simplistic: assumes first is active
  const activeHardware = hardwareData.find((h: HardwareItem) => h.Hardware_ID === activeHardwareId);
  if (activeHardware) {
    // Example: Higher Processing Power increases speed, higher Memory reduces errors
    modifiers.speedMultiplier *= (1 + (activeHardware.Processing_Power - 0.5)); // Example formula
    modifiers.errorMultiplier *= (1 - (activeHardware.Memory - 0.5) * 0.2); // Example formula
  }

  // Apply AI Model Modifiers (assuming best owned model is used, or specific model assigned to project?)
  // For MVP, let's use the first owned AI model if any
  const activeAiModelId = ownedAiModels[0];
  const activeAiModel = aiModelData.find((m: AiModelItem) => m.Model_ID === activeAiModelId);
  if (activeAiModel) {
    // Example: Higher Accuracy reduces errors, higher Inference_Speed increases speed
    modifiers.errorMultiplier *= (1 - activeAiModel.Accuracy * 0.2); // Example formula
    modifiers.speedMultiplier *= (1 + activeAiModel.Inference_Speed * 0.1); // Example formula
    // Apply YOLO success rate boost based on AI model
    modifiers.yoloMultiplier *= (1 + activeAiModel.Accuracy * 0.3); // Example formula
  }

  return modifiers;
}; 