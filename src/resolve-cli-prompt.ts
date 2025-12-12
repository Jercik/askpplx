export function resolveCliPrompt(
  promptArgument: string | undefined,
  stdinText?: string,
): string | undefined {
  const candidate = (promptArgument ?? stdinText)?.trimEnd();
  if (!candidate) return undefined;
  if (candidate.trim().length === 0) return undefined;
  return candidate;
}
