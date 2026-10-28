import { useGetPosts } from "@/api/generated/zwitscher";

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
      {data.id}
      {data.author.displayName}
      {data.createdAtUtc}
      {data.content}
    </div>
  );
}

export default App;
