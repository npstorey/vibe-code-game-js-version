/**
 * File: src/components/feed/FeedContainer.tsx
 * Project: Vibe Coding Simulator (MVP)
 * Description: Container component for displaying the message feed.
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import React, { useContext } from 'react';
import FeedItem from './FeedItem';
import { GameContext } from '../../contexts/GameContext';
import { FeedMessage } from '../../logic/feedLogic';

const FeedContainer: React.FC = () => {
  const context = useContext(GameContext);
  
  if (!context) {
    return <div>Loading message feed...</div>;
  }
  
  const { gameState, actions } = context;
  const { activeFeedMessages } = gameState;
  
  // Call the action handler from context
  const handleFeedAction = (messageId: string, action: 'accept' | 'dismiss' | 'archive') => {
    actions.handleFeedMessageAction(messageId, action);
  };
  
  return (
    <div className="bg-gray-800 border border-gray-700 rounded p-4">
      <h3 className="text-xl font-semibold mb-4">Message Feed</h3>
      
      {activeFeedMessages.length === 0 ? (
        <p className="text-gray-400">No new messages.</p>
      ) : (
        <div className="space-y-4">
          {activeFeedMessages.map((message: FeedMessage) => (
            <FeedItem 
              key={message.id}
              message={message}
              onAction={handleFeedAction}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedContainer; 