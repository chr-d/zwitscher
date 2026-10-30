import { Route, Routes } from "react-router";

import MainLayout from "@/layouts/MainLayout";
import Home from "@/routes/Home";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
      </Route>
    </Routes>
  );
}

export default App;
