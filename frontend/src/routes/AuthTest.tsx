import { useState } from "react";

import { useAuth } from "@/auth/AuthContext";

export default function AuthTest() {
  const { user, isLoading, error, login, logout } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);

  async function handleLogin(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setLoginError(null);

    try {
      await login({
        email: String(data.get("email")).trim(),
        password: String(data.get("password")),
      });
      form.reset();
    } catch (error) {
      const status = (error as { status?: number } | null)?.status;
      setLoginError(
        status === 401
          ? "Incorrect email or password."
          : "Login failed. Please try again.",
      );
    }
  }

  const displayedError = loginError ?? error;

  return (
    <div>
      <p>Auth Test</p>

      <form onSubmit={handleLogin}>
        <p>
          <label>
            Email
            <input name="email" type="email" className="input" />
          </label>
        </p>
        <p>
          <label>
            Password
            <input name="password" type="password" className="input" />
          </label>
        </p>
        <p>
          {!user ? (
            <button type="submit" disabled={isLoading} className="btn">
              Log in
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setLoginError(null);
                logout();
              }}
              className="btn"
            >
              Log out
            </button>
          )}
        </p>
      </form>

      <p>
        {isLoading
          ? "Loading session..."
          : user
            ? `Logged in as ${user.userName}.`
            : "Not logged in."}
      </p>
      {displayedError && <p>Error: {displayedError}</p>}

      <div>
        <p>Current user:</p>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>
    </div>
  );
}
