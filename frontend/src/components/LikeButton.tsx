import { type QueryKey, useQueryClient } from "@tanstack/react-query";
import { Heart } from "reicon-react";

import {
  getGetLikedPostsQueryKey,
  getGetPostsByUserQueryKey,
  getGetPostsQueryKey,
  useLikePost,
  useUnlikePost,
} from "@/api/generated";
import { useAuth } from "@/auth/AuthContext";

const LikeButton = ({
  postId,
  isLiked,
}: {
  postId: string;
  isLiked: boolean;
}) => {
  const { authFetch, user } = useAuth();
  const queryClient = useQueryClient();

  const refreshPosts = async () => {
    const queryKeys: QueryKey[] = [
      getGetPostsQueryKey(),
      getGetLikedPostsQueryKey(),
    ];
    if (user) {
      queryKeys.push(getGetPostsByUserQueryKey(user.id));
    }

    await Promise.all(
      queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    );
  };

  const { mutate: likePost, isPending: isLiking } = useLikePost({
    fetcher: authFetch,
    mutation: {
      onSuccess: refreshPosts,
    },
  });

  const { mutate: unlikePost, isPending: isUnliking } = useUnlikePost({
    fetcher: authFetch,
    mutation: {
      onSuccess: refreshPosts,
    },
  });

  const isPending = isLiking || isUnliking;

  const handleToggleLike = () => {
    if (isLiked) {
      unlikePost({ id: postId });
    } else {
      likePost({ id: postId });
    }
  };

  return (
    <button
      onClick={handleToggleLike}
      disabled={isPending}
      className="cursor-pointer"
    >
      {isLiked ? <Heart weight="Filled" color="red" /> : <Heart color="red" />}
    </button>
  );
};

export default LikeButton;
