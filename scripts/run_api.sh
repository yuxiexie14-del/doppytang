#!/usr/bin/env bash
set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/common.sh"
activate_venv

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
