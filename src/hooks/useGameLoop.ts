/**
 * File: src/hooks/useGameLoop.ts
 * Project: Vibe Coding Simulator (MVP)
 * Description: Custom hook to handle automatic game time advancement.
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import { useState, useEffect, useContext, useRef } from 'react';
import { GameContext } from '../contexts/GameContext';

interface UseGameLoopOptions {
  autoAdvance?: boolean;
  initialSpeed?: 'slow' | 'medium' | 'fast'; // Milliseconds between advancements
  disabled?: boolean;
}

// Speeds in milliseconds between time blocks
const SPEEDS = {
  slow: 10000,    // 10 seconds
  medium: 5000,   // 5 seconds
  fast: 2000      // 2 seconds
};

export const useGameLoop = (options: UseGameLoopOptions = {}) => {
  const {
    autoAdvance = false,
    initialSpeed = 'medium',
    disabled = false
  } = options;

  const [isRunning, setIsRunning] = useState<boolean>(autoAdvance);
  const [speed, setSpeed] = useState<'slow' | 'medium' | 'fast'>(initialSpeed);
  
  const context = useContext(GameContext);
  
  // Use a ref to keep track of the interval ID and avoid re-creating the effect
  const intervalRef = useRef<number | null>(null);
  
  // Start/stop the game loop
  const toggleGameLoop = () => {
    setIsRunning(prev => !prev);
  };
  
  // Change the speed
  const changeSpeed = (newSpeed: 'slow' | 'medium' | 'fast') => {
    setSpeed(newSpeed);
  };
  
  // Clear the interval on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Set up or tear down the interval when isRunning or speed changes
  useEffect(() => {
    if (!context || disabled) {
      return;
    }
    
    if (isRunning) {
      // Clear any existing interval
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
      
      // Set up a new interval
      intervalRef.current = window.setInterval(() => {
        context.actions.advanceTime(1);
      }, SPEEDS[speed]);
    } else if (intervalRef.current !== null) {
      // If not running, clear the interval
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, speed, context, disabled]);
  
  return {
    isRunning,
    speed,
    toggleGameLoop,
    changeSpeed
  };
}; 