import { Outlet } from "react-router";

import Header from "@/components/Header";
import Navbar from "@/components/Navbar";

const MainLayout = () => {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header />
      <main className="flex min-h-0 flex-1 flex-col-reverse min-[501px]:flex-row">
        <Navbar />
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
