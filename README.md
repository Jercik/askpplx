# askpplx

Source: https://code.j4k.dev/j4k-oss/askpplx. github.com/Jercik/askpplx is a read-only mirror; open issues and pull requests on the Forge.

`askpplx` is a minimal Unix-style CLI for querying Perplexity Sonar.

> **Perplexity AI** is an AI-powered search engine and answer engine that delivers concise, accurate responses to user queries by combining real-time web searches with advanced language models.

- Command name: `askpplx`
- Output: plain text or JSON to stdout
- No MCPs, no agents, no plugins, no TUI
- Just a thin, script-friendly wrapper around the Perplexity API

## Installation

`askpplx` is published only as `@j4k-oss/askpplx` on the `code.j4k.dev` registry, which reads anonymously. The unscoped `askpplx` on npmjs.org is frozen at its last version and gets no updates.

The `@j4k-oss` scope also exists on npmjs.org, where its owner is not confirmed. Without a registry mapping, `npm` can fetch a package of that name from there, so map the scope to `code.j4k.dev`. Do it once in `~/.npmrc`:

```ini
@j4k-oss:registry=https://code.j4k.dev/api/packages/j4k-oss/npm/
```

The inline flag below is enough for a single `npx` run. Keep the `~/.npmrc` line for global installs: `npm update -g` and `npm outdated -g` read the registry from your configuration, and without the line they look the scoped name up on npmjs.org.

If you installed the unscoped `askpplx` globally, run `npm uninstall -g askpplx` first. Both packages provide the `askpplx` command, so `npm install -g` would stop with `EEXIST`.

```bash
# global
npm install -g --@j4k-oss:registry=https://code.j4k.dev/api/packages/j4k-oss/npm/ @j4k-oss/askpplx

# one-off
npx -y --@j4k-oss:registry=https://code.j4k.dev/api/packages/j4k-oss/npm/ @j4k-oss/askpplx@latest --help
```

In a pnpm project, map the scope to its registry and exempt it from `minimumReleaseAge` in `pnpm-workspace.yaml`, then add the package:

```yaml
registries:
  "@j4k-oss": https://code.j4k.dev/api/packages/j4k-oss/npm/
minimumReleaseAgeExclude:
  - "@j4k-oss/*"
```

```bash
pnpm add -D @j4k-oss/askpplx
```

The examples below run the globally installed `askpplx`.

## Setup

Provide your Perplexity API key via environment variable or persistent storage:

```bash
# Option 1: Environment variable
export PERPLEXITY_API_KEY="pplx-..."

# Option 2: Store persistently
askpplx config --set-api-key "pplx-..."
```

## Examples

```bash
# simple question
askpplx "Explain Raft vs Paxos in simple terms"

# web-enabled search with local context
askpplx "What are breaking changes in React 19 that affect this code? $(cat src/app.tsx)"

# read prompt from stdin (filter style)
cat article.txt | askpplx -S "Summarize this article"

# extract plain text from JSON response
askpplx "Node.js LTS version" --json | jq -r '.text'

# list cited source URLs
askpplx "Latest TypeScript release notes" --json | jq -r '.sources[].url' | sort -u
```

## Agent Rule

With `askpplx` installed globally, add this rule to your `CLAUDE.md` or `AGENTS.md`:

```markdown
# Rule: Use `askpplx` for Current Facts

At the start of each session, run `askpplx --help` to check CLI availability, available options, and whether an API key is present.
When a task depends on current or uncertain external information, query `askpplx` instead of relying on memory.
```
