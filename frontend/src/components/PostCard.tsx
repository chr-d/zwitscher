import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Edit } from "reicon-react";

import type { PostResponseDto } from "@/api/generated/models";
import { useAuth } from "@/auth/AuthContext";
import DeleteButton from "@/components/DeleteButton";
import EditPostModal from "@/components/EditPostModal";
import LikeButton from "@/components/LikeButton";
import PostDate from "@/components/PostDate";

const PostCard = ({ post }: { post: PostResponseDto }) => {
  // const {id, } = post;
  const Post = post;
  const { pathname } = useLocation();
  const { hasSession } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const canEdit = pathname === "/myposts" && hasSession && post.canEdit;

  return (
    <div
      id={post.id}
      className="card m-[16px] w-[calc(100%_-_32px)] max-w-[600px] overflow-hidden rounded-[6px] bg-primary-content text-base-100 shadow-[0_4px_18px_rgba(90,169,230,0.25)] transition-transform duration-200 motion-safe:hover:-translate-y-0.5"
    >
      <div
        id="postHead"
        className="shrink-0 border-b border-[#5AA9E6] bg-linear-to-r from-primary to-secondary px-6 py-3 max-[500px]:px-4 max-[500px]:py-2"
      >
        <h2
          id="displayName"
          className="card-title block text-[24px] leading-tight font-black [overflow-wrap:anywhere] text-primary-content max-[500px]:text-[24px]"
        >
          <Link
            to={`/user/${encodeURIComponent(Post.author.username)}`}
            className="hover:underline focus-visible:underline"
          >
            {Post.author.displayName}
          </Link>
        </h2>
      </div>

      <div
        id="postBody"
        className="flex-1 px-8 pt-3 pb-6 max-[500px]:px-4 max-[500px]:pt-2 max-[500px]:pb-4"
      >
        <p
          id="postContent"
          className="leading-relaxed font-semibold [overflow-wrap:anywhere] whitespace-pre-wrap text-base-content"
        >
          {Post.content}
        </p>
      </div>
      <div
        id="likes"
        className="card-actions items-center px-8 pb-5 max-[500px]:px-4 max-[500px]:pb-3"
      >
        <p className="flex items-center gap-1.5 text-base font-extrabold max-[500px]:gap-1 max-[500px]:text-sm">
          <LikeButton
            postId={post.id}
            isLiked={post.likedByMe}
            author={post.author}
          />
          <span
            aria-label={`${post.likeCount} Likes`}
            className="text-base-content"
          >
            {post.likeCount}
          </span>
        </p>
        {canEdit && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label="Edit post"
            className="ml-12 flex cursor-pointer items-center gap-1.5 text-base font-extrabold text-base-content focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary max-[500px]:gap-1 max-[500px]:text-sm"
          >
            <Edit />
          </button>
        )}
        {canEdit && <DeleteButton postId={post.id} />}
        <PostDate
          createdAtUtc={post.createdAtUtc}
          updatedAtUtc={post.updatedAtUtc}
        />
      </div>
      {canEdit && isEditing && (
        <EditPostModal post={post} onClose={() => setIsEditing(false)} />
      )}
    </div>
  );
};

export default PostCard;
