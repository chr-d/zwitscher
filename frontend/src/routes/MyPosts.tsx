import { useAuth } from "@/auth/AuthContext";
import UserPosts from "@/components/UserPosts";

const MyPosts = () => {
  const { user, hasSession } = useAuth();
  if (!hasSession) {
    return (
      <main className="flex h-full w-full flex-1 flex-col items-center overflow-y-auto bg-neutral">
        <p className="m-16 font-bold">Sign In | Log In</p>
      </main>
    );
  }
  return <UserPosts identifier={user?.id ?? ""} />;
};

export default MyPosts;
