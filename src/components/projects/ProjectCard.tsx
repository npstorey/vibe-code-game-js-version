/**
 * File: src/components/projects/ProjectCard.tsx
 * Project: Vibe Coding Simulator (MVP)
 * Description: Card component for displaying available project details
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import React from 'react';

export interface ProjectData {
  Project_ID: string;
  Name: string;
  Domain: string;
  Complexity: number;
  Reward: number;
  Baseline_Time: number;
  Error_Rate: number;
  YOLO_Success: number;
  Description?: string;
}

interface ProjectCardProps {
  project: ProjectData;
  onAssign: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onAssign }) => {
  return (
    <div className="bg-secondary border border-gray-700 rounded p-4 hover:bg-gray-750 cursor-pointer">
      <h4 className="font-bold text-lg text-primary">{project.Name}</h4>
      <div className="text-xs text-gray-400 mb-2">Domain: {project.Domain}</div>
      
      <div className="flex justify-between text-sm mb-2">
        <span>Complexity: {project.Complexity}</span>
        <span>Reward: {project.Reward} Credits</span>
      </div>
      
      <div className="flex justify-between text-sm mb-4">
        <span>Est. Time: {project.Baseline_Time} blocks</span>
        <span>Error Rate: {(project.Error_Rate * 100).toFixed(0)}%</span>
      </div>
      
      <button 
        onClick={() => onAssign(project.Project_ID)}
        className="w-full bg-action-green hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-sm"
      >
        Assign to GPU
      </button>
    </div>
  );
};

export default ProjectCard; 