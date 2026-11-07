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
      <div className="navbar flex-wrap gap-3 rounded-b-sm bg-secondary px-4 py-3 text-base-content">
        <Link to="/" aria-label="Zwitscher home" className="shrink-0">
          <img src={logo} alt="Zwitscher" className="h-9 w-auto sm:h-12" />
        </Link>
        <nav
          aria-label="Account"
          className="ml-auto flex min-w-0 items-center gap-3"
        >
          {hasSession ? (
            <>
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
                className="btn btn-primary btn-sm"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
