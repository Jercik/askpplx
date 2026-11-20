export async function resolveCliPrompt(
  promptArgument: string | undefined,
  readStdin: () => Promise<string | undefined>,
): Promise<string | undefined> {
  const candidate = (promptArgument ?? (await readStdin()))?.trimEnd();
  if (candidate === undefined) {
    return undefined;
  }
  const trimmedCandidate = candidate.trim();
  if (trimmedCandidate.length === 0) {
    return undefined;
  }
  return candidate;
}
