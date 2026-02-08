# askpplx

`askpplx` is a minimal Unix-style CLI for querying Perplexity Sonar.

> **Perplexity AI** is an AI-powered search engine and answer engine that delivers concise, accurate responses to user queries by combining real-time web searches with advanced language models.

- Command name: `askpplx`
- Output: plain text or JSON to stdout
- No MCPs, no agents, no plugins, no TUI
- Just a thin, script-friendly wrapper around the Perplexity API

## Setup

Provide your Perplexity API key via environment variable or persistent storage:

```bash
# Option 1: Environment variable
export PERPLEXITY_API_KEY="pplx-..."

# Option 2: Store persistently
npx -y askpplx config --set-api-key "pplx-..."
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

Add this rule to your `CLAUDE.md` or `AGENTS.md`:

```markdown
# Rule: Use `askpplx` for Current Facts

At the start of each session, run `npx -y askpplx --help` to verify the CLI is available and configured properly and check available options.
When a task depends on current or uncertain external information, query `askpplx` instead of relying on memory.
```
