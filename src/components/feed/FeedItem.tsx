/**
 * File: src/components/feed/FeedItem.tsx
 * Project: Vibe Coding Simulator (MVP)
 * Description: Individual message item for the feed.
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import React from 'react';
import { FeedMessage } from '../../logic/feedLogic';

interface FeedItemProps {
  message: FeedMessage;
  onAction: (messageId: string, action: 'accept' | 'dismiss' | 'archive') => void;
}

const FeedItem: React.FC<FeedItemProps> = ({ message, onAction }) => {
  // Format the timestamp into a readable format
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Determine the background color based on message type
  const bgColor = 
    message.type === 'System' ? 'bg-blue-900 border-blue-700' : 
    message.type === 'Direct' ? 'bg-green-900 border-green-700' : 
    'bg-purple-900 border-purple-700'; // Social
    
  return (
    <div className={`p-3 rounded border ${bgColor}`}>
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-bold">{message.title}</h4>
        <span className="text-xs text-gray-400">{formattedTime}</span>
      </div>
      
      <div className="text-sm mb-3">{message.body}</div>
      
      <div className="flex justify-end space-x-2 text-xs">
        {message.action === 'Accept Project' && (
          <button 
            onClick={() => onAction(message.id, 'accept')}
            className="bg-green-700 hover:bg-green-600 px-2 py-1 rounded"
          >
            Accept Project
          </button>
        )}
        
        {message.action === 'Open' && (
          <button 
            onClick={() => onAction(message.id, 'accept')}
            className="bg-blue-700 hover:bg-blue-600 px-2 py-1 rounded"
          >
            Open
          </button>
        )}
        
        <button 
          onClick={() => onAction(message.id, 'dismiss')}
          className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default FeedItem; 