# ask-pplx-cli

`ask-pplx-cli` is a minimal Unix-style CLI for querying Perplexity Sonar.

- Command name: `askpplx`
- Output: plain text/Markdown to stdout
- No MCPs, no agents, no plugins, no TUI
- Just a thin, script-friendly wrapper around the Perplexity API

## Examples

```bash
# simple question
askpplx "Explain Raft vs Paxos in simple terms"

# summarize file content using command substitution
askpplx "Summarize this diff: $(git diff HEAD~1)"
```
