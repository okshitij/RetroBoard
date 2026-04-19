import React, { useState } from 'react';
import type { BoardMember, User } from '../types';
import { apiClient } from '../api';
import '../styles/MemberSidebar.css';

interface MemberSidebarProps {
  boardId: string;
  members: BoardMember[];
  owner: User;
  currentUserId: string;
  isOwner: boolean;
  onMemberRemoved: (userId: string) => void;
  onMemberRoleChanged: (userId: string, newRole: 'editor' | 'viewer') => void;
}

export const MemberSidebar: React.FC<MemberSidebarProps> = ({
  boardId,
  members,
  owner,
  currentUserId,
  isOwner,
  onMemberRemoved,
  onMemberRoleChanged,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Remove this member from the board?')) return;

    try {
      setLoading(userId);
      setError(null);
      await apiClient.removeBoardMember(boardId, userId);
      onMemberRemoved(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'editor' | 'viewer') => {
    try {
      setLoading(userId);
      setError(null);
      await apiClient.updateMemberRole(boardId, userId, newRole);
      onMemberRoleChanged(userId, newRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setLoading(null);
    }
  };

  const getUserName = (user: User | string): string => {
    return typeof user === 'string' ? user : user.username;
  };

  const getUserId = (member: BoardMember | User): string => {
    if ('userId' in member) {
      return typeof member.userId === 'string' ? member.userId : member.userId.id || member.userId._id || '';
    }
    return member.id || member._id || '';
  };

  return (
    <div className="member-sidebar">
      <div className="sidebar-header">
        <h3>Members ({members.length + 1})</h3>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="members-list">
        {/* Board Owner */}
        <div className="member-item owner">
          <div className="member-info">
            <div className="member-name">{getUserName(owner)}</div>
            <div className="member-role-badge owner">Owner</div>
          </div>
        </div>

        {/* Members */}
        {members.map((member) => {
          const userId = getUserId(member);
          const userName = typeof member.userId === 'string' ? member.userId : member.userId.username;
          const isCurrentUser = userId === currentUserId;
          const isDisabled = loading === userId;

          return (
            <div key={userId} className={`member-item ${isCurrentUser ? 'current-user' : ''}`}>
              <div className="member-info">
                <div className="member-name">
                  {userName}
                  {isCurrentUser && <span className="current-badge"> (You)</span>}
                </div>
                <div className="member-details">
                  <div className="member-role-badge" style={{ backgroundColor: member.role === 'editor' ? '#4CAF50' : '#2196F3' }}>
                    {member.role}
                  </div>
                  <div className="member-joined">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {isOwner && !isCurrentUser && (
                <div className="member-actions">
                  {member.role === 'editor' ? (
                    <button
                      onClick={() => handleRoleChange(userId, 'viewer')}
                      disabled={isDisabled}
                      className="btn-small btn-viewer"
                      title="Change to viewer"
                    >
                      Viewer
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRoleChange(userId, 'editor')}
                      disabled={isDisabled}
                      className="btn-small btn-editor"
                      title="Change to editor"
                    >
                      Editor
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveMember(userId)}
                    disabled={isDisabled}
                    className="btn-small btn-remove"
                    title="Remove member"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MemberSidebar;
