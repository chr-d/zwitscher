const PostCard = ({ post }) => {
  // const {id, } = post;
  const Post = post;

  return (
    <div>
      <div id="postHead">
        <h2 id="displayName">{Post.author.displayName}</h2>
      </div>
      <div id="postBody">
        <p id="postContent">{Post.content}</p>
      </div>
      <div id="likes">
        <p>❤️12</p>
      </div>
    </div>
  );
};

export default PostCard;
