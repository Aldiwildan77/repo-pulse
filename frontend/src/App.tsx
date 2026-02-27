import { Routes, Route } from "react-router";
import { Analytics } from "@vercel/analytics/react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PublicRoute } from "@/components/auth/public-route";
import { LoginPage } from "@/pages/login";
import { LandingPage } from "@/pages/landing";
import { DashboardPage } from "@/pages/dashboard";
import { ProfilePage } from "@/pages/profile";
import { RepositoriesPage } from "@/pages/repositories";
import { RepositoryConfigPage } from "@/pages/repositories/config";
import { NotFoundPage } from "@/pages/not-found";

export default function App() {
  return (
    <>
    <Analytics />
    <Routes>
      <Route element={<PublicRoute />}>
        <Route index element={<LandingPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/repositories" element={<RepositoriesPage />} />
          <Route path="/repositories/new" element={<RepositoryConfigPage />} />
          <Route path="/repositories/:repoId/edit" element={<RepositoryConfigPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
}
