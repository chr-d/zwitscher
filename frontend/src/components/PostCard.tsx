import type { PostResponseDto } from "@/api/generated/models";
import LikeButton from "@/components/LikeButton";

const PostCard = ({ post }: { post: PostResponseDto }) => {
  // const {id, } = post;
  const Post = post;

  return (
    <div className="card m-[16px] min-h-[330px] w-[calc(100%_-_24px)] max-w-[600px] overflow-hidden rounded-[30px] border-[3px] border-primary bg-primary-content text-base-100 max-[500px]:min-h-[250px] max-[500px]:rounded-[22px] max-[500px]:border-2">
      <div
        id="postHead"
        className="shrink-0 border-b border-[#5AA9E6] bg-primary px-6 py-4 max-[500px]:px-4 max-[500px]:py-3"
      >
        <h2
          id="displayName"
          className="card-title block text-[40px] leading-tight font-black [overflow-wrap:anywhere] text-[#D4D4D4] max-[500px]:text-[28px]"
        >
          {Post.author.displayName}
        </h2>
      </div>

      <div
        id="postBody"
        className="flex-1 px-8 pt-3 pb-6 max-[500px]:px-4 max-[500px]:pt-2 max-[500px]:pb-4"
      >
        <p
          id="postContent"
          className="leading-relaxed font-semibold [overflow-wrap:anywhere] whitespace-pre-wrap text-base-content max-[500px]:text-sm"
        >
          {Post.content}
        </p>
      </div>

      <div
        id="likes"
        className="card-actions px-8 pb-5 max-[500px]:px-4 max-[500px]:pb-3"
      >
        <p className="flex items-center gap-1.5 text-base font-extrabold max-[500px]:gap-1 max-[500px]:text-sm">
          <LikeButton postId={post.id} isLiked={post.likedByMe} />
          <span
            aria-label={`${post.likeCount} Likes`}
            className="text-base-content"
          >
            {post.likeCount}
          </span>
        </p>
      </div>
    </div>
  );
};

export default PostCard;
