import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/Toast';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BoardPage from './pages/BoardPage';
import SharedBoardPage from './pages/SharedBoardPage';
import CreateBoardPage from './pages/CreateBoardPage';
import ProfilePage from './pages/ProfilePage';
import LandingPage from './pages/LandingPage';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  return !user ? <>{children}</> : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <div className="app">
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/boards/create"
                element={
                  <ProtectedRoute>
                    <CreateBoardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/boards/:boardId"
                element={
                  <ProtectedRoute>
                    <BoardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route path="/shared/:boardId" element={<SharedBoardPage />} />
              <Route path="/" element={<LandingPage />} />
            </Routes>
          </div>
          <ToastContainer />
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
