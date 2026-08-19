import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { apiClient } from '../api';
import '../styles/ProfilePage.css';

const ProfilePage: React.FC = () => {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Username edit
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await apiClient.getProfile();
      setUsername(response.user.username);
      setEmail(response.user.email);
      setCreatedAt(response.user.createdAt);
    } catch (err) {
      addToast('Failed to load profile', 'error');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || newUsername.trim() === username) {
      setIsEditingUsername(false);
      return;
    }
    setIsSavingUsername(true);
    try {
      const response = await apiClient.updateProfile({ username: newUsername.trim() });
      setUsername(response.user.username);
      setIsEditingUsername(false);
      addToast('Username updated successfully', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to update username', 'error');
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }
    setIsChangingPassword(true);
    try {
      await apiClient.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast('Password changed successfully', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to change password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="header-content">
          <Link to="/" className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity text-decoration-none">
            <div className="w-5 h-5 bg-[#3366cc] rounded-sm rotate-45"></div>
            <span className="text-xl font-bold font-manrope tracking-tight">RetroBoard</span>
          </Link>
          <h1>My Profile</h1>
          <button onClick={() => navigate('/dashboard')} className="back-button">
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="profile-main">
        {/* User Info Card */}
        <div className="profile-card">
          <div className="profile-avatar">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="profile-details">
            <div className="profile-field">
              <label>Username</label>
              {isEditingUsername ? (
                <form onSubmit={handleSaveUsername} className="inline-edit-form">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="profile-input"
                    autoFocus
                    maxLength={30}
                  />
                  <div className="inline-edit-actions">
                    <button type="submit" className="save-btn" disabled={isSavingUsername}>
                      {isSavingUsername ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" className="cancel-btn" onClick={() => setIsEditingUsername(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="field-value-row">
                  <span className="field-value">{username}</span>
                  <button
                    className="edit-field-btn"
                    onClick={() => { setNewUsername(username); setIsEditingUsername(true); }}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
            <div className="profile-field">
              <label>Email</label>
              <span className="field-value">{email}</span>
            </div>
            <div className="profile-field">
              <label>Member Since</label>
              <span className="field-value">
                {new Date(createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Password Change Card */}
        <div className="profile-card password-card">
          <h2>Change Password</h2>
          <form onSubmit={handleChangePassword} className="password-form">
            <div className="form-group">
              <label htmlFor="current-password">Current Password</label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="profile-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="profile-input"
                required
                minLength={6}
              />
              {newPassword && (
                <div className="password-strength">
                  <div
                    className={`strength-bar ${
                      newPassword.length >= 12 ? 'strong' : newPassword.length >= 8 ? 'medium' : 'weak'
                    }`}
                  />
                  <span className="strength-label">
                    {newPassword.length >= 12 ? 'Strong' : newPassword.length >= 8 ? 'Medium' : 'Weak'}
                  </span>
                </div>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm New Password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="profile-input"
                required
                minLength={6}
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <span className="field-error">Passwords do not match</span>
              )}
            </div>
            <button
              type="submit"
              className="change-password-btn"
              disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
            >
              {isChangingPassword ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
