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
    <main className="flex min-h-0 min-w-0 flex-1 flex-col items-center overflow-y-auto bg-[#30383C]">
      {data?.items.map((post) => (
        <PostCard post={post} />
      ))}
    </main>
  );
};

export default Home;
