import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { Trash2 } from "reicon-react";

import { useDeletePost } from "@/api/generated";
import { useAuth } from "@/auth/AuthContext";

const DeleteButton = ({ postId }: { postId: string }) => {
  const { hasSession, authFetch } = useAuth();
  const queryClient = useQueryClient();
  const deleteInPending = useRef(false);

  const {
    mutate: deletePost,
    isPending,
    isError,
    error,
  } = useDeletePost({
    fetcher: authFetch,
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
    },
  });

  const handleDelete = () => {
    if (!hasSession || isPending || deleteInPending.current) return;
    if (!window.confirm("Delete this post? This can't be undone.")) return;

    deleteInPending.current = true;
    deletePost(
      { id: postId },
      {
        onSettled: () => {
          deleteInPending.current = false;
        },
      },
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={handleDelete}
        disabled={!hasSession || isPending}
        aria-label="Delete post"
        title="Delete post"
        className="ml-12 flex cursor-pointer items-center gap-1.5 text-base font-extrabold text-base-content focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 max-[500px]:gap-1 max-[500px]:text-sm"
      >
        {isPending ? (
          "Deleting…"
        ) : (
          <Trash2 aria-hidden="true" className="hover:text-accent" />
        )}
      </button>

      {isError && (
        <p role="alert" className="w-full text-sm font-semibold text-error">
          {error?.status === 403
            ? "You don't have permission to delete this post."
            : error?.status === 404
              ? "This post no longer exists. Refresh the page to update your posts."
              : "The post could not be deleted. Please try again."}
        </p>
      )}
    </>
  );
};

export default DeleteButton;
