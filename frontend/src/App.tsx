import { Route, Routes } from "react-router";

import MainLayout from "@/layouts/MainLayout";
import AuthTest from "@/routes/AuthTest";
import Home from "@/routes/Home";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="auth-test" element={<AuthTest />} />
      </Route>
    </Routes>
  );
}

export default App;
