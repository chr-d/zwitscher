import type { ComponentProps } from "react";

type AuthFieldProps = ComponentProps<"input"> & {
  name: string;
  label: string;
  hint?: string;
  errors?: string[];
};

export default function AuthField({
  name,
  label,
  hint,
  errors,
  ...inputProps
}: AuthFieldProps) {
  return (
    <div className="grid gap-2">
      <label htmlFor={name} className="font-semibold">
        {label}
      </label>
      <input
        {...inputProps}
        id={name}
        name={name}
        className={`input w-full ${errors ? "input-error" : ""}`}
        title={hint}
      />
      {hint && (
        <p id={`${name}-hint`} className="text-xs">
          {hint}
        </p>
      )}
      {errors && (
        <p
          id={`${name}-error`}
          className="text-sm whitespace-pre-line text-error-content"
        >
          {errors.join("\n")}
        </p>
      )}
    </div>
  );
}
