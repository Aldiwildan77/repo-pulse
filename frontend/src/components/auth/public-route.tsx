import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/hooks/use-auth";

export function PublicRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Outlet />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
