import React, { useState, useEffect } from 'react';
import { socketService } from '../services/socketService';

interface PresenceIndicatorProps {
  boardId: string;
}

const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({ boardId }) => {
  const [userCount, setUserCount] = useState(1); // Start with 1 (current user)

  useEffect(() => {
    let currentCount = 1;

    socketService.joinBoard(boardId);

    const handleUserJoined = () => {
      currentCount += 1;
      setUserCount(currentCount);
    };

    const handleUserLeft = () => {
      currentCount = Math.max(0, currentCount - 1);
      setUserCount(currentCount);
    };

    socketService.onUserJoined(handleUserJoined);
    socketService.onUserLeft(handleUserLeft);

    return () => {
      socketService.leaveBoard(boardId);
      socketService.off('user:joined', handleUserJoined);
      socketService.off('user:left', handleUserLeft);
    };
  }, [boardId]);

  return (
    <div className="presence-indicator">
      <div className="presence-icon">
        👥
      </div>
      <span className="presence-count">
        {userCount} {userCount === 1 ? 'person' : 'people'} here
      </span>
    </div>
  );
};

export default PresenceIndicator;