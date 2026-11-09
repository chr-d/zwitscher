import { Link, Navigate } from "react-router";

import { useGetLikedPosts } from "@/api/generated";
import { useAuth } from "@/auth/AuthContext";
import CreatePost from "@/components/CreatePostModal";
import PostCard from "@/components/PostCard";

const LikedByMe = () => {
  const { hasSession, authFetch } = useAuth();
  const { data, isLoading, isError } = useGetLikedPosts({
    fetcher: hasSession ? authFetch : fetch,
    query: { enabled: hasSession },
  });
  if (!hasSession) {
    return <Navigate to="/login" replace />;
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
      {data?.items.length === 0 ? (
        <div
          role="status"
          className="m-8 max-w-md rounded-[6px] bg-base-100 p-6 text-center text-base-content sm:m-16"
        >
          <h1 className="text-2xl font-bold">No liked posts yet</h1>
          <p className="mt-2">Like a post in the feed to see it here.</p>
          <Link to="/" className="btn mt-4 btn-primary">
            Browse posts
          </Link>
        </div>
      ) : (
        data?.items.map((post) => <PostCard post={post} key={post.id} />)
      )}
      <CreatePost />
    </main>
  );
};

export default LikedByMe;
