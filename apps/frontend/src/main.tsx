import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './ui/AppShell';
import { CampaignDetailPage } from './ui/CampaignDetailPage';
import { ConfigurationPage } from './ui/ConfigurationPage';
import { DashboardPage } from './ui/DashboardPage';
import { LoginPage } from './ui/LoginPage';
import { ServiceDetailPage } from './ui/ServiceDetailPage';
import './styles.css';

const queryClient = new QueryClient();

function Protected({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('accessToken') ? <>{children}</> : <Navigate to="/login" replace />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <Protected>
                <AppShell />
              </Protected>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="configuration" element={<ConfigurationPage />} />
            <Route path="campaigns/:id" element={<CampaignDetailPage />} />
            <Route path="services/:id" element={<ServiceDetailPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
