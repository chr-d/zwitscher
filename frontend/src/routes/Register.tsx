import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";

import { useRegister } from "@/api/generated/auth/auth";
import type { HttpValidationProblemDetails } from "@/api/generated/models";
import { useAuth } from "@/auth/AuthContext";
import { getValidationErrors } from "@/auth/validationErrors";
import AuthField from "@/components/AuthField";

export default function Register() {
  const auth = useAuth();
  const registration = useRegister({ mutation: { retry: false } });
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    setFieldErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await registration.mutateAsync({
        data: {
          userName: String(form.get("userName") ?? "").trim(),
          displayName: String(form.get("displayName") ?? "").trim(),
          email,
          password: String(form.get("password") ?? ""),
        },
      });
      navigate("/login", {
        replace: true,
        state: { registered: true, email },
      });
    } catch (error) {
      const failure = error as {
        status?: number;
        info?: HttpValidationProblemDetails;
      } | null;
      if (failure?.status === 400) {
        const errors = getValidationErrors(failure.info, [
          "displayName",
          "userName",
          "email",
          "password",
        ]);
        setFieldErrors(errors.fieldErrors);
        setSubmitError(errors.message);
      } else {
        setSubmitError("Could not create your account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (auth.hasSession) return <Navigate to="/" replace />;

  return (
    <>
      <title>Register - zwitscher</title>
      <section className="flex min-h-full items-center justify-center bg-neutral px-4 py-8">
        <div className="card w-full max-w-md bg-base-100 text-base-content shadow-xl">
          <div className="card-body gap-6">
            <div>
              <h1 className="card-title text-2xl">Create your account</h1>
              <p className="mt-2 text-sm">
                Join Zwitscher and share your thoughts.
              </p>
            </div>

            {(submitError || auth.error) && (
              <div role="alert" className="alert alert-error">
                {submitError ?? auth.error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <fieldset disabled={isSubmitting} className="fieldset gap-4 p-0">
                <legend className="sr-only">Registration details</legend>
                <AuthField
                  name="userName"
                  label="User Handle"
                  type="text"
                  minLength={3}
                  maxLength={30}
                  pattern="[a-z0-9_]*[a-z0-9][a-z0-9_]*"
                  hint="3-30 lowercase letters, numbers or underscores"
                  required
                  errors={fieldErrors.userName}
                />
                <AuthField
                  name="displayName"
                  label="Display Name"
                  type="text"
                  minLength={2}
                  maxLength={50}
                  hint="2-50 characters"
                  required
                  errors={fieldErrors.displayName}
                />
                <AuthField
                  name="email"
                  label="Email"
                  type="email"
                  maxLength={256}
                  required
                  errors={fieldErrors.email}
                />
                <AuthField
                  name="password"
                  label="Password"
                  type="password"
                  minLength={8}
                  hint="At least 8 characters, including uppercase, lowercase, a number and a symbol"
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
                  {isSubmitting ? "Creating account…" : "Create account"}
                </button>
              </fieldset>
            </form>

            <p className="text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="link font-semibold link-primary">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
