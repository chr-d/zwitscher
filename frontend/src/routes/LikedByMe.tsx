import { useGetPosts } from "@/api/generated/posts/posts";
import { useAuth } from "@/auth/AuthContext";
import CreatePost from "@/components/CreatePostModal";
import PostCard from "@/components/PostCard";

const LikedByMe = () => {
  const { hasSession, authFetch } = useAuth();
  const { data, isLoading, isError } = useGetPosts({
    fetcher: hasSession ? authFetch : fetch,
  });
  if (isLoading) {
    return <main>Loading...</main>;
  }
  if (isError) {
    return <main>Error loading posts</main>;
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
