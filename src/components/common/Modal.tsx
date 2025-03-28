/**
 * File: src/components/common/Modal.tsx
 * Project: Vibe Coding Simulator (MVP)
 * Description: Reusable modal component
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-70" 
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4 z-10">
        <div className="flex justify-between items-center mb-4">
          {title && <h3 className="text-xl font-semibold">{title}</h3>}
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div className="mt-2">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal; 