import { Route, Routes } from "react-router";

import MainLayout from "@/layouts/MainLayout";
import AuthTest from "@/routes/AuthTest";
import Home from "@/routes/Home";
import LikedByMe from "@/routes/LikedByMe";
import MyPosts from "@/routes/MyPosts";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="auth-test" element={<AuthTest />} />
        <Route path="myposts" element={<MyPosts />} />
        <Route path="likes" element={<LikedByMe />} />
      </Route>
    </Routes>
  );
}

export default App;
