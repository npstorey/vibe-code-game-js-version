/**
 * File: src/logic/feedLogic.ts
 * Project: Vibe Coding Simulator (MVP)
 * Description: Manages the generation, display, and interaction logic for the message feed.
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import { MAX_FEED_MESSAGES } from './constants';

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
  // Other state will be added in GameContext
}

/**
 * Checks if a project can be offered in the feed.
 * @param {string} projectId - The project ID to check.
 * @param {any} gameState - Current game state.
 * @returns {boolean} - True if project can be offered.
 */
export const canOfferProject = (projectId: string, gameState: any): boolean => {
  // Don't offer projects that are already active
  if (gameState.activeProjects && gameState.activeProjects.some((p: any) => p.projectId === projectId)) {
    return false;
  }
  
  // Don't offer projects that are already completed
  if (gameState.completedProjects && gameState.completedProjects.includes(projectId)) {
    return false;
  }
  
  // Don't offer if not in availableProjects list
  const isAvailableInData = gameState.availableProjects && 
    gameState.availableProjects.some((p: any) => p.Project_ID === projectId);
  
  return isAvailableInData;
};

/**
 * Generates new messages for the feed based on templates and game state.
 * @param {GameState} gameState - Current game state.
 * @returns {GameState} - Updated gameState with new feed messages.
 */
export const generateNewMessages = (gameState: GameState): GameState => {
  let newFeedMessages = [...gameState.activeFeedMessages];
  const messageTemplates = gameState.messageTemplates; // From CSV
  
  if (!messageTemplates || messageTemplates.length === 0) {
    return { ...gameState, activeFeedMessages: newFeedMessages };
  }

  // Filter templates by probability and availability
  const eligibleTemplates = messageTemplates.filter(template => {
    // Check probability - Value_Probability is a number between 0-1
    const probability = parseFloat(template.Value_Probability || "0.1");
    const passedProbabilityCheck = Math.random() < probability;
    
    // For project offers, check if it can be offered
    const isProjectOffer = template.Action === 'Accept Project' && template.Project_ID;
    if (isProjectOffer) {
      return passedProbabilityCheck && canOfferProject(template.Project_ID, gameState);
    }

    // For hardware/AI messages, can add checks based on game state if needed
    // e.g., only show hardware messages after day 5, etc.
    
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
        // TODO: Trigger project assignment logic (find available GPU?)
        console.log(`Accepted project offer: ${message.projectId}`);
        // Need to call a function like assignProjectToGpu(newState, message.projectId)
      } else {
        console.log(`Action 'accept' performed on message: ${message.title}`);
        // Archive or just dismiss?
        newState.archivedFeedMessages = [...newState.archivedFeedMessages, message];
      }
      break;
    case 'dismiss':
    case 'archive':
    default:
      console.log(`Archiving/Dismissing message: ${message.title}`);
      newState.archivedFeedMessages = [...newState.archivedFeedMessages, message];
      break;
  }

  // TODO: Limit archived messages?

  return newState;
}; 