import { Suspense, lazy } from "react";
import { Outlet } from "react-router";

import Header from "@/components/Header";
import Navbar from "@/components/Navbar";

// import daisyui theme devtool in development only
const ThemeStudio = import.meta.env.DEV
  ? lazy(() => import("@/dev/DaisyThemeStudio.tsx"))
  : null;

const MainLayout = () => {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header />
      <main className="flex min-h-0 flex-1 flex-col-reverse min-[501px]:flex-row">
        <Navbar />
        <div className="size-full flex-1 overflow-y-auto bg-neutral">
          <Outlet />
        </div>
      </main>
      {ThemeStudio && (
        <Suspense fallback={null}>
          <ThemeStudio />
        </Suspense>
      )}
    </div>
  );
};

export default MainLayout;
