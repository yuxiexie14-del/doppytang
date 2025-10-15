#!/usr/bin/env bash
set -euo pipefail

python -m venv .venv
if [ -f .venv/bin/activate ]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
else
  # shellcheck disable=SC1091
  source .venv/Scripts/activate
fi

PIP_ARGS=(
  "--index-url" "https://pypi.org/simple"
  "--trusted-host" "pypi.org"
  "--trusted-host" "files.pythonhosted.org"
  "--no-cache-dir"
  "--timeout" "180"
)

if [ -f api/requirements.txt ]; then
  if ! pip install "${PIP_ARGS[@]}" -r api/requirements.txt; then
    pip install "${PIP_ARGS[@]}" -r requirements.txt
  fi
else
  pip install "${PIP_ARGS[@]}" -r requirements.txt
fi
