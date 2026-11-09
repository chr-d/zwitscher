import { Link, useNavigate } from "react-router";

import logo from "@/assets/zwitscher.webp";
import { useAuth } from "@/auth/AuthContext";

const Header = () => {
  const { hasSession, user, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    void logout();
    navigate("/", { replace: true });
  }

  return (
    <header className="shrink-0">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 bg-secondary px-4 py-3 text-base-content">
        <Link
          to="/"
          aria-label="Zwitscher home"
          className="col-start-2 row-start-1 justify-self-center"
        >
          <img
            src={logo}
            alt="Zwitscher"
            className="h-9 w-auto min-[501px]:h-12"
          />
        </Link>
        {hasSession && (
          <nav
            aria-label="Account"
            className="col-span-3 col-start-1 row-start-2 flex max-w-full min-w-0 items-center gap-3 justify-self-end min-[501px]:col-span-1 min-[501px]:col-start-3 min-[501px]:row-start-1"
          >
            <span
              className="max-w-24 truncate font-semibold sm:max-w-64"
              title={user?.displayName}
            >
              {user?.displayName ??
                (isLoading ? "Loading account…" : "Signed in")}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="btn shrink-0 btn-primary btn-sm"
            >
              Log out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
