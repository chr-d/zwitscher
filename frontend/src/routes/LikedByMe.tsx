import { useGetLikedPostsByUser } from "@/api/generated";
import { useAuth } from "@/auth/AuthContext";
import CreatePost from "@/components/CreatePostModal";
import PostCard from "@/components/PostCard";

const LikedByMe = () => {
  const { hasSession, authFetch } = useAuth();
  const { data, isLoading, isError } = useGetLikedPostsByUser({
    fetcher: hasSession ? authFetch : fetch,
  });
  if (!hasSession) {
    return (
      <main className="flex h-full w-full flex-1 flex-col items-center overflow-y-auto bg-neutral">
        <p className="m-16 font-bold">Sign In | Log In</p>
      </main>
    );
  }
  if (isLoading) {
    return (
      <main>
        <p className="m-16 font-bold">Loading...</p>
      </main>
    );
  }
  if (isError) {
    return (
      <main className="flex h-full w-full flex-1 flex-col items-center overflow-y-auto bg-neutral">
        <p className="m-16 font-bold text-accent">Error loading posts</p>
      </main>
    );
  }
  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col items-center overflow-y-auto bg-neutral">
      {data?.items.map((post) => (
        <PostCard post={post} />
      ))}
      <CreatePost />
    </main>
  );
};

export default LikedByMe;
