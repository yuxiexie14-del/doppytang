#!/usr/bin/env bash
set -euo pipefail

activate_venv() {
  if [ -f .venv/bin/activate ]; then
    # shellcheck disable=SC1091
    source .venv/bin/activate
  elif [ -f .venv/Scripts/activate ]; then
    # shellcheck disable=SC1091
    source .venv/Scripts/activate
  else
    echo "Virtual environment .venv not found. Run scripts/cloud_bootstrap.sh first." >&2
    exit 1
  fi
}
