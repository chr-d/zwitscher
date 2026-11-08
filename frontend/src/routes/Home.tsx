import { useGetPosts } from "@/api/generated/posts/posts";
import { useAuth } from "@/auth/AuthContext";
import CreatePost from "@/components/CreatePostModal";
import PostCard from "@/components/PostCard";

const Home = () => {
  const { hasSession, authFetch } = useAuth();
  const { data, isLoading, isError } = useGetPosts({
    fetcher: hasSession ? authFetch : fetch,
  });
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
        <PostCard post={post} key={post.id} />
      ))}
      <CreatePost />
    </main>
  );
};

export default Home;
