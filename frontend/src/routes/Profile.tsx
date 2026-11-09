import { useParams } from "react-router";

import UserPosts from "@/components/UserPosts";

export default function Profile() {
  const { username = "" } = useParams<{ username: string }>();
  return (
    <>
      <title>{`@${username} - zwitscher`}</title>
      <UserPosts identifier={username.toLowerCase()} showProfile />
    </>
  );
}
