/**
 * File: src/hooks/useGameLoop.ts
 * Project: Vibe Coding Simulator (MVP)
 * Description: Custom hook to handle automatic game time advancement.
 * Author: Claude 3.7 Sonnet
 * Date: 2024-07-30
 */
import { useState, useEffect, useContext, useRef, useCallback } from 'react';
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

// Number of progress updates per time block - higher number = smoother updates
const PROGRESS_STEPS = 100;

export const useGameLoop = (options: UseGameLoopOptions = {}) => {
  const {
    autoAdvance = false,
    initialSpeed = 'medium',
    disabled = false
  } = options;

  const [isRunning, setIsRunning] = useState<boolean>(autoAdvance);
  const [speed, setSpeed] = useState<'slow' | 'medium' | 'fast'>(initialSpeed);
  
  const context = useContext(GameContext);
  
  // Store action references to avoid dependency issues
  // These should be stable due to useCallback in GameContext
  const setBlockProgressValue = context?.actions.setBlockProgressValue;
  const advanceTime = context?.actions.advanceTime;
  
  // Use a ref to keep track of the interval ID and avoid re-creating the effect
  const intervalRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  
  // Store the current step in a ref to avoid closure issues
  const currentStepRef = useRef<number>(0);
  
  // Start/stop the game loop
  const toggleGameLoop = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);
  
  // Change the speed
  const changeSpeed = useCallback((newSpeed: 'slow' | 'medium' | 'fast') => {
    setSpeed(newSpeed);
  }, []);
  
  // Set up the game loop logic as a callback to avoid re-creating it
  const setupGameLoop = useCallback(() => {
    if (!setBlockProgressValue || !advanceTime || disabled) return;
    
    // Clear any existing intervals
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (progressIntervalRef.current !== null) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Reset the current step
    currentStepRef.current = 0;
    
    // Reset blockProgress in context
    setBlockProgressValue(0);
    
    // Setup progress interval (for visual feedback)
    const progressStepDuration = SPEEDS[speed] / PROGRESS_STEPS;
    
    progressIntervalRef.current = window.setInterval(() => {
      // Increment the step
      currentStepRef.current = (currentStepRef.current + 1) % PROGRESS_STEPS;
      
      // Calculate progress (0 to 0.95)
      const progress = currentStepRef.current / PROGRESS_STEPS;
      
      // Update the blockProgress in context
      setBlockProgressValue(progress);
      
      console.log(`[useGameLoop] Block progress: ${progress.toFixed(2)} (Context Updated)`);
    }, progressStepDuration);
    
    // Set up the main interval for time block advancement
    intervalRef.current = window.setInterval(() => {
      // Reset progress
      currentStepRef.current = 0;
      
      // Reset blockProgress in context
      setBlockProgressValue(0);
      
      console.log('Advancing time block, resetting progress');
      
      // Advance the game time
      advanceTime(1);
    }, SPEEDS[speed]);
  }, [speed, disabled, setBlockProgressValue, advanceTime]);
  
  // Clear the interval on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
      if (progressIntervalRef.current !== null) {
        window.clearInterval(progressIntervalRef.current);
      }
    };
  }, []);
  
  // Set up or tear down the interval when isRunning or speed changes
  useEffect(() => {
    if (isRunning) {
      setupGameLoop();
    } else {
      // If not running, clear all intervals
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (progressIntervalRef.current !== null) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      // Reset blockProgress in context when stopping
      if (setBlockProgressValue) {
        setBlockProgressValue(0);
      }
    }
    
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
      if (progressIntervalRef.current !== null) {
        window.clearInterval(progressIntervalRef.current);
      }
    };
  }, [isRunning, setupGameLoop, setBlockProgressValue]);
  
  return {
    isRunning,
    speed,
    blockProgress: context ? context.gameState.blockProgress : 0,
    toggleGameLoop,
    changeSpeed
  };
}; 