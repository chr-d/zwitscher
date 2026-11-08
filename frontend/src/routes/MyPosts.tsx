import { useGetPostsByUser } from "@/api/generated/users/users";
import { useAuth } from "@/auth/AuthContext";
import CreatePost from "@/components/CreatePostModal";
import PostCard from "@/components/PostCard";

const MyPosts = () => {
  const { user, hasSession, authFetch } = useAuth();
  const userId = user?.id ?? "";
  const { data, isLoading, isError } = useGetPostsByUser(userId, {
    fetcher: hasSession ? authFetch : fetch,
    query: {
      enabled: Boolean(userId),
    },
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
        <PostCard key={post.id} post={post} />
      ))}
      <CreatePost />
    </main>
  );
};

export default MyPosts;
