import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { LoginPage } from './components/auth/LoginPage';
import { Layout } from './components/layout/Layout';
import { LegalPage } from './pages/LegalPage';
import { DealsPage } from './pages/DealsPage';
import { RealEstatePage } from './pages/RealEstatePage';
import { OthersPage } from './pages/OthersPage';
import { CalendarPage } from './pages/CalendarPage';
import { PeoplePage } from './pages/PeoplePage';
import { ItemDetailPage } from './components/items/ItemDetailPage';
import { AdminPage } from './pages/AdminPage';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected Routes */}
      <Route path="/" element={user ? <Layout /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to="/legal" replace />} />
        <Route path="legal" element={<LegalPage />} />
        <Route path="legal/:itemId" element={<ItemDetailPage />} />
        <Route path="deals" element={<DealsPage />} />
        <Route path="deals/:itemId" element={<ItemDetailPage />} />
        <Route path="real-estate" element={<RealEstatePage />} />
        <Route path="real-estate/:itemId" element={<ItemDetailPage />} />
        <Route path="others" element={<OthersPage />} />
        <Route path="others/:itemId" element={<ItemDetailPage />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="calendar" element={<CalendarPage />} />
        {user?.role === 'admin' && (
          <Route path="admin" element={<AdminPage />} />
        )}
      </Route>
      
      {/* Catch all - redirect to login if not authenticated, otherwise to legal */}
      <Route path="*" element={user ? <Navigate to="/legal" replace /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
          }}
        />
      </AuthProvider>
    </Router>
  );
}

export default App;