import { Route, Routes } from "react-router";

import MainLayout from "@/layouts/MainLayout";
import Home from "@/routes/Home";
import LikedByMe from "@/routes/LikedByMe";
import Login from "@/routes/Login";
import MyPosts from "@/routes/MyPosts";
import Profile from "@/routes/Profile";
import Register from "@/routes/Register";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="myposts" element={<MyPosts />} />
        <Route path="user/:username" element={<Profile />} />
        <Route path="likes" element={<LikedByMe />} />
      </Route>
    </Routes>
  );
}

export default App;
