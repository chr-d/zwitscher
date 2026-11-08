import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "reicon-react";

import { useDeletePost } from "@/api/generated";
import { useAuth } from "@/auth/AuthContext";

const DeleteButton = ({ postId }: { postId: string }) => {
  const { hasSession, authFetch } = useAuth();
  const queryClient = useQueryClient();

  const { mutate: deletePost, isError } = useDeletePost({
    fetcher: authFetch,
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries();
      },
    },
  });

  const handleDelete = () => {
    if (!hasSession) return;
    deletePost({ id: postId });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleDelete}
        disabled={!hasSession}
        aria-label="Delete post"
        title="Delete post"
        className="ml-12 flex cursor-pointer items-center gap-1.5 text-base font-extrabold text-base-content focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary max-[500px]:gap-1 max-[500px]:text-sm"
      >
        <Trash2 aria-hidden="true" className="hover:text-accent" />
      </button>

      {isError && (
        <p role="alert" className="w-full text-sm font-semibold text-error">
          The post could not be deleted. Please try again.
        </p>
      )}
    </>
  );
};

export default DeleteButton;
