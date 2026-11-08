import { useState } from "react";
import { X } from "reicon-react";

import type { PostResponseDto } from "@/api/generated/models";
import {
  getGetPostsQueryKey,
  useUpdatePost,
} from "@/api/generated/posts/posts";
import {
  getGetLikedPostsQueryKey,
  getGetPostsByUserQueryKey,
} from "@/api/generated/users/users";
import { queryClient } from "@/api/queryClient";
import { useAuth } from "@/auth/AuthContext";

const EditPostModal = ({
  post,
  onClose,
}: {
  post: PostResponseDto;
  onClose: () => void;
}) => {
  const [content, setContent] = useState(post.content);
  const { authFetch } = useAuth();
  const text = content.trim();
  const isValid = text.length >= 2 && text.length <= 300;

  const {
    mutate: updatePost,
    isError,
    isPending,
  } = useUpdatePost({
    fetcher: authFetch,
    mutation: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetPostsQueryKey() }),
          queryClient.invalidateQueries({
            queryKey: getGetPostsByUserQueryKey(post.author.id),
          }),
          queryClient.invalidateQueries({
            queryKey: getGetLikedPostsQueryKey(),
          }),
        ]);
        onClose();
      },
    },
  });

  return (
    <dialog
      ref={(dialog) => {
        if (dialog && !dialog.open) {
          dialog.showModal();
        }
      }}
      onClose={onClose}
      onCancel={(event) => {
        if (isPending) event.preventDefault();
      }}
      aria-label="Edit post"
      className="modal p-4 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="card modal-box max-h-[calc(100dvh-32px)] min-h-[330px] w-full max-w-[600px] overflow-y-auto rounded-[6px] bg-primary-content p-0 text-base-100 shadow-none transition-transform duration-200 motion-safe:hover:-translate-y-0.5 max-[500px]:min-h-[250px]">
        <div className="flex shrink-0 items-center gap-4 border-b border-[#5AA9E6] bg-linear-to-r from-primary to-secondary px-6 py-3 max-[500px]:px-4 max-[500px]:py-2">
          <h2 className="card-title block min-w-0 flex-1 text-[24px] leading-tight font-black [overflow-wrap:anywhere] text-primary-content max-[500px]:text-[24px]">
            {post.author.displayName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Close modal"
            className="shrink-0 btn-ghost text-primary-content transition-colors hover:bg-transparent hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X />
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!isValid || isPending) return;

            updatePost({ id: post.id, data: { content: text } });
          }}
        >
          <div className="flex-1 px-8 pt-3 pb-6 max-[500px]:px-4 max-[500px]:pt-2 max-[500px]:pb-4">
            <label className="block">
              <span className="sr-only">Post content</span>
              <textarea
                name="content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Here goes your content, use 2 - 300 characters"
                maxLength={300}
                required
                autoFocus
                disabled={isPending}
                className="min-h-[160px] w-full flex-1 rounded-[6px] border border-primary/30 bg-transparent p-3 text-base-content transition-colors placeholder:text-base-content/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none max-[500px]:min-h-[100px]"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={!isValid || isPending}
            className="btn mx-auto my-4 flex rounded-[6px] border-0 bg-secondary px-6 font-bold text-primary-content transition duration-200 hover:brightness-110"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </form>
        {isError && (
          <p role="alert" className="px-4 pb-4 text-center text-error">
            The post could not be edited. Please try again.
          </p>
        )}
      </div>
    </dialog>
  );
};

export default EditPostModal;
