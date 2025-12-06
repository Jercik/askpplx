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
```

## Agent Rule

Add this rule to your `CLAUDE.md` or `AGENTS.md` to enable automatic Perplexity lookups, no need to configure MCPs:

```markdown
# Rule: askpplx CLI Usage

Use `askpplx` to query Perplexity, an AI search engine combining real-time web search with advanced language models. Run it via `npx -y askpplx`.

Use concise prompts for quick facts and focused questions for deeper topics. If results are unexpected, refine your query and ask again.

Verification is fast and cheap, so prefer looking up information over making assumptions. Before first use, run `npx -y askpplx --help`.
```
