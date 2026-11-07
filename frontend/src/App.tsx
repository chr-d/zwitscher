import { Route, Routes } from "react-router";

import MainLayout from "@/layouts/MainLayout";
import AuthTest from "@/routes/AuthTest";
import Home from "@/routes/Home";
import Login from "@/routes/Login";
import Register from "@/routes/Register";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="auth-test" element={<AuthTest />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>
    </Routes>
  );
}

export default App;
