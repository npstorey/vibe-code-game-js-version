/**
 * File: src/logic/feedLogic.ts
 * Project: Vibe Coding Simulator (MVP)
 * Description: Manages the generation, display, and interaction logic for the message feed.
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import { MAX_FEED_MESSAGES, MAX_ARCHIVED_FEED_MESSAGES } from './constants';

export interface FeedMessage {
  id: string;
  type: 'Social' | 'Direct' | 'System';
  title: string;
  body: string;
  action?: string;
  projectId?: string;
  timestamp: number;
}

export interface GameState {
  activeFeedMessages: FeedMessage[];
  archivedFeedMessages: FeedMessage[];
  messageTemplates: any[];
  day: number; // Need this for tracking cooldowns
  health?: number; // For contextual triggers
  credits?: number; // For contextual triggers
  ownedHardware?: string[]; // For contextual triggers
  ownedAiModels?: string[]; // For contextual triggers
  availableProjects?: any[]; // For contextual triggers on project offerings
  // Other state will be added in GameContext
}

// Tracking recently shown messages (for cooldown)
const recentlyShownMessages: {[key: string]: number} = {};
const MESSAGE_COOLDOWN_DAYS = 3; // Number of days before showing the same message template again

/**
 * Checks if a project can be offered in the feed.
 * @param {string} projectId - The project ID to check.
 * @param {any} gameState - Current game state.
 * @returns {boolean} - True if project can be offered.
 */
export const canOfferProject = (projectId: string, gameState: any): boolean => {
  // Don't offer projects that are already active
  if (gameState.activeProjects && gameState.activeProjects.some((p: any) => p.projectId === projectId)) {
    console.log(`[Feed Gen] Skipping offer for active project: ${projectId}`);
    return false;
  }
  
  // Don't offer projects that are already completed
  if (gameState.completedProjects && gameState.completedProjects.includes(projectId)) {
    console.log(`[Feed Gen] Skipping offer for completed project: ${projectId}`);
    return false;
  }
  
  // Don't offer projects that are already available
  if (gameState.availableProjects && gameState.availableProjects.some((p: any) => p.Project_ID === projectId)) {
    console.log(`[Feed Gen] Skipping offer for already available project: ${projectId}`);
    return false;
  }
  
  // Optional: Check if the project exists in base data
  // This could be added if we have a reference to the base project list
  
  // If passed all checks, project can be offered
  return true;
};

/**
 * Checks if a message template is on cooldown
 * @param {string} templateId - Message template ID
 * @param {number} currentDay - Current game day
 * @returns {boolean} - True if message is on cooldown
 */
const isMessageOnCooldown = (templateId: string, currentDay: number): boolean => {
  if (!recentlyShownMessages[templateId]) return false;
  
  return currentDay - recentlyShownMessages[templateId] < MESSAGE_COOLDOWN_DAYS;
};

/**
 * Checks if a message template passes contextual requirements
 * @param {any} template - Message template
 * @param {GameState} gameState - Current game state
 * @returns {boolean} - True if message passes contextual requirements
 */
const passesContextualRequirements = (template: any, gameState: GameState): boolean => {
  // Low Resources Warning - only show if health is below 40
  if (template.Message_ID === 'msg_006' && gameState.health && gameState.health > 40) {
    return false;
  }
  
  // Hardware Upgrade Available - only show if player doesn't have the best hardware
  if (template.Message_ID === 'msg_003') {
    const hardware = gameState.ownedHardware || [];
    // Assume hw_004 is best (or whatever your actual best hardware ID is)
    if (hardware.includes('hw_004')) {
      return false;
    }
  }
  
  // New AI Model Available - only show if player doesn't have the best AI model
  if (template.Message_ID === 'msg_010') {
    const aiModels = gameState.ownedAiModels || [];
    // Assume ai_004 is best (or whatever your actual best AI model ID is)
    if (aiModels.includes('ai_004')) {
      return false;
    }
  }
  
  // After Day 15, increase probability of higher complexity projects
  if (template.Action === 'Accept Project' && template.Project_ID) {
    const projectId = template.Project_ID;
    const project = gameState.availableProjects?.find((p: any) => p.Project_ID === projectId);
    
    if (project) {
      const complexity = parseFloat(project.Complexity || "0");
      
      // For high complexity projects (>0.7), boost probability after day 15
      if (complexity > 0.7 && gameState.day >= 15) {
        // This essentially makes it more likely to pass the probability check
        return Math.random() < 0.9; // Higher chance to include 
      }
    }
  }
  
  return true;
};

/**
 * Generates new messages for the feed based on templates and game state.
 * @param {GameState} gameState - Current game state.
 * @returns {GameState} - Updated gameState with new feed messages.
 */
