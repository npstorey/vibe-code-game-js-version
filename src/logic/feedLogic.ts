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
 * Generates new messages for the feed based on templates and game state.
 * @param {GameState} gameState - Current game state.
 * @returns {GameState} - Updated gameState with new feed messages.
 */
export const generateNewMessages = (gameState: GameState): GameState => {
  let newFeedMessages = [...gameState.activeFeedMessages];
  const messageTemplates = gameState.messageTemplates; // From CSV

  // Example: Add one random message if feed is not full
  if (newFeedMessages.length < MAX_FEED_MESSAGES && messageTemplates.length > 0) {
    // TODO: Add logic based on probability, day, game events
    const randomIndex = Math.floor(Math.random() * messageTemplates.length);
    const template = messageTemplates[randomIndex];
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