/** Shared password rule (matches the Supabase setting: min 10 characters, letters and digits). */
export const PASSWORD_MIN = 10;
export const PASSWORD_HINT = "At least 10 characters, with letters and numbers.";

export function passwordProblem(pw: string): string | null {
  if (pw.length < PASSWORD_MIN || !/[a-z]/i.test(pw) || !/\d/.test(pw)) return `Use a stronger password: ${PASSWORD_HINT.toLowerCase()}`;
  return null;
}
