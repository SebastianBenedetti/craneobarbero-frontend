import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "../../context/AuthContext";
import ScrollToTop from "../ScrollToTop/ScrollToTop";
import ProtectedRoute from "../ProtectedRoute/ProtectedRoute";
import Layout from "../Layout/Layout";

import AppointmentPage from "../../pages/public/AppointmentPage";
import HomePage from "../../pages/public/HomePage";
import LoginPage from "../../pages/public/LoginPage";
import AboutPage from "../../pages/public/AboutPage";
import NotFoundPage from "../../pages/public/NotFoundPage";
import BarberDashboardPage from "../../pages/barber/BarberDashboardPage";
import BarberSchedulePage from "../../pages/barber/BarberSchedulePage";
import MyAppointmentsPage from "../../pages/client/MyAppointmentsPage";
import MyAccountPage from "../../pages/account/MyAccountPage";
import BarberClientsPage from "../../pages/barber/BarberClientsPage";
import VerifyEmailPage from "../../pages/public/VerifyEmailPage";
import ForgotPasswordPage from "../../pages/public/ForgotPasswordPage";
import ResetPasswordPage from "../../pages/public/ResetPasswordPage";
import PaymentReturnPage from "../../pages/client/PaymentReturnPage";
import AdminDashboardPage from "../../pages/admin/AdminDashboardPage";
import AdminManagePage from "../../pages/admin/AdminManagePage";
import AdminAgendaPage from "../../pages/admin/AdminAgendaPage";
import AdminPricesPage from "../../pages/admin/AdminPricesPage";

function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/appointment" element={<AppointmentPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route element={<ProtectedRoute roles={["barber"]} />}>
              <Route path="/barber">
                <Route index element={<BarberDashboardPage />} />
                <Route path="schedule" element={<BarberSchedulePage />} />
                <Route path="clients" element={<BarberClientsPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute roles={["client"]} />}>
              <Route path="/payments/return" element={<PaymentReturnPage />} />
              <Route path="/my-account/appointments" element={<MyAppointmentsPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/my-account">
                <Route index element={<MyAccountPage />} />
                <Route path="change-password" element={<Navigate to="/my-account" replace />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute roles={["admin"]} />}>
              <Route path="/admin">
                <Route index element={<AdminDashboardPage />} />
                <Route path="manage" element={<AdminManagePage />} />
                <Route path="agenda" element={<AdminAgendaPage />} />
                <Route path="prices" element={<AdminPricesPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRouter;
