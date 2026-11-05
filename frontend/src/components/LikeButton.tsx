import { Heart } from "reicon-react";

import {
  getGetPostsQueryKey,
  useLikePost,
  useUnlikePost,
} from "@/api/generated";
import { queryClient } from "@/api/queryClient";
import { useAuth } from "@/auth/AuthContext";

const LikeButton = ({
  postId,
  isLiked,
}: {
  postId: string;
  isLiked: boolean;
}) => {
  const { authFetch } = useAuth();

  const { mutate: likePost, isPending: isLiking } = useLikePost({
    fetcher: authFetch,
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetPostsQueryKey(),
        });
      },
    },
  });

  const { mutate: unlikePost, isPending: isUnliking } = useUnlikePost({
    fetcher: authFetch,
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetPostsQueryKey(),
        });
      },
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
