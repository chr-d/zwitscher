import type { PostResponseDto } from "@/api/generated/models";
import LikeButton from "@/components/LikeButton";

const PostCard = ({ post }: { post: PostResponseDto }) => {
  // const {id, } = post;
  const Post = post;

  return (
    <div
      id={post.id}
      className="card m-[16px] w-[calc(100%_-_24px)] max-w-[600px] overflow-hidden rounded-[6px] bg-primary-content text-base-100 shadow-[0_4px_18px_rgba(90,169,230,0.25)] transition-transform duration-200 motion-safe:hover:-translate-y-0.5"
    >
      <div
        id="postHead"
        className="shrink-0 border-b border-[#5AA9E6] bg-linear-to-r from-primary to-secondary px-6 py-3 max-[500px]:px-4 max-[500px]:py-2"
      >
        <h2
          id="displayName"
          className="card-title block text-[24px] leading-tight font-black [overflow-wrap:anywhere] text-primary-content max-[500px]:text-[24px]"
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
