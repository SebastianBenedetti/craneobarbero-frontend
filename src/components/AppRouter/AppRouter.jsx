import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "../../context/AuthContext";
import { CartProvider } from "../../context/CartProvider";
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
import LegalPage from "../../pages/public/LegalPage";
import PaymentReturnPage from "../../pages/client/PaymentReturnPage";
import AdminDashboardPage from "../../pages/admin/AdminDashboardPage";
import AdminManagePage from "../../pages/admin/AdminManagePage";
import AdminAgendaPage from "../../pages/admin/AdminAgendaPage";
import AdminPricesPage from "../../pages/admin/AdminPricesPage";
import AdminReportsPage from "../../pages/admin/AdminReportsPage";
import BarberReportsPage from "../../pages/barber/BarberReportsPage";
import BarberReviewsPage from "../../pages/barber/BarberReviewsPage";
import AdminStorePage from "../../pages/admin/AdminStorePage";
import ShopPage from "../../pages/client/ShopPage";
import MyPurchasesPage from "../../pages/client/MyPurchasesPage";

function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
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
              <Route path="/terms" element={<LegalPage type="terms" />} />
              <Route path="/privacy" element={<LegalPage type="privacy" />} />

              <Route element={<ProtectedRoute roles={["barber"]} />}>
                <Route path="/barber">
                  <Route index element={<BarberDashboardPage />} />
                  <Route path="schedule" element={<BarberSchedulePage />} />
                  <Route path="clients" element={<BarberClientsPage />} />
                  <Route path="reports" element={<BarberReportsPage />} />
                  <Route path="reviews" element={<BarberReviewsPage />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute roles={["client"]} />}>
                <Route path="/payments/return" element={<PaymentReturnPage />} />
                <Route path="/my-account/appointments" element={<MyAppointmentsPage />} />
                <Route path="/my-account/purchases" element={<MyPurchasesPage />} />
                <Route path="/shop" element={<ShopPage />} />
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
                  <Route path="reports" element={<AdminReportsPage />} />
                  <Route path="store" element={<AdminStorePage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRouter;
