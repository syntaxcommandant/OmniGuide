import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { GuidelinesPage } from './pages/GuidelinesPage';
import { NewReviewPage } from './pages/NewReviewPage';
import { ReviewResultsPage } from './pages/ReviewResultsPage';
import { ReviewHistoryPage } from './pages/ReviewHistoryPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="guidelines" element={<GuidelinesPage />} />
          <Route path="reviews/new" element={<NewReviewPage />} />
          <Route path="reviews/:id" element={<ReviewResultsPage />} />
          <Route path="reviews" element={<ReviewHistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
