#!/usr/bin/env bash

set -euo pipefail

mode="${1:-fast}"
if [[ $# -gt 0 ]]; then
  shift
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base)
      [[ $# -ge 2 ]] || { echo "--base requires a value" >&2; exit 2; }
      shift 2
      ;;
    --no-fetch)
      shift
      ;;
    *)
      echo "Unsupported argument: $1" >&2
      exit 2
      ;;
  esac
done

case "${mode}" in
  checks-only|fast|full) ;;
  *)
    echo "Unsupported verification mode: ${mode}" >&2
    exit 2
    ;;
esac

git diff --check
yarn install --immutable
yarn build

changed_javascript=()
while IFS= read -r path; do
  changed_javascript+=("${path}")
done < <(git diff --cached --name-only --diff-filter=ACMR -- '*.js')

if [[ ${#changed_javascript[@]} -gt 0 ]]; then
  yarn eslint "${changed_javascript[@]}"
else
  echo "No JavaScript files changed; incremental ESLint was not required."
fi

echo "Verification limitation: repository-wide lint has substantial pre-existing failures and the unit-test script is a placeholder. Changed JavaScript is linted; authoritative CI and human review remain required."
