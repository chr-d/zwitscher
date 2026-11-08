import { NavLink } from "react-router";
import { Heart, Home6, User } from "reicon-react";

const Navbar = () => {
  return (
    <div>
      <nav className="sticky z-50 flex gap-12 bg-base-200 max-[500px]:bottom-0 max-[500px]:left-0 max-[500px]:h-16 max-[500px]:w-full max-[500px]:flex-row max-[500px]:justify-center max-[500px]:p-3 min-[500px]:pt-8 min-[501px]:top-0 min-[501px]:left-0 min-[501px]:h-screen min-[501px]:w-16 min-[501px]:flex-col min-[501px]:items-center">
        <button className="min-[500px] btn btn-square btn-ghost">
          <NavLink to="/likes">
            <Heart weight="Filled" color="var(--color-secondary)" />
          </NavLink>
        </button>
        <button className="btn btn-square btn-ghost">
          <NavLink to="/">
            <Home6 weight="Filled" color="var(--color-secondary)" />
          </NavLink>
        </button>
        <button className="btn btn-square btn-ghost">
          <NavLink to="/myposts">
            <User weight="Filled" color="var(--color-secondary)" />
          </NavLink>
        </button>
      </nav>
    </div>
  );
};

export default Navbar;
