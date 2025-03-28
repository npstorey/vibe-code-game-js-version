/**
 * File: src/components/feed/FeedItem.tsx
 * Project: Vibe Coding Simulator (MVP)
 * Description: Individual feed message display component
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
  const { id, title, body, type, action, timestamp } = message;

  // Format the timestamp for display
  const formattedTime = `Day ${Math.floor(timestamp / 86400000)}`;

  // Get the right styling based on message type
  const bgColor = 
    type === 'System' ? 'bg-blue-900' :
    type === 'Direct' ? 'bg-green-900' :
    'bg-purple-900'; // Social
  
  const borderColor = 
    type === 'System' ? 'border-blue-700' :
    type === 'Direct' ? 'border-green-700' :
    'border-purple-700'; // Social
  
  return (
    <div className={`p-3 rounded border ${borderColor} ${bgColor}`}>
      <h4 className="font-semibold">{title}</h4>
      <p className="text-sm text-gray-300 my-2">{body}</p>
      
      <div className="flex justify-between items-center mt-3">
        <span className="text-xs text-gray-400">{formattedTime}</span>
        
        <div className="flex space-x-2">
          {action === 'Accept Project' && (
            <button 
              onClick={() => onAction(id, 'accept')}
              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-xs rounded"
            >
              Accept
            </button>
          )}
          
          {/* Display different action buttons based on message type */}
          {action === 'Open' && (
            <button 
              onClick={() => onAction(id, 'accept')}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-xs rounded"
            >
              Open
            </button>
          )}
          
          {/* Always show Dismiss button */}
          <button 
            onClick={() => onAction(id, 'dismiss')}
            className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-xs rounded"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedItem; 