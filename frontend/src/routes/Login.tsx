import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";

import type { HttpValidationProblemDetails } from "@/api/generated/models";
import { useAuth } from "@/auth/AuthContext";
import { getValidationErrors } from "@/auth/validationErrors";
import AuthField from "@/components/AuthField";

export default function Login() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const registrationResult = location.state as {
    registered?: boolean;
    email?: string;
  } | null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const form = new FormData(event.currentTarget);
    setFieldErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await auth.login({
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
      });
      navigate("/", { replace: true });
    } catch (error) {
      const failure = error as {
        status?: number;
        info?: HttpValidationProblemDetails;
      } | null;
      if (failure?.status === 400) {
        const errors = getValidationErrors(failure.info, ["email", "password"]);
        setFieldErrors(errors.fieldErrors);
        setSubmitError(errors.message);
      } else {
        setSubmitError(
          failure?.status === 401
            ? "Incorrect email or password."
            : "Could not log in. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (auth.hasSession) return <Navigate to="/" replace />;

  return (
    <>
      <title>Login - zwitscher</title>
      <section className="flex min-h-full items-center justify-center bg-neutral px-4 py-8">
        <div className="card w-full max-w-md bg-base-100 text-base-content shadow-xl">
          <div className="card-body gap-6">
            <div>
              <h1 className="card-title text-2xl">Log in to Zwitscher</h1>
            </div>

            {registrationResult?.registered && (
              <div role="status" className="alert alert-success">
                Account created. Log in to start posting.
              </div>
            )}
            {(submitError || auth.error) && (
              <div role="alert" className="alert alert-error">
                {submitError ?? auth.error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <fieldset disabled={isSubmitting} className="fieldset gap-4 p-0">
                <legend className="sr-only">Login details</legend>
                <AuthField
                  name="email"
                  label="Email"
                  type="email"
                  required
                  defaultValue={registrationResult?.email}
                  errors={fieldErrors.email}
                />
                <AuthField
                  name="password"
                  label="Password"
                  type="password"
                  required
                  errors={fieldErrors.password}
                />
                <button type="submit" className="btn mt-2 btn-primary">
                  {isSubmitting && (
                    <span
                      aria-hidden="true"
                      className="loading loading-sm loading-spinner"
                    />
                  )}
                  {isSubmitting ? "Logging in…" : "Log in"}
                </button>
              </fieldset>
            </form>

            <p className="text-center text-sm">
              New to Zwitscher?{" "}
              <Link to="/register" className="link font-semibold link-primary">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
