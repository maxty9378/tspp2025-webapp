import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TasksPage } from './pages/TasksPage';
import { ChatPage } from './pages/ChatPage';
import { LoadingScreen } from './components/LoadingScreen';
import { useAuth } from './hooks/useAuth';

// Lazy load routes
const UsersPage = lazy(() => import('./pages/UsersPage').then(module => ({ default: module.UsersPage })));
const ProgramPage = lazy(() => import('./pages/ProgramPage').then(module => ({ default: module.ProgramPage })));
const TestsPage = lazy(() => import('./pages/TestsPage').then(module => ({ default: module.TestsPage })));
const PowerUpPage = lazy(() => import('./pages/PowerUpPage').then(module => ({ default: module.PowerUpPage })));
const RulesPage = lazy(() => import('./pages/RulesPage').then(module => ({ default: module.RulesPage })));
const AOSPage = lazy(() => import('./pages/AOSPage').then(module => ({ default: module.AOSPage })));
const ParticipantsPage = lazy(() => import('./pages/ParticipantsPage').then(module => ({ default: module.ParticipantsPage })));

function App() {
  const { currentUser, isWebAppReady, error } = useAuth();

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-center">
        <div className="card bg-red-500/10 border border-red-500/30 p-8 max-w-md w-full">
          <h2 className="text-2xl font-semibold text-red-300 mb-4">
            Что-то пошло не так
          </h2>
          <p className="text-slate-300 mb-4">
            Произошла ошибка при загрузке приложения. Пожалуйста, обновите страницу.
          </p>
          {error && (
            <pre className="text-sm text-red-300 bg-red-500/5 p-4 rounded-lg mb-6 overflow-auto">
              {error}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-500/20 text-red-300 border border-red-500/30 py-3 px-6 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
          >
            Обновить страницу
          </button>
        </div>
      </div>
    );
  }

  if (!isWebAppReady) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Layout><HomePage currentUser={currentUser} /></Layout>} />
          <Route path="/users" element={
            <Suspense fallback={<LoadingScreen />}>
              <ErrorBoundary>
                <Layout><UsersPage currentUser={currentUser} /></Layout>
              </ErrorBoundary>
            </Suspense>
          } />
          <Route path="/program" element={
            <Suspense fallback={<LoadingScreen />}>
              <ErrorBoundary>
                <Layout><ProgramPage /></Layout>
              </ErrorBoundary>
            </Suspense>
          } />
          <Route path="/tasks" element={
            <Suspense fallback={<LoadingScreen />}>
              <ErrorBoundary>
                <Layout><TasksPage /></Layout>
              </ErrorBoundary>
            </Suspense>
          } />
          <Route path="/tests" element={
            <Suspense fallback={<LoadingScreen />}>
              <ErrorBoundary>
                <Layout><TestsPage /></Layout>
              </ErrorBoundary>
            </Suspense>
          } />
          <Route path="/power-up" element={
            <Suspense fallback={<LoadingScreen />}>
              <ErrorBoundary>
                <Layout><PowerUpPage /></Layout>
              </ErrorBoundary>
            </Suspense>
          } />
          <Route path="/chat" element={
            <Suspense fallback={<LoadingScreen />}>
              <ErrorBoundary>
                <ChatPage />
              </ErrorBoundary>
            </Suspense>
          } />
          <Route path="/rules" element={
            <Suspense fallback={<LoadingScreen />}>
              <ErrorBoundary>
                <Layout><RulesPage /></Layout>
              </ErrorBoundary>
            </Suspense>
          } />
          <Route path="/aos/:programId" element={
            <Suspense fallback={<LoadingScreen />}>
              <ErrorBoundary>
                <Layout><AOSPage /></Layout>
              </ErrorBoundary>
            </Suspense>
          } />
          <Route path="/participants" element={
            <Suspense fallback={<LoadingScreen />}>
              <ErrorBoundary>
                <Layout><ParticipantsPage /></Layout>
              </ErrorBoundary>
            </Suspense>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;