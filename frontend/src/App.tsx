import { useGetPosts } from "@/api/generated";

function App() {
  const { data, isPending, isError } = useGetPosts();
  if (isPending) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>An error occurred.</div>;
  }
  return (
    <div>
      <div>{data.author.displayName}</div>
      <div>{new Date(data.createdAtUtc).toLocaleDateString()}</div>
      <div>{data.content}</div>
      <div>{data.likeCount} Likes</div>
    </div>
  );
}

export default App;
