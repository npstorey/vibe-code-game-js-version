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
 * @param {ExtendedGameState} gameState - Current game state with hardware and ai model data.
 * @returns {object} - An object containing calculated modifiers.
 */
export const calculateCombinedModifiers = (gameState: ExtendedGameState) => {
  const { ownedHardware, ownedAiModels, hardware, aiModels } = gameState;

  const modifiers = {
    speedMultiplier: 1.0,
    errorMultiplier: 1.0,
    yoloMultiplier: 1.0,
    // Add more specific modifiers as needed
  };

  // Find the best hardware (highest Processing_Power) to use as active
  if (ownedHardware.length > 0) {
    const ownedHardwareItems = ownedHardware
      .map((id: string) => hardware.find((h: HardwareItem) => h.Hardware_ID === id))
      .filter(Boolean);

    if (ownedHardwareItems.length > 0) {
      // Get the hardware with highest Processing_Power
      const activeHardware = ownedHardwareItems.reduce((best: HardwareItem, current: HardwareItem) => {
        return (best.Processing_Power > current.Processing_Power) ? best : current;
      }, ownedHardwareItems[0]);

      // Apply hardware modifiers with detailed effects:
      
      // 1. Higher Processing Power increases speed - more powerful hardware processes work faster
      // Slightly reduced coefficient for better balance (0.1 -> 0.08)
      const powerEffect = 1 + (activeHardware.Processing_Power * 0.08);
      modifiers.speedMultiplier *= powerEffect;
      
      // 2. Higher Memory reduces errors - more memory allows handling complex projects with fewer issues
      // Slightly reduced coefficient for better balance (0.1 -> 0.08)
      const memoryEffect = Math.max(0.6, 1 - (activeHardware.Memory * 0.08));
      modifiers.errorMultiplier *= memoryEffect;
      
      // 3. Higher Energy Efficiency improves both speed and error rates slightly
      // Keep efficiency bonus modest
      const efficiencyBonus = activeHardware.Energy_Efficiency * 0.04;
      const efficiencySpeedEffect = 1 + efficiencyBonus;
      const efficiencyErrorEffect = 1 - efficiencyBonus;
      modifiers.speedMultiplier *= efficiencySpeedEffect;
      modifiers.errorMultiplier *= efficiencyErrorEffect;

      console.log(`Active Hardware: ${activeHardware.Name}`);
      console.log(`├─ Processing Power: ${activeHardware.Processing_Power} (Increases speed by ${((powerEffect-1)*100).toFixed(1)}%)`);
      console.log(`├─ Memory: ${activeHardware.Memory} (Reduces errors by ${((1-memoryEffect)*100).toFixed(1)}%)`);
      console.log(`└─ Efficiency: ${activeHardware.Energy_Efficiency} (Speed +${((efficiencySpeedEffect-1)*100).toFixed(1)}%, Errors -${((1-efficiencyErrorEffect)*100).toFixed(1)}%)`);
    }
  }

  // Find the best AI model (highest Accuracy) to use as active
  if (ownedAiModels.length > 0) {
    const ownedAiModelItems = ownedAiModels
      .map((id: string) => aiModels.find((m: AiModelItem) => m.Model_ID === id))
      .filter(Boolean);

    if (ownedAiModelItems.length > 0) {
      // Get the AI model with highest Accuracy
      const activeAiModel = ownedAiModelItems.reduce((best: AiModelItem, current: AiModelItem) => {
        return (best.Accuracy > current.Accuracy) ? best : current;
      }, ownedAiModelItems[0]);

      // Apply AI model modifiers with detailed effects:
      
      // 1. Higher Accuracy reduces error rate - better AI makes fewer mistakes
      // Slightly reduced to avoid making errors too rare (0.15 -> 0.12)
      const accuracyEffect = Math.max(0.6, 1 - (activeAiModel.Accuracy * 0.12));
      modifiers.errorMultiplier *= accuracyEffect;
      
      // 2. Higher Inference_Speed increases processing speed - faster AI completes work quicker
      // Increased slightly to make first AI upgrade more noticeable (0.1 -> 0.12)
      const speedEffect = 1 + (activeAiModel.Inference_Speed * 0.12);
      modifiers.speedMultiplier *= speedEffect;
      
      // 3. Higher Accuracy also improves YOLO success rates - better AI can fix problems more reliably
      // Reduced to make YOLO still risky but rewarding (0.3 -> 0.25)
      const yoloEffect = 1 + (activeAiModel.Accuracy * 0.25);
      modifiers.yoloMultiplier *= yoloEffect;

      console.log(`Active AI Model: ${activeAiModel.Model_Name}`);
      console.log(`├─ Accuracy: ${activeAiModel.Accuracy} (Reduces errors by ${((1-accuracyEffect)*100).toFixed(1)}%)`);
      console.log(`├─ Speed: ${activeAiModel.Inference_Speed} (Increases speed by ${((speedEffect-1)*100).toFixed(1)}%)`);
      console.log(`└─ YOLO Success Boost: +${((yoloEffect-1)*100).toFixed(1)}%`);
    }
  }

  // Log combined modifiers for debugging
  console.log(`Applied Modifiers - Speed: ${modifiers.speedMultiplier.toFixed(2)}x, Error: ${modifiers.errorMultiplier.toFixed(2)}x, YOLO: ${modifiers.yoloMultiplier.toFixed(2)}x`);

  return modifiers;
}; 