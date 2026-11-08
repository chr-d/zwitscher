import type { HttpValidationProblemDetails } from "@/api/generated/models";

export function getValidationErrors(
  problem: HttpValidationProblemDetails | undefined,
  fieldNames: string[],
) {
  const fieldErrors: Record<string, string[]> = {};
  const otherErrors: string[] = [];

  // Validation uses property names, Identity uses codes like DuplicateEmail.
  for (const [key, messages] of Object.entries(problem?.errors ?? {})) {
    const field = fieldNames.find((name) =>
      key.toLowerCase().includes(name.toLowerCase()),
    );
    if (field) {
      fieldErrors[field] = [...(fieldErrors[field] ?? []), ...messages];
    } else {
      otherErrors.push(...messages);
    }
  }

  return {
    fieldErrors,
    message: otherErrors.length
      ? otherErrors.join(" ")
      : "Please check your details and try again.",
  };
}
