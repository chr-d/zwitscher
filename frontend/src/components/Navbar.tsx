import { Heart, Home6, User } from "reicon-react";

const Navbar = () => {
  return (
    <div>
      <nav className="sticky z-50 flex gap-12 bg-base-300 max-[500px]:bottom-0 max-[500px]:left-0 max-[500px]:h-16 max-[500px]:w-full max-[500px]:flex-row max-[500px]:justify-center min-[501px]:top-0 min-[501px]:left-0 min-[501px]:h-screen min-[501px]:w-16 min-[501px]:flex-col min-[501px]:items-center">
        <button className="btn btn-square btn-ghost">
          <Heart weight="Filled" color="#85C8F2" />
        </button>
        <button className="btn btn-square btn-ghost">
          <Home6 weight="Filled" color="#85C8F2" />
        </button>
        <button className="btn btn-square btn-ghost">
          <User weight="Filled" color="#85C8F2" />
        </button>
      </nav>
    </div>
  );
};

export default Navbar;
