import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Button from './ui/Button';
import { formatTime } from '../utils/time';

export interface PiPTimerProps {
  remainingMs: number;
  isRunning: boolean;
  isPaused: boolean;
  status: string;
  onToggle: () => void;
  onReset: () => void;
  onClose: () => void;
}

const PictureInPictureTimer: React.FC<PiPTimerProps> = ({
  remainingMs,
  isRunning,
  isPaused,
  status,
  onToggle,
  onReset,
  onClose
}) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number }>({
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0
  });

  const timerText = formatTime(remainingMs);

  // Handle dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y
    };
    e.preventDefault();
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    const newX = Math.max(0, Math.min(window.innerWidth - 300, dragRef.current.startPosX + deltaX));
    const newY = Math.max(0, Math.min(window.innerHeight - 200, dragRef.current.startPosY + deltaY));

    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 300),
        y: Math.min(prev.y, window.innerHeight - 200)
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const minimizedStyle = isMinimized ? 'h-16' : 'h-auto';

  return createPortal(
    <div
      className={`fixed z-[9999] bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 ${minimizedStyle} transition-all duration-300`}
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? '200px' : '300px',
        userSelect: 'none'
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-move bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-t-2xl"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {isMinimized ? timerText : 'Timer'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-6 h-6 rounded-full bg-yellow-500/20 hover:bg-yellow-500/30 flex items-center justify-center transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            <span className="text-xs text-yellow-600 dark:text-yellow-400">
              {isMinimized ? '□' : '—'}
            </span>
          </button>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-colors"
            title="Close"
          >
            <span className="text-xs text-red-600 dark:text-red-400">×</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-4 space-y-4">
          {/* Timer Display */}
          <div className="text-center">
            <div className="text-3xl font-mono font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {timerText}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {status}
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-2">
            <Button
              variant={isRunning ? 'danger' : 'success'}
              size="sm"
              onClick={onToggle}
              className="flex-1"
            >
              {isRunning ? 'Pause' : isPaused ? 'Resume' : 'Start'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon="refresh"
              onClick={onReset}
              title="Reset"
              className="px-3"
            >
            </Button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default PictureInPictureTimer;