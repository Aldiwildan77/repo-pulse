import { Outlet } from "react-router";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
          <Footer />
        </main>
      </div>
    </div>
  );
}
