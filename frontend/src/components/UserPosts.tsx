import { useGetPostsByUser } from "@/api/generated/users/users";
import { useAuth } from "@/auth/AuthContext";
import CreatePost from "@/components/CreatePostModal";
import PostCard from "@/components/PostCard";

export default function UserPosts({
  identifier,
  showProfile = false,
}: {
  identifier: string;
  showProfile?: boolean;
}) {
  const { user, hasSession, authFetch } = useAuth();
  const { data, isPending, isError, error } = useGetPostsByUser(identifier, {
    fetcher: hasSession ? authFetch : fetch,
    query: {
      enabled: Boolean(identifier),
      retry: (failureCount, error) => error.status !== 404 && failureCount < 3,
    },
  });

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col items-center overflow-y-auto bg-neutral">
      {isPending ? (
        <p role="status" className="m-16 font-bold">
          Loading...
        </p>
      ) : isError ? (
        <p role="alert" className="m-16 font-bold text-accent">
          {error.status === 404 ? "User not found" : "Error loading posts"}
        </p>
      ) : (
        <>
          {showProfile && (
            <header className="m-4 w-[calc(100%_-_24px)] max-w-[600px] rounded-[6px] bg-base-100 p-6 text-base-content">
              <h1 className="text-2xl font-black [overflow-wrap:anywhere]">
                {data.user.displayName}
              </h1>
              <p className="mt-1 font-semibold [overflow-wrap:anywhere]">
                {data.user.userName}
              </p>
            </header>
          )}
          {data.items.length === 0 ? (
            <p className="m-16 font-bold">No posts yet</p>
          ) : (
            data.items.map((post) => <PostCard key={post.id} post={post} />)
          )}
          {hasSession && user?.id === data.user.id && <CreatePost />}
        </>
      )}
    </main>
  );
}