export const generateNewMessages = (gameState: GameState): GameState => {
  let newFeedMessages = [...gameState.activeFeedMessages];
  const messageTemplates = gameState.messageTemplates; // From CSV
  const currentDay = gameState.day || 1;
  
  if (!messageTemplates || messageTemplates.length === 0) {
    return { ...gameState, activeFeedMessages: newFeedMessages };
  }

  // Filter templates by probability, cooldown and availability
  const eligibleTemplates = messageTemplates.filter(template => {
    // Skip if on cooldown
    if (isMessageOnCooldown(template.Message_ID, currentDay)) {
      return false;
    }
    
    // Check contextual requirements
    if (!passesContextualRequirements(template, gameState)) {
      return false;
    }
    
    // Check probability - Value_Probability is a number between 0-1
    const probability = parseFloat(template.Value_Probability || "0.1");
    const passedProbabilityCheck = Math.random() < probability;
    
    // For project offers, check if it can be offered using enhanced canOfferProject
    const isProjectOffer = template.Action === 'Accept Project' && template.Project_ID;
    if (isProjectOffer) {
      const canOffer = canOfferProject(template.Project_ID, gameState);
      // Only include if it passes both probability and can be offered
      return passedProbabilityCheck && canOffer;
    }
    
    return passedProbabilityCheck;
  });
  
  // Select up to 3 messages to add (or fewer if not enough eligible)
  const messagesToAdd = Math.min(3, MAX_FEED_MESSAGES - newFeedMessages.length, eligibleTemplates.length);
  
  if (messagesToAdd > 0 && eligibleTemplates.length > 0) {
    // Shuffle eligible templates for randomized selection
    const shuffledTemplates = [...eligibleTemplates].sort(() => Math.random() - 0.5);
    
    // Prioritize diverse message types
    // Try to include at least one of each type if available
    const socialTemplates = shuffledTemplates.filter(t => t.Type === 'Social');
    const directTemplates = shuffledTemplates.filter(t => t.Type === 'Direct');
    const systemTemplates = shuffledTemplates.filter(t => t.Type === 'System');
    
    const selectedTemplates: typeof shuffledTemplates = [];
    
    // Try to add one of each type if possible
    if (socialTemplates.length > 0) selectedTemplates.push(socialTemplates[0]);
    if (directTemplates.length > 0 && selectedTemplates.length < messagesToAdd) 
      selectedTemplates.push(directTemplates[0]);
    if (systemTemplates.length > 0 && selectedTemplates.length < messagesToAdd)
      selectedTemplates.push(systemTemplates[0]);
    
    // Fill remaining slots with random templates
    while (selectedTemplates.length < messagesToAdd && selectedTemplates.length < shuffledTemplates.length) {
      const remainingTemplates = shuffledTemplates.filter(
        t => !selectedTemplates.includes(t)
      );
      if (remainingTemplates.length > 0) {
        selectedTemplates.push(remainingTemplates[0]);
      } else {
        break;
      }
    }
    
    // Convert templates to messages and add to feed
    for (const template of selectedTemplates) {
      const newMessage: FeedMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(16).slice(2)}`, // Unique ID
        type: template.Type as 'Social' | 'Direct' | 'System', 
        title: template.Title,
        body: template.Body,
        action: template.Action, // e.g., 'Accept Project', 'Open', 'Dismiss'
        projectId: template.Project_ID || undefined, // Link to a project if it's an offer
        timestamp: Date.now(),
      };
      newFeedMessages.unshift(newMessage); // Add to the top
      
      // Record this message as shown (for cooldown)
      recentlyShownMessages[template.Message_ID] = currentDay;
    }
  }

  // Ensure feed doesn't exceed max length
  if (newFeedMessages.length > MAX_FEED_MESSAGES) {
    newFeedMessages = newFeedMessages.slice(0, MAX_FEED_MESSAGES);
  }

  return { ...gameState, activeFeedMessages: newFeedMessages };
};

/**
 * Handles user action on a feed message (e.g., accept, dismiss, archive).
 * @param {GameState} gameState - Current game state.
 * @param {string} messageId - The ID of the message being actioned.
 * @param {string} actionType - The type of action taken (e.g., 'accept', 'dismiss').
 * @returns {GameState} - Updated gameState.
 */
export const handleFeedAction = (
  gameState: GameState, 
  messageId: string, 
  actionType: 'accept' | 'dismiss' | 'archive'
): GameState => {
  let newState = { ...gameState };
  const messageIndex = newState.activeFeedMessages.findIndex(msg => msg.id === messageId);
  if (messageIndex === -1) return newState; // Message not found

  const message = newState.activeFeedMessages[messageIndex];

  // Remove message from active feed
  newState.activeFeedMessages = newState.activeFeedMessages.filter(msg => msg.id !== messageId);

  switch (actionType) {
    case 'accept':
      if (message.action === 'Accept Project' && message.projectId) {
        // Accepting a project has special handling in GameContext, may not need archiving
        console.log(`Accepted project offer: ${message.projectId}`);
      } else {
        console.log(`Action 'accept' performed on message: ${message.title}`);
        // Archive accepted non-project messages
        newState.archivedFeedMessages = [message, ...newState.archivedFeedMessages];
      }
      break;
    case 'dismiss':
    case 'archive':
    default:
      console.log(`Archiving/Dismissing message: ${message.title}`);
      // Add to the start of archived array (most recent first)
      newState.archivedFeedMessages = [message, ...newState.archivedFeedMessages];
      break;
  }

  // Limit archived messages (FIFO - remove oldest if exceeding limit)
  if (newState.archivedFeedMessages.length > MAX_ARCHIVED_FEED_MESSAGES) {
    newState.archivedFeedMessages = newState.archivedFeedMessages.slice(0, MAX_ARCHIVED_FEED_MESSAGES);
  }

  return newState;
}; 