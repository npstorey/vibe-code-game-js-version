/**
 * File: src/components/gpu/GpuSlot.tsx
 * Project: Vibe Coding Simulator (MVP)
 * Description: Displays the status of a single GPU, including assigned project and potentially progress.
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import React from 'react';

interface GpuSlotProps {
  gpuId: number;
  project: string | null;
  status: 'running' | 'error' | 'completed' | 'failed' | 'idle';
  progress: number;
}

const GpuSlot: React.FC<GpuSlotProps> = ({ gpuId, project, status, progress }) => {
  const isActive = status === 'running' || status === 'error';
  const bgColor = 
    status === 'running' ? 'bg-blue-600 hover:bg-blue-700' :
    status === 'error' ? 'bg-red-600 hover:bg-red-700' :
    status === 'completed' ? 'bg-green-600 hover:bg-green-700' :
    status === 'failed' ? 'bg-orange-600 hover:bg-orange-700' :
    'bg-gray-700 hover:bg-gray-600';
    
  const borderColor = 
    status === 'running' ? 'border-blue-500' :
    status === 'error' ? 'border-red-500' :
    status === 'completed' ? 'border-green-500' :
    status === 'failed' ? 'border-orange-500' :
    'border-gray-600';

  // Format progress as percentage
  const progressPercent = Math.round(progress * 100);

  return (
    <div className={`p-4 rounded border ${borderColor} ${bgColor} transition-colors cursor-pointer`}>
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">GPU #{gpuId}</span>
        {isActive && <input type="checkbox" checked readOnly className="form-checkbox h-4 w-4 text-green-500 rounded focus:ring-0" />}
      </div>
      <p className="text-sm text-gray-300 truncate">{project || 'No project'}</p>
      
      {/* Progress bar for active or completed projects */}
      {project && (
        <div className="mt-2">
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${status === 'running' ? 'bg-blue-500' : status === 'error' ? 'bg-red-500' : status === 'completed' ? 'bg-green-500' : 'bg-orange-500'}`} 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="text-xs text-right mt-1">{progressPercent}%</div>
        </div>
      )}
      
      {/* Status indicator */}
      {project && (
        <div className="mt-1 text-xs">
          <span className={`
            ${status === 'running' ? 'text-blue-300' : 
              status === 'error' ? 'text-red-300' : 
              status === 'completed' ? 'text-green-300' : 
              'text-orange-300'}
          `}>
            {status.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
};

export default GpuSlot; 