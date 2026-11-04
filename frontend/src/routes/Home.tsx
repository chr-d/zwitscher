import { useGetPosts } from "@/api/generated/posts/posts";

const Home = () => {
  const { data, isLoading, isError } = useGetPosts();
  if (isLoading) {
    return <main>Loading...</main>;
  }
  if (isError) {
    return <main>Error loading posts</main>;
  }
  return (
    <main>
      {" "}
      {data?.items.map((post) => (
        <div key={post.id}>
          <p>{post.author.displayName}</p>
          {post.content}
        </div>
      ))}{" "}
    </main>
  );
};

export default Home;
