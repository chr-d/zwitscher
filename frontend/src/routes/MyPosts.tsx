import { Navigate } from "react-router";

import { useAuth } from "@/auth/AuthContext";
import UserPosts from "@/components/UserPosts";

const MyPosts = () => {
  const { user, hasSession } = useAuth();
  if (!hasSession) {
    return <Navigate to="/login" replace />;
  }
  return <UserPosts identifier={user?.id ?? ""} />;
};

export default MyPosts;
