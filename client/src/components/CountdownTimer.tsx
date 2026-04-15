import React, { useState, useEffect } from 'react';
import { socketService } from '../services/socketService';

interface CountdownTimerProps {
  boardId: string;
  isGuest: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ boardId, isGuest }) => {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(5); // Default 5 minutes

  useEffect(() => {
    const handleTimerTick = (remainingTime: number) => {
      setRemaining(remainingTime);
      setIsRunning(remainingTime > 0);
    };

    const handleTimerStopped = () => {
      setRemaining(null);
      setIsRunning(false);
    };

    const handleTimerEnded = () => {
      setRemaining(null);
      setIsRunning(false);
    };

    socketService.onTimerTick(handleTimerTick);
    socketService.onTimerStopped(handleTimerStopped);
    socketService.onTimerEnded(handleTimerEnded);

    return () => {
      socketService.off('timer:tick', handleTimerTick);
      socketService.off('timer:stopped', handleTimerStopped);
      socketService.off('timer:ended', handleTimerEnded);
    };
  }, []);

  const startTimer = () => {
    if (isGuest) return;

    const durationSeconds = duration * 60; // Convert minutes to seconds
    socketService.startTimer({
      boardId,
      durationSeconds,
    });
    setRemaining(durationSeconds);
    setIsRunning(true);
  };

  const stopTimer = () => {
    setRemaining(null);
    setIsRunning(false);
    socketService.stopTimer({ boardId });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="countdown-timer">
      {!isRunning && !remaining && (
        <div className="timer-setup">
          <label htmlFor="duration">Duration (minutes):</label>
          <select
            id="duration"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            disabled={isGuest}
          >
            <option value={1}>1 minute</option>
            <option value={2}>2 minutes</option>
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
          </select>
          <button
            onClick={startTimer}
            disabled={isGuest}
            className="start-timer-button"
          >
            Start Timer
          </button>
        </div>
      )}

      {(isRunning || remaining) && (
        <div className="timer-display">
          <div className="timer-circle">
            <span className="timer-text">
              {remaining !== null ? formatTime(remaining) : '0:00'}
            </span>
          </div>
          {!isGuest && (
            <button
              onClick={stopTimer}
              className="stop-timer-button"
            >
              Stop Timer
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CountdownTimer;