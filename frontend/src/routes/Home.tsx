import { useGetPosts } from "@/api/generated/posts/posts";
import PostCard from "@/components/PostCard";

const Home = () => {
  // const { mutate } = useCreatePost();
  const { data, isLoading, isError } = useGetPosts();
  if (isLoading) {
    return <main>Loading...</main>;
  }
  if (isError) {
    return <main>Error loading posts</main>;
  }
  return (
    <main>
      {data?.items.map((post) => (
        <PostCard post={post} />
      ))}
    </main>
  );
};

export default Home;
