#!/usr/bin/env bash
set -euo pipefail

if (( $# == 0 )); then
  echo "Usage:" >&2
  echo "  commitlint.sh <commit-msg-file> [commitlint args...]" >&2
  echo "  commitlint.sh --last|--from <sha> --to <sha> [commitlint args...]" >&2
  exit 2
fi

# Build commitlint arguments
commitlint_args=()

if [[ "${1:-}" == --* ]]; then
  commitlint_args=("$@")
else
  commit_msg_path="$1"
  shift
  if [[ ! -f "$commit_msg_path" ]]; then
    echo "Commit message file not found: $commit_msg_path" >&2
    exit 2
  fi
  commitlint_args=(--edit "$commit_msg_path" "$@")
fi

# Add --verbose if not already present
has_verbose="false"
for arg in "${commitlint_args[@]}"; do
  if [[ "$arg" == "--verbose" ]]; then
    has_verbose="true"
    break
  fi
done
if [[ "$has_verbose" != "true" ]]; then
  commitlint_args+=(--verbose)
fi

# Run commitlint via npx with @commitlint/config-conventional.
# We resolve the package path from within the npx context (where the packages
# are installed) and use the absolute path in the config's extends array.
# This avoids module resolution issues when the config file is in a temp directory.
npx -y -p @commitlint/cli -p @commitlint/config-conventional sh -c '
  set -e
  config_path=$(node -e "console.log(require.resolve(\"@commitlint/config-conventional\"))")
  tmp_dir=$(mktemp -d)
  tmp_config="$tmp_dir/commitlint.config.cjs"
  trap "rm -rf \"$tmp_dir\"" EXIT
  echo "module.exports = { extends: [\"$config_path\"] };" > "$tmp_config"
  commitlint --config "$tmp_config" "$@"
' _ "${commitlint_args[@]}"
