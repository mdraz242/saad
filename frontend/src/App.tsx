import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { CreateRequestPage } from './pages/CreateRequestPage';
import { FindCasePage } from './pages/FindCasePage';
import { CustomerCaseDashboard } from './pages/CustomerCaseDashboard';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminCaseInboxPage } from './pages/admin/AdminCaseInboxPage';
import { AdminCaseDetailPage } from './pages/admin/AdminCaseDetailPage';
import { AdminProjectsPage } from './pages/admin/AdminProjectsPage';
import { AdminProjectDetailPage } from './pages/admin/AdminProjectDetailPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminCustomerDetailPage } from './pages/admin/AdminCustomerDetailPage';
import { AdminQuotationsPage } from './pages/admin/AdminQuotationsPage';
import { AdminMessagesPage } from './pages/admin/AdminMessagesPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminStaffPage } from './pages/admin/AdminStaffPage';
import { AdminPermissionsPage } from './pages/admin/AdminPermissionsPage';
import { AdminActivityLogsPage } from './pages/admin/AdminActivityLogsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Employee Workspace Pages
import { EmployeeLayout } from './pages/employee/EmployeeLayout';
import { EmployeeDashboardPage } from './pages/employee/EmployeeDashboardPage';
import { EmployeeProductsPage } from './pages/employee/EmployeeProductsPage';
import { EmployeeProfilePage } from './pages/employee/EmployeeProfilePage';

// Public layout wrapper that includes the customer Navbar and Footer
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Website Routes */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <HomePage />
            </PublicLayout>
          }
        />
        <Route
          path="/create-request"
          element={
            <PublicLayout>
              <CreateRequestPage />
            </PublicLayout>
          }
        />
        <Route
          path="/find-case"
          element={
            <PublicLayout>
              <FindCasePage />
            </PublicLayout>
          }
        />
        <Route
          path="/case"
          element={
            <div className="min-h-screen bg-surface-bg flex flex-col">
              <CustomerCaseDashboard />
              <Footer />
            </div>
          }
        />
        <Route
          path="/privacy"
          element={
            <PublicLayout>
              <PrivacyPolicyPage />
            </PublicLayout>
          }
        />

        {/* Staff Authentication Route */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/employee/login" element={<Navigate to="/admin/login" replace />} />

        {/* PART 2: Administrator Workspace Routes (/admin) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="cases" element={<AdminCaseInboxPage />} />
          <Route path="cases/:id" element={<AdminCaseDetailPage />} />
          <Route path="projects" element={<AdminProjectsPage />} />
          <Route path="projects/:id" element={<AdminProjectDetailPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="customers/:id" element={<AdminCustomerDetailPage />} />
          <Route path="quotations" element={<AdminQuotationsPage />} />
          <Route path="messages" element={<AdminMessagesPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="staff" element={<AdminStaffPage />} />
          <Route path="permissions" element={<AdminPermissionsPage />} />
          <Route path="activity-logs" element={<AdminActivityLogsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* PART 3: Employee Workspace Routes (/employee) */}
        <Route path="/employee" element={<EmployeeLayout />}>
          <Route index element={<Navigate to="/employee/dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboardPage />} />
          <Route path="cases" element={<AdminCaseInboxPage />} />
          <Route path="cases/:id" element={<AdminCaseDetailPage />} />
          <Route path="projects" element={<AdminProjectsPage />} />
          <Route path="projects/:id" element={<AdminProjectDetailPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="customers/:id" element={<AdminCustomerDetailPage />} />
          <Route path="quotations" element={<AdminQuotationsPage />} />
          <Route path="messages" element={<AdminMessagesPage />} />
          <Route path="products" element={<EmployeeProductsPage />} />
          <Route path="profile" element={<EmployeeProfilePage />} />
          <Route path="change-password" element={<EmployeeProfilePage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
