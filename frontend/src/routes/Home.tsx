import { Link } from "react-router";

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
      <div>
        <p className="m-16 font-bold">Loading...</p>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="flex h-full w-full flex-1 flex-col items-center overflow-y-auto bg-neutral">
        <p className="m-16 font-bold text-accent">Error loading posts</p>
      </div>
    );
  }
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center overflow-y-auto bg-neutral">
      {data?.items.length === 0 ? (
        <div
          role="status"
          className="m-8 max-w-md rounded-[6px] bg-base-100 p-6 text-center text-base-content sm:m-16"
        >
          <h1 className="text-2xl font-bold">No posts yet</h1>
          <p className="mt-2">
            {hasSession
              ? "Be the first to share a post. Use the + button to get started."
              : "Log in to share the first post."}
          </p>
          {!hasSession && (
            <Link to="/login" className="btn mt-4 btn-primary">
              Log in
            </Link>
          )}
        </div>
      ) : (
        data?.items.map((post) => <PostCard post={post} key={post.id} />)
      )}
      <CreatePost />
    </div>
  );
};

export default Home;
