import React, { useState, useEffect } from 'react';
import type { ActivityEntry, User } from '../types';
import { apiClient } from '../api';
import '../styles/ActivityFeed.css';

interface ActivityFeedProps {
  boardId: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ boardId }) => {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const limit = 50;

  useEffect(() => {
    loadActivities();
  }, [boardId]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.getBoardActivity(boardId, limit, 0);
      setActivities(result.activities);
      setTotal(result.total);
      setOffset(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    try {
      const newOffset = offset + limit;
      const result = await apiClient.getBoardActivity(boardId, limit, newOffset);
      setActivities([...activities, ...result.activities]);
      setOffset(newOffset);
    } catch (err) {
      console.error('Failed to load more activities:', err);
    }
  };

  const getUserName = (user: User | string): string => {
    return typeof user === 'string' ? user : user.username;
  };

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      'note:added': 'added a note',
      'note:edited': 'edited a note',
      'note:deleted': 'deleted a note',
      'note:voted': 'voted on a note',
      'user:added': 'added a member',
      'user:joined': 'joined the board',
      'user:removed': 'removed a member',
      'user:role_changed': 'changed member role',
      'board:created': 'created the board',
    };
    return labels[action] || action;
  };

  if (error) {
    return (
      <div className="activity-feed error-state">
        <div className="error-message">{error}</div>
        <button onClick={loadActivities} className="btn btn-small">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="activity-feed">
      <div className="feed-header">
        <h3>Activity Log</h3>
        {!loading && <button onClick={loadActivities} className="btn-refresh" title="Refresh">⟳</button>}
      </div>

      {loading ? (
        <div className="loading">Loading activities...</div>
      ) : activities.length === 0 ? (
        <div className="empty-state">No activities yet</div>
      ) : (
        <>
          <div className="feed-items">
            {activities.map((activity) => (
              <div key={activity._id} className={`feed-item ${activity.action}`}>
                <div className="feed-item-header">
                  <span className="user-name">
                    {getUserName(activity.userId)}
                  </span>
                  <span className="action-label">
                    {getActionLabel(activity.action)}
                  </span>
                </div>

                {activity.details && (
                  <div className="feed-item-details">
                    {activity.details.username && (
                      <span className="detail-badge">@{activity.details.username}</span>
                    )}
                    {activity.details.role && (
                      <span className="detail-badge" style={{ backgroundColor: activity.details.role === 'editor' ? '#4CAF50' : '#2196F3' }}>
                        {activity.details.role}
                      </span>
                    )}
                    {activity.details.content && (
                      <span className="detail-content" title={activity.details.content}>
                        "{activity.details.content.substring(0, 50)}{activity.details.content.length > 50 ? '...' : ''}"
                      </span>
                    )}
                    {activity.details.hasVoted !== undefined && (
                      <span className="detail-badge">
                        {activity.details.hasVoted ? 'Voted' : 'Unvoted'}
                      </span>
                    )}
                  </div>
                )}

                <div className="feed-item-time">
                  {new Date(activity.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {offset + limit < total && (
            <button onClick={loadMore} className="btn btn-small btn-load-more">
              Load More ({offset + limit} of {total})
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ActivityFeed;
