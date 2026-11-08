import { Heart } from "reicon-react";

import {
  getGetLikedPostsQueryKey,
  getGetPostsByUserQueryKey,
  getGetPostsQueryKey,
  useLikePost,
  useUnlikePost,
} from "@/api/generated";
import type { AuthorResponseDto } from "@/api/generated/models";
import { queryClient } from "@/api/queryClient";
import { useAuth } from "@/auth/AuthContext";

const LikeButton = ({
  postId,
  isLiked,
  author,
}: {
  postId: string;
  isLiked: boolean;
  author: AuthorResponseDto;
}) => {
  const { hasSession, authFetch } = useAuth();

  const invalidatePostQueries = () =>
    Promise.all(
      [
        getGetPostsQueryKey(),
        getGetPostsByUserQueryKey(author.id),
        getGetPostsByUserQueryKey(author.username.toLowerCase()),
        getGetLikedPostsQueryKey(),
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );

  const { mutate: likePost, isPending: isLiking } = useLikePost({
    fetcher: authFetch,
    mutation: {
      onSuccess: invalidatePostQueries,
    },
  });

  const { mutate: unlikePost, isPending: isUnliking } = useUnlikePost({
    fetcher: authFetch,
    mutation: {
      onSuccess: invalidatePostQueries,
    },
  });

  const isPending = isLiking || isUnliking;

  const handleToggleLike = () => {
    if (!hasSession || isPending) return;
    if (isLiked) {
      unlikePost({ id: postId });
    } else {
      likePost({ id: postId });
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleLike}
      disabled={!hasSession || isPending}
      className="cursor-pointer disabled:cursor-default"
    >
      {isLiked ? <Heart weight="Filled" color="red" /> : <Heart color="red" />}
    </button>
  );
};

export default LikeButton;
