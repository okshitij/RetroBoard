import React, { useState, useEffect } from 'react';
import { socketService } from '../services/socketService';

interface PresenceIndicatorProps {
  boardId: string;
}

const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({ boardId }) => {
  const [userCount, setUserCount] = useState(1); // Start with 1 (current user)

  useEffect(() => {
    const handleUserJoined = () => {
      setUserCount(prev => prev + 1);
    };

    const handleUserLeft = () => {
      setUserCount(prev => Math.max(0, prev - 1));
    };

    socketService.onUserJoined(handleUserJoined);
    socketService.onUserLeft(handleUserLeft);

    return () => {
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