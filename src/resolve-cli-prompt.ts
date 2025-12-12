export function resolveCliPrompt(
  promptArgument: string | undefined,
  stdinText?: string,
): string | undefined {
  const candidate = (promptArgument ?? stdinText)?.trimEnd();
  if (candidate === undefined) return undefined;
  const trimmedCandidate = candidate.trim();
  if (trimmedCandidate.length === 0) return undefined;
  return candidate;
}
