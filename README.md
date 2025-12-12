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

Add this rule to your `CLAUDE.md` or `AGENTS.md` to enable automatic Perplexity lookups, no need to configure MCPs:

```markdown
# Rule: `askpplx` CLI Usage

**MANDATORY:** Run `npx -y askpplx --help` at the start of every agent session to learn available options and confirm the tool is working.

Use `askpplx` to query Perplexity, an AI search engine combining real-time web search with advanced language models.

## Why This Matters

- **Ground your knowledge:** Your training data has a cutoff date. Real-time search ensures you work with current information—correct API signatures, latest versions, up-to-date best practices.
- **Save time and resources:** A quick lookup is far cheaper than debugging hallucinated code or explaining why an approach failed. When in doubt, verify first.
- **Reduce false confidence:** Even when you feel certain, external verification catches subtle errors before they compound into larger problems.
- **Stay current:** Libraries change, APIs deprecate, patterns evolve. What was correct six months ago may be wrong today.

## Usage Guidelines

Use concise prompts for quick facts and focused questions for deeper topics. If results are unexpected, refine your query and ask again. Verification is fast and cheap—prefer looking up information over making assumptions.
```
