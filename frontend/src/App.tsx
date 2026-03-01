import { Routes, Route } from "react-router";
import { Analytics } from "@vercel/analytics/react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { LoginPage } from "@/pages/login";
import { LandingPage } from "@/pages/landing";
import { DashboardPage } from "@/pages/dashboard";
import { ProfilePage } from "@/pages/profile";
import { RepositoriesPage } from "@/pages/repositories";
import { RepositoryConfigPage } from "@/pages/repositories/config";
import { VerifyTotpPage } from "@/pages/verify-totp";
import { AuthErrorPage } from "@/pages/auth-error";
import { WorkspacesPage } from "@/pages/workspaces";
import { WorkspaceDetailPage } from "@/pages/workspaces/detail";
import { NotFoundPage } from "@/pages/not-found";
import { StatusPage } from "@/pages/status";
import { PrivacyPolicyPage } from "@/pages/privacy-policy";
import { TermsOfServicePage } from "@/pages/terms-of-service";

export default function App() {
  return (
    <>
    <Analytics />
    <Routes>
      <Route index element={<LandingPage />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-totp" element={<VerifyTotpPage />} />
        <Route path="/auth/error" element={<AuthErrorPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/workspaces" element={<WorkspacesPage />} />
          <Route path="/workspaces/:workspaceId" element={<WorkspaceDetailPage />} />
          <Route path="/repositories" element={<RepositoriesPage />} />
          <Route path="/repositories/new" element={<RepositoryConfigPage />} />
          <Route path="/repositories/:repoId/edit" element={<RepositoryConfigPage />} />
        </Route>
      </Route>

      <Route path="/status" element={<StatusPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
}
